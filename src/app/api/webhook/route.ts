import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { sql } from "@/lib/db";
import { appendKnowledgeSection } from "@/lib/bot-prompt";
import {
  BTN_PAYLOAD_PREFIX,
  type BotButton,
  logMessageDelivery,
  replyToComment,
  sendMessageWithButtons,
  sendMetaMessage,
  sendTypingIndicator,
  upsertConversationThreadMessages,
} from "@/lib/meta";
// OPENAI_API_KEY still used for main AI reply below

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ── Helpers ────────────────────────────────────────────────────────────────

type KeywordTrigger = {
  id: string;
  keyword: string;
  match_type: string;
  response: string;
  buttons?: BotButton[];
  sequence_id?: string | null;
};

/** Exact / contains / starts_with keyword match */
function matchKeyword(text: string, triggers: KeywordTrigger[]): KeywordTrigger | null {
  const lower = text.toLowerCase();
  return (
    triggers.find((t) => {
      const kw = t.keyword.toLowerCase();
      if (t.match_type === "exact") return lower === kw;
      if (t.match_type === "starts_with") return lower.startsWith(kw);
      return lower.includes(kw);
    }) ?? null
  );
}

/**
 * Intent-based matching using AI — falls back to null if anything fails.
 * Costs ~1 cheap gpt-4o-mini call only when keyword matching misses.
 */

/** Detects phrases that indicate the bot couldn't answer and needs a human. */
function detectsEscalation(reply: string): boolean {
  const lower = reply.toLowerCase();
  return (
    lower.includes("not sure") ||
    lower.includes("i'm not sure") ||
    lower.includes("don't have that information") ||
    lower.includes("i don't know") ||
    lower.includes("connect you with") ||
    lower.includes("connect to a human") ||
    lower.includes("human agent") ||
    lower.includes("speak with a") ||
    lower.includes("contact us") ||
    lower.includes("reach out to") ||
    lower.includes("мэдэхгүй") || // Mongolian "don't know"
    lower.includes("холбогдоно уу") || // "please contact"
    lower.includes("холбоо барь") // "contact [us]"
  );
}

// ── Webhook GET (verification) ─────────────────────────────────────────────

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

