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
    // Verify Facebook webhook signature
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (appSecret) {
      const signature = request.headers.get("x-hub-signature-256");
      const rawBody = await request.text();
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 403 });
      }
      const { createHmac } = await import("crypto");
      const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
      var body = JSON.parse(rawBody);
    } else {
      var body = await request.json();
    }

    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ error: "Not a page event" }, { status: 200 });
    }

    const supabase = await createAdminClient();

    for (const entry of body.entry || []) {
      const messaging = entry.messaging || entry.changes?.[0]?.value?.messages;

      if (!messaging) continue;

      // entry.id is the Facebook Page ID that received the message.
      // Look up the platform_accounts row by page_id to find the business
      // and retrieve the per-business page access token.
      const pageId = entry.id as string;

      const { data: pageAccount } = await supabase
        .from("platform_accounts")
        .select("business_id, page_access_token")
        .eq("page_id", pageId)
        .maybeSingle();

      // Per-business token (self-service) OR legacy env var fallback
      const pageAccessToken: string | undefined =
        pageAccount?.page_access_token ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

      for (const event of messaging) {
        // Determine platform
        const platform = body.object === "instagram" ? "instagram" : "messenger";

        // Get sender ID
        const senderId = event.sender?.id || event.from?.id;
        if (!senderId) continue;

        // Skip if no message text
        const messageText = event.message?.text || event.text;
        if (!messageText) continue;

        // Resolve business_id: prefer the page_id lookup above, fall back to
        // legacy sender-based lookup for admin-configured businesses.
        let businessId: string | null = pageAccount?.business_id ?? null;

        if (!businessId) {
          const { data: senderAccount } = await supabase
            .from("platform_accounts")
            .select("business_id")
            .eq("platform", platform)
            .eq("external_id", senderId)
            .maybeSingle();
          businessId = senderAccount?.business_id ?? null;
        }

        if (!businessId) continue;

        // Get business info
        const { data: business } = await supabase
          .from("businesses")
          .select("bot_prompt, bot_name, welcome_message, status")
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
          if (pageAccessToken) {
            await sendFacebookMessage(senderId, "Таны кредит дууссан байна. Nexon хяналтын самбараас кредит нэмнэ үү.", platform, pageAccessToken);
          }
          continue;
        }

        // Build conversation history for context
        const { data: thread } = await supabase
          .from("conversation_threads")
          .select("messages")
          .eq("business_id", businessId)
          .eq("platform", platform)
          .eq("sender_id", senderId)
          .maybeSingle();

        const history: Array<{ role: string; content: string }> = Array.isArray(thread?.messages)
          ? (thread.messages as Array<{ role: string; content: string }>).slice(-10)
          : [];

        // Call OpenAI
        const openaiMessages = [
          {
            role: "system",
            content: business.bot_prompt || "Та туслах AI байна.",
          },
          ...history,
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
          console.error("OpenAI error:", await openaiRes.text());
          continue;
        }

        const openaiData = await openaiRes.json();
        const reply = openaiData.choices?.[0]?.message?.content || "";
        const usage = openaiData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // Calculate credits used (ceil total_tokens / 1000, min 1)
        const creditsUsed = Math.max(1, Math.ceil(usage.total_tokens / 1000));

        // Re-fetch credits to avoid race (use row-level update)
        const { data: curCredits } = await supabase
          .from("credits")
          .select("balance")
          .eq("business_id", businessId)
          .single();

        if (!curCredits || curCredits.balance < creditsUsed) {
          if (pageAccessToken) {
            await sendFacebookMessage(senderId, "Таны мессеж дууссан байна. Nexon хяналтын самбараас мессеж нэмнэ үү.", platform, pageAccessToken);
          }
          continue;
        }

        // Atomic deduction: only succeeds if balance is still sufficient
        const { data: deducted } = await supabase
          .from("credits")
          .update({ balance: curCredits.balance - creditsUsed })
          .eq("business_id", businessId)
          .gte("balance", creditsUsed)
          .select("balance");

        if (!deducted?.length) continue; // Race: another message already consumed credits

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

        // Update conversation thread
        const updatedMessages = [
          ...history,
          { role: "user", content: messageText },
          { role: "assistant", content: reply },
        ].slice(-20); // Keep last 20 messages

        await supabase
          .from("conversation_threads")
          .upsert({
            business_id: businessId,
            platform,
            sender_id: senderId,
            messages: updatedMessages,
            last_message_at: new Date().toISOString(),
          }, { onConflict: "business_id,platform,sender_id" });

        // Send reply
        if (pageAccessToken) {
          await sendFacebookMessage(senderId, reply, platform, pageAccessToken);
        } else {
          console.warn("No page access token available for business", businessId);
        }
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
  pageAccessToken: string
): Promise<void> {
  const endpoint =
    platform === "instagram"
      ? `https://graph.facebook.com/v19.0/me/messages`
      : `https://graph.facebook.com/v19.0/me/messages`;

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
