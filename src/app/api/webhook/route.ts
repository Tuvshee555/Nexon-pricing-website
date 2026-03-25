import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ─── GET: Facebook webhook verification ──────────────────────────────────────
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

// ─── POST: Receive messages ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ error: "Not a page event" }, { status: 200 });
    }

    const supabase = await createAdminClient();

    for (const entry of body.entry || []) {
      const messaging = entry.messaging || entry.changes?.[0]?.value?.messages;

      if (!messaging) continue;

      for (const event of messaging) {
        // Determine platform
        const platform = body.object === "instagram" ? "instagram" : "messenger";

        // Get sender ID
        const senderId =
          event.sender?.id ||
          event.from?.id;

        if (!senderId) continue;

        // Skip if no message text
        const messageText = event.message?.text || event.text;
        if (!messageText) continue;

        // Look up business via platform_accounts
        const { data: platformAccount } = await supabase
          .from("platform_accounts")
          .select("business_id")
          .eq("platform", platform)
          .eq("external_id", senderId)
          .single();

        if (!platformAccount) continue;

        const businessId = platformAccount.business_id;

        // Get business info
        const { data: business } = await supabase
          .from("businesses")
          .select("bot_prompt, status")
          .eq("id", businessId)
          .single();

        if (!business || business.status !== "active") continue;

        // Check credits
        const { data: credits } = await supabase
          .from("credits")
          .select("balance")
          .eq("business_id", businessId)
          .single();

        if (!credits || credits.balance <= 0) {
          await sendFacebookMessage(senderId, "Таны кредит дууссан байна. Nexon хяналтын самбараас кредит нэмнэ үү.", platform, entry.id);
          continue;
        }

        // Call OpenAI
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
              {
                role: "system",
                content: business.bot_prompt || "Та туслах AI байна.",
              },
              {
                role: "user",
                content: messageText,
              },
            ],
            max_tokens: 500,
          }),
        });

        if (!openaiRes.ok) {
          console.error("OpenAI error:", await openaiRes.text());
          continue;
        }

        const openaiData = await openaiRes.json();
        const reply = openaiData.choices?.[0]?.message?.content || "";
        const usage = openaiData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // Calculate credits used (ceil total_tokens / 1000, min 1)
        const creditsUsed = Math.max(1, Math.ceil(usage.total_tokens / 1000));

        // Deduct credits — direct update
        const { data: curCredits } = await supabase
          .from("credits")
          .select("balance")
          .eq("business_id", businessId)
          .single();

        if (!curCredits || curCredits.balance < creditsUsed) {
          await sendFacebookMessage(senderId, "Таны мессеж дууссан байна. Nexon хяналтын самбараас мессеж нэмнэ үү.", platform, entry.id);
          continue;
        }

        await supabase
          .from("credits")
          .update({ balance: curCredits.balance - creditsUsed })
          .eq("business_id", businessId);

        // Log message
        await supabase.from("message_logs").insert({
          business_id: businessId,
          platform,
          message_count: 1,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          credits_used: creditsUsed,
          source: "api",
        });

        // Send reply
        await sendFacebookMessage(senderId, reply, platform, entry.id);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    // Always return 200 to Facebook
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function sendFacebookMessage(
  recipientId: string,
  text: string,
  platform: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pageId?: string
): Promise<void> {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageAccessToken) {
    console.warn("FACEBOOK_PAGE_ACCESS_TOKEN not set — skipping send");
    return;
  }

  const endpoint =
    platform === "instagram"
      ? `https://graph.facebook.com/v18.0/me/messages`
      : `https://graph.facebook.com/v18.0/me/messages`;

  try {
    const res = await fetch(`${endpoint}?access_token=${pageAccessToken}`, {
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
