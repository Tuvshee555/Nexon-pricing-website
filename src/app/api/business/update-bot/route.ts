import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { botPrompt, botName, welcomeMessage, botTone } = body as {
    botPrompt?: string;
    botName?: string;
    welcomeMessage?: string;
    botTone?: string;
  };

  const validTones = ["friendly", "formal", "professional", "casual"];
  const safeTone = validTones.includes(botTone || "") ? botTone : "friendly";

  const businesses = await sql`
    SELECT id, onboarding_step FROM businesses WHERE user_id = ${userId} LIMIT 1
  `;
  const business = businesses[0] ?? null;
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const newStep = Math.max((business.onboarding_step as number) || 0, 4);

  await sql`
    UPDATE businesses
    SET bot_prompt = ${botPrompt || ""},
        bot_name = ${botName || "Nexon Bot"},
        welcome_message = ${welcomeMessage || ""},
        bot_tone = ${safeTone},
        onboarding_step = ${newStep}
    WHERE id = ${business.id as string}
  `;

  return NextResponse.json({ success: true });
}
