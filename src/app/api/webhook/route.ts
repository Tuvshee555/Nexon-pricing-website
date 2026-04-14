import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { sql } from "@/lib/db";
import { appendKnowledgeSection } from "@/lib/bot-prompt";
import { logMessageDelivery, sendMetaMessage, upsertConversationThreadMessages } from "@/lib/meta";

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

        const [businesses, plans, threads, keywordTriggers] = await Promise.all([
          sql`SELECT bot_prompt, status, knowledge_json, billing_active FROM businesses WHERE id = ${businessId} LIMIT 1`,
          sql`SELECT plan_type, monthly_tier, monthly_price FROM plans WHERE business_id = ${businessId} LIMIT 1`,
          sql`
            SELECT messages FROM conversation_threads
            WHERE business_id = ${businessId} AND platform = ${platform} AND sender_id = ${senderId}
            LIMIT 1
          `,
          sql`
            SELECT id, keyword, match_type, response, sequence_id FROM keyword_triggers
            WHERE business_id = ${businessId} AND enabled = true
            AND (platform = 'all' OR platform = ${platform})
          `,
        ]);

        const business = businesses[0] ?? null;
        const plan = plans[0] ?? null;
        console.log(`[webhook] business status=${business?.status} billing_active=${business?.billing_active} plan=${plan?.plan_type}`);
        if (!business || business.status !== "active" || !business.billing_active || plan?.plan_type !== "monthly") continue;

        const lowerText = messageText.toLowerCase();
        const matchedTrigger = (keywordTriggers as Array<{
          id: string;
          keyword: string;
          match_type: string;
          response: string;
          sequence_id?: string | null;
        }>).find((t) => {
          const kw = t.keyword.toLowerCase();
          if (t.match_type === "exact") return lowerText === kw;
          if (t.match_type === "starts_with") return lowerText.startsWith(kw);
          return lowerText.includes(kw);
        });

        if (matchedTrigger) {
          await sql`
            UPDATE keyword_triggers
            SET trigger_fires_count = COALESCE(trigger_fires_count, 0) + 1
            WHERE id = ${matchedTrigger.id}
          `;

          if (matchedTrigger.sequence_id) {
            await sql`
              INSERT INTO sequence_enrollments (
                business_id, sequence_id, sender_id, platform, enrolled_at, current_step, completed
              )
              VALUES (${businessId}, ${matchedTrigger.sequence_id}, ${senderId}, ${platform}, NOW(), 1, false)
              ON CONFLICT (business_id, sequence_id, sender_id, platform)
              DO UPDATE SET enrolled_at = NOW(), current_step = 1, completed = false
            `;
          }

          if (pageAccessToken) {
            try {
              await sendMetaMessage({
                recipientId: senderId,
                text: matchedTrigger.response,
                pageAccessToken,
              });
            } catch (err) {
              console.error("[webhook] keyword send failed:", err);
            }
            await logMessageDelivery({
              businessId,
              platform,
            });
            await upsertConversationThreadMessages({
              businessId,
              platform,
              senderId,
              messages: [
                { role: "user", content: messageText },
                { role: "assistant", content: matchedTrigger.response },
              ],
            });
          }

          continue;
        }

        const systemPrompt = appendKnowledgeSection(
          (business.bot_prompt as string) || "Та туслах AI байна.",
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

        await logMessageDelivery({
          businessId,
          platform,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          source: "api",
        });
        await upsertConversationThreadMessages({
          businessId,
          platform,
          senderId,
          messages: [
            { role: "user", content: messageText },
            { role: "assistant", content: reply },
          ],
        });

        if (pageAccessToken) {
          try {
            await sendMetaMessage({
              recipientId: senderId,
              text: reply,
              pageAccessToken,
            });
          } catch (err) {
            console.error("[webhook] AI send failed:", err);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
