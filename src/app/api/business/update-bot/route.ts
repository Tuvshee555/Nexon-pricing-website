import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { botPrompt, botName, welcomeMessage, botTone } = body as {
    botPrompt?: string;
    botName?: string;
    welcomeMessage?: string;
    botTone?: string;
  };

  const validTones = ["friendly", "formal", "professional", "casual"];
  const safeTone = validTones.includes(botTone || "") ? botTone : "friendly";

  const adminClient = await createAdminClient();

  const { data: business } = await adminClient
    .from("businesses")
    .select("id, user_id, onboarding_step")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await adminClient
    .from("businesses")
    .update({
      bot_prompt: botPrompt || "",
      bot_name: botName || "Nexon Bot",
      welcome_message: welcomeMessage || "",
      bot_tone: safeTone,
      onboarding_step: Math.max(business.onboarding_step, 4),
    })
    .eq("id", business.id);

  return NextResponse.json({ success: true });
}
