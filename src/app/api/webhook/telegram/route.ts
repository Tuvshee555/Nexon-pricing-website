import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { appendKnowledgeSection } from "@/lib/bot-prompt";
import { sendTelegramBotMessage } from "@/lib/telegram-bot";
import { logMessageDelivery } from "@/lib/meta";
import { fireWebhooks } from "@/lib/webhooks";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

type KWTrigger = {
  id: string;
  keyword: string;
  match_type: string;
  response: string;
  sequence_id?: string | null;
};

function matchKeyword(text: string, triggers: KWTrigger[]): KWTrigger | null {
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

export async function POST(request: Request) {
  try {
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (!secretToken) return NextResponse.json({ ok: true });

    const accounts = await sql`
      SELECT business_id, telegram_bot_token
      FROM platform_accounts
      WHERE platform = 'telegram' AND telegram_webhook_secret = ${secretToken}
      LIMIT 1
    `;
    const account = accounts[0];
    if (!account) return NextResponse.json({ ok: true });

    const businessId = account.business_id as string;
    const botToken = account.telegram_bot_token as string;

    const body = await request.json();
    const message = body.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id as number;
    const messageText = message.text as string;
    const senderId = String(chatId);
    const platform = "telegram";

    const [businesses, plans, threads, keywordTriggers] = await Promise.all([
      sql`SELECT bot_prompt, status, knowledge_json, billing_active, ai_agent_mode FROM businesses WHERE id = ${businessId} LIMIT 1`,
      sql`SELECT plan_type, tier FROM plans WHERE business_id = ${businessId} LIMIT 1`,
      sql`
        SELECT messages, paused_until FROM conversation_threads
        WHERE business_id = ${businessId} AND platform = ${platform} AND sender_id = ${senderId}
        LIMIT 1
      `,
      sql`
        SELECT id, keyword, match_type, response, sequence_id FROM keyword_triggers
        WHERE business_id = ${businessId} AND enabled = true
          AND (platform = 'all' OR platform = 'telegram')
      `,
    ]);

    const business = businesses[0];
    const plan = plans[0];
    if (
      !business ||
      business.status !== "active" ||
      !business.billing_active ||
      plan?.plan_type !== "monthly"
    ) {
      return NextResponse.json({ ok: true });
    }

    // Pause check
    const pausedUntil = threads[0]?.paused_until as string | null;
    if (pausedUntil && new Date(pausedUntil) > new Date()) {
      return NextResponse.json({ ok: true });
    }

    // Fire new_contact on first message
    const history = Array.isArray(threads[0]?.messages)
      ? (threads[0].messages as Array<{ role: string; content: string }>)
      : [];
    if (history.length === 0) {
      await fireWebhooks(businessId, "new_contact", { senderId, platform });
    }

    const aiAgentMode = Boolean(business.ai_agent_mode);
    const triggers = keywordTriggers as KWTrigger[];
    const matchedTrigger = aiAgentMode ? null : matchKeyword(messageText, triggers);

    if (matchedTrigger) {
      await sendTelegramBotMessage({ botToken, chatId, text: matchedTrigger.response });
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
      await logMessageDelivery({ businessId, platform });
      return NextResponse.json({ ok: true });
    }

    // AI reply
    const systemPrompt = appendKnowledgeSection(
      (business.bot_prompt as string) || "Та туслах AI байна.",
      business.knowledge_json
    );
    const recentContext = history.slice(-20);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentContext,
          { role: "user", content: messageText },
        ],
        max_tokens: 500,
      }),
    });

    if (!openaiRes.ok) return NextResponse.json({ ok: true });

    const openaiData = await openaiRes.json();
    const reply = (openaiData.choices?.[0]?.message?.content as string) || "";
    const usage = openaiData.usage || {};

    if (reply) {
      await sendTelegramBotMessage({ botToken, chatId, text: reply });
      await logMessageDelivery({
        businessId,
        platform,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      });

      const updatedMessages = [
        ...history,
        { role: "user", content: messageText },
        { role: "assistant", content: reply },
      ].slice(-100);

      await sql`
        INSERT INTO conversation_threads (business_id, platform, sender_id, messages, last_message_at)
        VALUES (${businessId}, ${platform}, ${senderId}, ${JSON.stringify(updatedMessages)}, NOW())
        ON CONFLICT (business_id, platform, sender_id)
        DO UPDATE SET messages = ${JSON.stringify(updatedMessages)}, last_message_at = NOW()
      `;

      await fireWebhooks(businessId, "message_received", { senderId, platform, text: messageText });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram webhook error]", err);
    return NextResponse.json({ ok: true });
  }
}