// ── Webhook POST ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (appSecret) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 403 });
      const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
      if (signature !== expected) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);
    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ error: "Not a page event" }, { status: 200 });
    }

    for (const entry of body.entry || []) {
      const pageId = entry.id as string;
      const pageAccounts = await sql`
        SELECT business_id, page_access_token FROM platform_accounts WHERE page_id = ${pageId} LIMIT 1
      `;
      const pageAccount = pageAccounts[0] ?? null;
      const pageAccessToken: string | undefined =
        (pageAccount?.page_access_token as string | undefined) ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

      let businessId: string | null = (pageAccount?.business_id as string) ?? null;

      // ── Direct messages ──────────────────────────────────────────────────
      const messaging = entry.messaging || [];
      for (const event of messaging) {
        const platform = body.object === "instagram" ? "instagram" : "messenger";
        const senderId = event.sender?.id || event.from?.id;
        if (!senderId) continue;

        // ── Button tap: quick reply or Messenger postback ──────────────────
        const buttonPayload: string | undefined =
          (event.message?.quick_reply?.payload as string | undefined) ??
          (event.postback?.payload as string | undefined);

        if (buttonPayload?.startsWith(BTN_PAYLOAD_PREFIX)) {
          try {
            const data = JSON.parse(buttonPayload.slice(BTN_PAYLOAD_PREFIX.length)) as {
              r?: string;
              u?: string;
            };
            if (data.r && pageAccessToken) {
              await sendTypingIndicator({ recipientId: senderId, pageAccessToken });
              await sendMetaMessage({ recipientId: senderId, text: data.r, pageAccessToken });

              // Resolve businessId for logging
              let btnBizId = businessId;
              if (!btnBizId) {
                const rows = await sql`
                  SELECT business_id FROM platform_accounts
                  WHERE platform = ${platform} AND external_id = ${senderId} LIMIT 1
                `;
                btnBizId = (rows[0]?.business_id as string) ?? null;
              }
              if (btnBizId) {
                await upsertConversationThreadMessages({
                  businessId: btnBizId,
                  platform,
                  senderId,
                  messages: [
                    { role: "user", content: event.postback?.title || "(button tap)" },
                    { role: "assistant", content: data.r },
                  ],
                });
                await logMessageDelivery({ businessId: btnBizId, platform });
              }
            }
          } catch (err) {
            console.error("[webhook] button tap error:", err);
          }
          continue;
        }

        const messageText = event.message?.text || event.text;
        if (!messageText) continue;

        if (!businessId) {
          const rows = await sql`
            SELECT business_id FROM platform_accounts
            WHERE platform = ${platform} AND external_id = ${senderId} LIMIT 1
          `;
          businessId = (rows[0]?.business_id as string) ?? null;
        }
        if (!businessId) continue;

        const [businesses, plans, threads, keywordTriggers] = await Promise.all([
          sql`SELECT bot_prompt, status, knowledge_json, billing_active FROM businesses WHERE id = ${businessId} LIMIT 1`,
          sql`SELECT plan_type FROM plans WHERE business_id = ${businessId} LIMIT 1`,
          sql`
            SELECT messages FROM conversation_threads
            WHERE business_id = ${businessId} AND platform = ${platform} AND sender_id = ${senderId}
            LIMIT 1
          `,
          sql`
            SELECT id, keyword, match_type, response, buttons, sequence_id FROM keyword_triggers
            WHERE business_id = ${businessId} AND enabled = true
              AND (platform = 'all' OR platform = ${platform})
          `,
        ]);

        const business = businesses[0] ?? null;
        const plan = plans[0] ?? null;
        if (!business || business.status !== "active" || !business.billing_active || plan?.plan_type !== "monthly") continue;

        const triggers = keywordTriggers as KeywordTrigger[];

        // Keyword match — if no match, falls through to AI reply
        const matchedTrigger = matchKeyword(messageText, triggers);

        if (matchedTrigger) {
          // Send typing indicator first
          if (pageAccessToken) {
            await sendTypingIndicator({ recipientId: senderId, pageAccessToken });
          }

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
              const buttons = Array.isArray(matchedTrigger.buttons) && matchedTrigger.buttons.length > 0
                ? matchedTrigger.buttons
                : null;
              if (buttons) {
                await sendMessageWithButtons({
                  recipientId: senderId,
                  text: matchedTrigger.response,
                  buttons,
                  pageAccessToken,
                  platform,
                });
              } else {
                await sendMetaMessage({ recipientId: senderId, text: matchedTrigger.response, pageAccessToken });
              }
            } catch (err) {
              console.error("[webhook] keyword send failed:", err);
            }
            await logMessageDelivery({ businessId, platform });
          }

          await upsertConversationThreadMessages({
            businessId,
            platform,
            senderId,
            messages: [
              { role: "user", content: messageText },
              { role: "assistant", content: matchedTrigger.response },
            ],
          });
          continue;
        }

        // Step 3: AI reply
        const systemPrompt = appendKnowledgeSection(
          (business.bot_prompt as string) || "Та туслах AI байна.",
          business.knowledge_json
        );
        const fullHistory = Array.isArray(threads[0]?.messages)
          ? (threads[0].messages as Array<{ role: string; content: string }>)
          : [];
        const recentContext = fullHistory.slice(-20);

        const openaiMessages = [
          { role: "system", content: systemPrompt },
          ...recentContext,
          { role: "user", content: messageText },
        ];

        // Send typing indicator before AI responds
        if (pageAccessToken) {
          await sendTypingIndicator({ recipientId: senderId, pageAccessToken });
        }

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: OPENAI_MODEL, messages: openaiMessages, max_tokens: 500 }),
        });
        if (!openaiRes.ok) {
          console.error("[webhook] OpenAI error:", await openaiRes.text());
          continue;
        }

        const openaiData = await openaiRes.json();
        const reply = openaiData.choices?.[0]?.message?.content || "";
        const usage = openaiData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // Step 4: escalation detection — flag thread for human follow-up
        const needsHuman = detectsEscalation(reply);
        if (needsHuman) {
          await sql`
            UPDATE conversation_threads
            SET needs_human = true
            WHERE business_id = ${businessId} AND platform = ${platform} AND sender_id = ${senderId}
          `.catch(() => null); // ignore if column doesn't exist yet
        }

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
            await sendMetaMessage({ recipientId: senderId, text: reply, pageAccessToken });
          } catch (err) {
            console.error("[webhook] AI send failed:", err);
          }
        }
      }

      // ── Instagram comment replies ────────────────────────────────────────
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "comments") continue;

        const value = change.value as {
          text?: string;
          id?: string;
          from?: { id?: string };
          media?: { id?: string };
        };

        const commentText = value.text;
        const commentId = value.id;
        const commentSenderId = value.from?.id;
        if (!commentText || !commentId || !commentSenderId) continue;

        // Re-resolve businessId for comment entries
        const commentBusinessId = businessId;
        if (!commentBusinessId) continue;

        const commentBusinessRows = await sql`
          SELECT bot_prompt, status, knowledge_json, billing_active, ai_comments_enabled
          FROM businesses WHERE id = ${commentBusinessId} LIMIT 1
        `;
        const commentBusiness = (commentBusinessRows[0] ?? null) as Record<string, unknown> | null;
        if (
          !commentBusiness ||
          commentBusiness.status !== "active" ||
          !commentBusiness.billing_active ||
          !commentBusiness.ai_comments_enabled
        ) {
          continue;
        }

        const plans = await sql`SELECT plan_type FROM plans WHERE business_id = ${commentBusinessId} LIMIT 1`;
        if (plans[0]?.plan_type !== "monthly") continue;

        if (!pageAccessToken) continue;

        const systemPrompt = appendKnowledgeSection(
          (commentBusiness.bot_prompt as string) || "Та туслах AI байна.",
          commentBusiness.knowledge_json
        );

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
              {
                role: "system",
                content:
                  systemPrompt +
                  "\n\nYou are replying to a public Instagram comment. Keep your reply short (1-2 sentences), friendly, and on-brand. Do not include greetings like 'Hi!' unless it fits naturally.",
              },
              { role: "user", content: commentText },
            ],
            max_tokens: 150,
          }),
        });

        if (!openaiRes.ok) continue;
        const openaiData = await openaiRes.json();
        const commentReply = openaiData.choices?.[0]?.message?.content || "";
        if (!commentReply) continue;

        try {
          await replyToComment({ commentId, message: commentReply, pageAccessToken });
          console.log(`[webhook] replied to comment ${commentId}`);
        } catch (err) {
          console.error("[webhook] comment reply failed:", err);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
