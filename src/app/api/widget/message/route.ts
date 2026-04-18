import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { appendKnowledgeSection } from "@/lib/bot-prompt";
import { fireWebhooks } from "@/lib/webhooks";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  try {
    const { businessId, sessionId, message, visitorName } = await request.json() as {
      businessId: string;
      sessionId: string;
      message: string;
      visitorName?: string;
    };

    if (!businessId || !sessionId || !message?.trim()) {
      return NextResponse.json({ error: "businessId, sessionId, and message required" }, { status: 400 });
    }

    const businesses = await sql`
      SELECT bot_prompt, status, knowledge_json, billing_active, bot_name, ai_agent_mode
      FROM businesses WHERE id = ${businessId} LIMIT 1
    `;
    const business = businesses[0];
    if (!business || business.status !== "active") {
      return NextResponse.json({ reply: "This bot is currently unavailable." });
    }

    const plans = await sql`SELECT plan_type FROM plans WHERE business_id = ${businessId} LIMIT 1`;
    if (plans[0]?.plan_type !== "monthly") {
      return NextResponse.json({ reply: "This bot is not available." });
    }

    // Load or create widget session
    const sessions = await sql`
      SELECT messages FROM widget_sessions
      WHERE business_id = ${businessId} AND session_id = ${sessionId}
      LIMIT 1
    `;
    const history = Array.isArray(sessions[0]?.messages)
      ? (sessions[0].messages as Array<{ role: string; content: string }>)
      : [];

    if (history.length === 0) {
      await fireWebhooks(businessId, "new_contact", { sessionId, platform: "website", visitorName });
    }

    // Keyword matching (skip if ai_agent_mode)
    const aiAgentMode = Boolean(business.ai_agent_mode);
    if (!aiAgentMode) {
      const triggers = await sql`
        SELECT keyword, match_type, response FROM keyword_triggers
        WHERE business_id = ${businessId} AND enabled = true
          AND (platform = 'all' OR platform = 'website')
      `;
      const lower = message.toLowerCase();
      for (const t of triggers) {
        const kw = (t.keyword as string).toLowerCase();
        const matched =
          t.match_type === "exact" ? lower === kw :
          t.match_type === "starts_with" ? lower.startsWith(kw) :
          lower.includes(kw);
        if (matched) {
          const reply = t.response as string;
          await upsertWidgetSession(businessId, sessionId, history, message, reply, visitorName);
          return NextResponse.json({ reply });
        }
      }
    }

    // AI reply
    const systemPrompt = appendKnowledgeSection(
      (business.bot_prompt as string) || "Та туслах AI байна.",
      business.knowledge_json
    );
    const recentContext = history.slice(-20);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentContext,
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });

    if (!openaiRes.ok) {
      return NextResponse.json({ reply: "Sorry, I couldn't process your request right now." });
    }

    const data = await openaiRes.json() as { choices?: Array<{ message?: { content?: string } }> };
    const reply = data.choices?.[0]?.message?.content ?? "I'm not sure how to help with that.";

    await upsertWidgetSession(businessId, sessionId, history, message, reply, visitorName);
    await fireWebhooks(businessId, "message_received", { sessionId, platform: "website", text: message });

    return NextResponse.json({ reply, botName: business.bot_name as string });
  } catch (err) {
    console.error("[widget message error]", err);
    return NextResponse.json({ reply: "Something went wrong. Please try again." });
  }
}

async function upsertWidgetSession(
  businessId: string,
  sessionId: string,
  history: Array<{ role: string; content: string }>,
  userMsg: string,
  botReply: string,
  visitorName?: string
) {
  const updated = [...history, { role: "user", content: userMsg }, { role: "assistant", content: botReply }].slice(-100);
  await sql`
    INSERT INTO widget_sessions (business_id, session_id, messages, last_message_at, visitor_name)
    VALUES (${businessId}, ${sessionId}, ${JSON.stringify(updated)}, NOW(), ${visitorName ?? null})
    ON CONFLICT (business_id, session_id)
    DO UPDATE SET messages = ${JSON.stringify(updated)}, last_message_at = NOW()
  `;
}
