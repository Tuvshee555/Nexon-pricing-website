import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { sql } from "@/lib/db";
import { maybeSendLowCreditAlert } from "@/lib/credit-alerts";
import { appendKnowledgeSection } from "@/lib/bot-prompt";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (appSecret) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 403 });
      }
      const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const body = JSON.parse(rawBody);
    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ error: "Not a page event" }, { status: 200 });
    }

    for (const entry of body.entry || []) {
      const messaging = entry.messaging || entry.changes?.[0]?.value?.messages;
      if (!messaging) continue;

      const pageId = entry.id as string;
      const pageAccounts = await sql`
        SELECT business_id, page_access_token FROM platform_accounts WHERE page_id = ${pageId} LIMIT 1
      `;
      const pageAccount = pageAccounts[0] ?? null;
      console.log(`[webhook] pageId=${pageId} found=${!!pageAccount} businessId=${pageAccount?.business_id}`);
      const pageAccessToken: string | undefined =
        (pageAccount?.page_access_token as string | undefined) ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

      for (const event of messaging) {
        const platform = body.object === "instagram" ? "instagram" : "messenger";
        const senderId = event.sender?.id || event.from?.id;
        const messageText = event.message?.text || event.text;
        console.log(`[webhook] event senderId=${senderId} text=${messageText?.slice(0, 50)}`);
        if (!senderId || !messageText) continue;

        let businessId: string | null = (pageAccount?.business_id as string) ?? null;
        if (!businessId) {
          const senderAccounts = await sql`
            SELECT business_id FROM platform_accounts
            WHERE platform = ${platform} AND external_id = ${senderId} LIMIT 1
          `;
          businessId = (senderAccounts[0]?.business_id as string) ?? null;
        }
        if (!businessId) continue;

        const [businesses, creditsRows, threads, keywordTriggers] = await Promise.all([
          sql`SELECT bot_prompt, status, knowledge_json FROM businesses WHERE id = ${businessId} LIMIT 1`,
          sql`SELECT balance FROM credits WHERE business_id = ${businessId} LIMIT 1`,
          sql`
            SELECT messages FROM conversation_threads
            WHERE business_id = ${businessId} AND platform = ${platform} AND sender_id = ${senderId}
            LIMIT 1
          `,
          sql`
            SELECT keyword, match_type, response FROM keyword_triggers
            WHERE business_id = ${businessId} AND enabled = true
            AND (platform = 'all' OR platform = ${platform})
          `,
        ]);

        const business = businesses[0] ?? null;
        console.log(`[webhook] business status=${business?.status} credits=${creditsRows[0]?.balance}`);
        if (!business || business.status !== "active") continue;

        // Check keyword triggers first (bypass AI)
        const lowerText = messageText.toLowerCase();
        const matchedTrigger = (keywordTriggers as Array<{ keyword: string; match_type: string; response: string }>).find((t) => {
          const kw = t.keyword.toLowerCase();
          if (t.match_type === "exact") return lowerText === kw;
          if (t.match_type === "starts_with") return lowerText.startsWith(kw);
          return lowerText.includes(kw); // contains (default)
        });

        if (matchedTrigger && pageAccessToken) {
          await sendFacebookMessage(senderId, matchedTrigger.response, platform, pageAccessToken);
          // Still log the conversation
          const existingMessages: Array<{ role: string; content: string }> = Array.isArray(threads[0]?.messages)
            ? (threads[0].messages as Array<{ role: string; content: string }>)
            : [];
          const updatedMessages = [
            ...existingMessages,
            { role: "user", content: messageText },
            { role: "assistant", content: matchedTrigger.response },
          ].slice(-100);
          await sql`
            INSERT INTO conversation_threads (business_id, platform, sender_id, messages, last_message_at)
            VALUES (${businessId}, ${platform}, ${senderId}, ${JSON.stringify(updatedMessages)}, NOW())
            ON CONFLICT (business_id, platform, sender_id)
            DO UPDATE SET messages = ${JSON.stringify(updatedMessages)}, last_message_at = NOW()
          `;
          continue;
        }

        const credits = creditsRows[0] ?? null;
        if (!credits || (credits.balance as number) <= 0) {
          if (pageAccessToken) {
            await sendFacebookMessage(
              senderId,
              "Ð¢Ð°Ð½Ñ‹ ÐºÑ€ÐµÐ´Ð¸Ñ‚ Ð´ÑƒÑƒÑÑÐ°Ð½ Ð±Ð°Ð¹Ð½Ð°. Nexon Ñ…ÑÐ½Ð°Ð»Ñ‚Ñ‹Ð½ ÑÐ°Ð¼Ð±Ð°Ñ€Ð°Ð°Ñ ÐºÑ€ÐµÐ´Ð¸Ñ‚ Ð½ÑÐ¼Ð½Ñ Ò¯Ò¯.",
              platform,
              pageAccessToken
            );
          }
          continue;
        }

        const systemPrompt = appendKnowledgeSection(
          (business.bot_prompt as string) || "Ð¢Ð° Ñ‚ÑƒÑÐ»Ð°Ñ… AI Ð±Ð°Ð¹Ð½Ð°.",
          business.knowledge_json
        );
        const fullHistory: Array<{ role: string; content: string }> = Array.isArray(threads[0]?.messages)
          ? (threads[0].messages as Array<{ role: string; content: string }>)
          : [];
        const recentContext = fullHistory.slice(-20);

        const openaiMessages = [
          { role: "system", content: systemPrompt },
          ...recentContext,
          { role: "user", content: messageText },
        ];

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: openaiMessages,
            max_tokens: 500,
          }),
        });
        if (!openaiRes.ok) {
          console.error("[webhook] OpenAI error:", await openaiRes.text());
          continue;
        }

        const openaiData = await openaiRes.json();
        console.log(`[webhook] OpenAI OK, reply length=${openaiData?.choices?.[0]?.message?.content?.length}`);
        const reply = openaiData.choices?.[0]?.message?.content || "";
        const usage = openaiData.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };
        const creditsUsed = Math.max(1, Math.ceil(usage.total_tokens / 1000));

        const deducted = await sql`
          UPDATE credits
          SET balance = balance - ${creditsUsed}
          WHERE business_id = ${businessId} AND balance >= ${creditsUsed}
          RETURNING balance
        `;
        if (!deducted.length) continue;

        void maybeSendLowCreditAlert(businessId).catch((error) => {
          console.error("Low credit alert check failed:", error);
        });

        await sql`
          INSERT INTO message_logs (
            business_id, platform, message_count, prompt_tokens, completion_tokens, total_tokens, credits_used, source
          )
          VALUES (
            ${businessId}, ${platform}, 1, ${usage.prompt_tokens}, ${usage.completion_tokens}, ${usage.total_tokens}, ${creditsUsed}, 'api'
          )
        `;

        const updatedMessages = [
          ...fullHistory,
          { role: "user", content: messageText },
          { role: "assistant", content: reply },
        ].slice(-100);

        await sql`
          INSERT INTO conversation_threads (business_id, platform, sender_id, messages, last_message_at)
          VALUES (${businessId}, ${platform}, ${senderId}, ${JSON.stringify(updatedMessages)}, NOW())
          ON CONFLICT (business_id, platform, sender_id)
          DO UPDATE SET messages = ${JSON.stringify(updatedMessages)}, last_message_at = NOW()
        `;

        if (pageAccessToken) {
          await sendFacebookMessage(senderId, reply, platform, pageAccessToken);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function sendFacebookMessage(
  recipientId: string,
  text: string,
  platform: string,
  pageAccessToken: string
): Promise<void> {
  void platform;
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    });
    if (!res.ok) {
      console.error("FB send error:", await res.text());
    }
  } catch (err) {
    console.error("FB send failed:", err);
  }
}
