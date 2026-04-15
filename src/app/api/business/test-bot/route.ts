import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { appendKnowledgeSection } from "@/lib/bot-prompt";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { message, botPrompt, botName, history } = body as {
    message?: string;
    botPrompt?: string;
    botName?: string;
    history?: Array<{ role: string; content: string }>;
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const businesses = await sql`
    SELECT id, knowledge_json FROM businesses WHERE user_id = ${userId} LIMIT 1
  `;
  const business = businesses[0] ?? null;
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const basePrompt = botPrompt?.trim() || `Та ${botName || "Nexon Bot"} нэртэй туслах AI байна.`;
  const systemPrompt = appendKnowledgeSection(basePrompt, business.knowledge_json);

  // Use passed history for multi-turn context (up to last 20 turns)
  const safeHistory = Array.isArray(history)
    ? history.slice(-20).filter((m) => m.role && m.content)
    : [];

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...safeHistory,
    { role: "user", content: message.trim() },
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
      max_tokens: 400,
    }),
  });

  if (!openaiRes.ok) {
    console.error("OpenAI test error:", await openaiRes.text());
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }

  const data = await openaiRes.json();
  const reply = data.choices?.[0]?.message?.content || "";

  return NextResponse.json({ reply });
}
