import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { appendKnowledgeSection } from "@/lib/bot-prompt";
import { logMessageDelivery } from "@/lib/meta";
import { fireWebhooks } from "@/lib/webhooks";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

function matchKeyword(
  text: string,
  triggers: Array<{ id: string; keyword: string; match_type: string; response: string; sequence_id?: string | null }>
) {
  const lower = text.toLowerCase();
  return triggers.find((t) => {
    const kw = t.keyword.toLowerCase();
    if (t.match_type === "exact") return lower === kw;
    if (t.match_type === "starts_with") return lower.startsWith(kw);
    return lower.includes(kw);
  }) ?? null;
}

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
    lower.includes("мэдэхгүй") ||
    lower.includes("холбогдоно уу") ||
    lower.includes("холбоо барь")
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      object?: string;
      entry?: Array<{
        id?: string;
        changes?: Array<{
          value?: {
            phone_number_id?: string;
            messages?: Array<{
              from?: string;
              text?: { body?: string };
              type?: string;
              id?: string;
            }>;
            statuses?: Array<unknown>;
          };
        }>;
      }>;
    };

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ ok: true });
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneNumberId = value?.phone_number_id;
        const messages = value?.messages ?? [];

        if (!phoneNumberId || messages.length === 0) continue;

        const accounts = await sql`
          SELECT pa.business_id, pa.page_access_token,
                 b.bot_prompt, b.status, b.knowledge_json, b.billing_active,
                 b.ai_agent_mode, b.welcome_message
          FROM platform_accounts pa
          JOIN businesses b ON b.id = pa.business_id
          WHERE pa.platform = 'whatsapp' AND pa.page_id = ${phoneNumberId}
          LIMIT 1
        `;
        if (!accounts[0]) continue;

        const account = accounts[0];
        if (account.status !== "active" || !account.billing_active) continue;

        const plans = await sql`
          SELECT plan_type FROM plans WHERE business_id = ${account.business_id} LIMIT 1
        `;
        if (plans[0]?.plan_type !== "monthly") continue;

        for (const message of messages) {
          if (message.type !== "text" || !message.from || !message.text?.body) continue;

          const senderId = message.from;
          const text = message.text.body;
          const businessId = account.business_id as string;
          const accessToken = account.page_access_token as string;
          const platform = "whatsapp";

          // Check if bot is paused for this contact
          const threadRow = await sql`
            SELECT messages, paused_until
            FROM conversation_threads
            WHERE business_id = ${businessId} AND sender_id = ${senderId} AND platform = ${platform}
            LIMIT 1
          `;
          const paused_until = threadRow[0]?.paused_until as string | null;
          if (paused_until && new Date(paused_until) > new Date()) continue;

          const history = Array.isArray(threadRow[0]?.messages)
            ? (threadRow[0].messages as Array<{ role: string; content: string }>)
            : [];

          // Fire new_contact webhook if first message
          if (history.length === 0) {
            await fireWebhooks(businessId, "new_contact", { senderId, platform });
          }

          const aiAgentMode = Boolean(account.ai_agent_mode);

          // Keyword matching — skipped in AI Agent mode
          if (!aiAgentMode) {
            // Special catalog keyword — send product list
            const catalogKeywords = ["catalog", "бүтээгдэхүүн", "products", "каталог"];
            const isCatalogRequest = catalogKeywords.some((kw) => text.toLowerCase().includes(kw));
            if (isCatalogRequest) {
              const products = await sql`
                SELECT id, name, description, price, currency FROM products
                WHERE business_id = ${businessId} AND enabled = true ORDER BY created_at DESC LIMIT 10
              `;
              if (products.length > 0) {
                await sendWhatsAppCatalog(
                  phoneNumberId, senderId,
                  "Our Products",
                  "Here are the products we offer:",
                  products as Array<{ id: string; name: string; description?: string; price: number; currency: string }>,
                  accessToken
                );
                await upsertThread(businessId, senderId, "whatsapp", history, text, "[Catalog sent]");
                await logMessageDelivery({ businessId, platform: "whatsapp" });
                continue;
              }
            }

            const triggers = await sql`
              SELECT id, keyword, match_type, response, sequence_id
              FROM keyword_triggers
              WHERE business_id = ${businessId}
                AND enabled = true
                AND (platform = 'all' OR platform = 'whatsapp')
            `;
            const matched = matchKeyword(text, triggers as Array<{ id: string; keyword: string; match_type: string; response: string; sequence_id?: string | null }>);

            if (matched) {
              await sendWhatsAppMessage(phoneNumberId, senderId, matched.response as string, accessToken);
              await sql`
                UPDATE keyword_triggers
                SET trigger_fires_count = COALESCE(trigger_fires_count, 0) + 1
                WHERE id = ${matched.id}
              `;
              if (matched.sequence_id) {
                await sql`
                  INSERT INTO sequence_enrollments (
                    business_id, sequence_id, sender_id, platform, enrolled_at, current_step, completed
                  )
                  VALUES (${businessId}, ${matched.sequence_id}, ${senderId}, ${platform}, NOW(), 1, false)
                  ON CONFLICT (business_id, sequence_id, sender_id, platform)
                  DO UPDATE SET enrolled_at = NOW(), current_step = 1, completed = false
                `;
              }
              await logMessageDelivery({ businessId, platform });
              await upsertThread(businessId, senderId, platform, history, text, matched.response as string);
              await fireWebhooks(businessId, "message_received", { senderId, platform, text });
              continue;
            }
          }

          // AI reply
          const systemPrompt = appendKnowledgeSection(
            (account.bot_prompt as string) || "Та туслах AI байна.",
            account.knowledge_json
          );
          const recentContext = history.slice(-20);

          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: OPENAI_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                ...recentContext,
                { role: "user", content: text },
              ],
              max_tokens: 500,
            }),
          });

          if (!openaiRes.ok) {
            console.error("[WA webhook] OpenAI error:", await openaiRes.text());
            continue;
          }

          const openaiData = await openaiRes.json() as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
          };
          const aiReply = openaiData.choices?.[0]?.message?.content ?? "";
          const usage = openaiData.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

          if (!aiReply) continue;

          await sendWhatsAppMessage(phoneNumberId, senderId, aiReply, accessToken);

          // Escalation detection
          const needsHuman = detectsEscalation(aiReply);
          await upsertThread(businessId, senderId, platform, history, text, aiReply, needsHuman);

          await logMessageDelivery({
            businessId,
            platform,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            source: "api",
          });

          await fireWebhooks(businessId, "message_received", { senderId, platform, text });
          if (needsHuman) {
            await fireWebhooks(businessId, "conversation_escalated", { senderId, platform });
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

async function upsertThread(
  businessId: string,
  senderId: string,
  platform: string,
  history: Array<{ role: string; content: string }>,
  userText: string,
  botReply: string,
  needsHuman = false
) {
  const updated = [...history, { role: "user", content: userText }, { role: "assistant", content: botReply }].slice(-100);
  await sql`
    INSERT INTO conversation_threads (business_id, sender_id, platform, messages, last_message_at${needsHuman ? sql`, needs_human` : sql``})
    VALUES (${businessId}, ${senderId}, ${platform}, ${JSON.stringify(updated)}, NOW()${needsHuman ? sql`, true` : sql``})
    ON CONFLICT (business_id, sender_id, platform)
    DO UPDATE SET
      messages = ${JSON.stringify(updated)},
      last_message_at = NOW()
      ${needsHuman ? sql`, needs_human = true` : sql``}
  `;
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string, accessToken: string) {
  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

async function sendWhatsAppCatalog(
  phoneNumberId: string,
  to: string,
  headerText: string,
  bodyText: string,
  products: Array<{ id: string; name: string; description?: string; price: number; currency: string }>,
  accessToken: string
) {
  const sections = [{
    title: headerText,
    rows: products.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.name.slice(0, 24),
      description: `${p.price.toLocaleString()} ${p.currency}${p.description ? ` — ${p.description.slice(0, 60)}` : ""}`,
    })),
  }];

  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        action: {
          button: "View products",
          sections,
        },
      },
    }),
  });
}
