import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// WhatsApp webhook verification (GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// WhatsApp message handler (POST)
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
            }>;
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

        // Find the business connected to this phone number
        const accounts = await sql`
          SELECT pa.business_id, pa.page_access_token,
                 b.bot_prompt, b.status, b.welcome_message
          FROM platform_accounts pa
          JOIN businesses b ON b.id = pa.business_id
          WHERE pa.platform = 'whatsapp' AND pa.page_id = ${phoneNumberId}
          LIMIT 1
        `;

        if (!accounts[0]) continue;

        const account = accounts[0];
        if (account.status !== "active") continue;

        for (const message of messages) {
          if (message.type !== "text" || !message.from || !message.text?.body) continue;

          const senderId = message.from;
          const text = message.text.body;
          const businessId = account.business_id as string;
          const accessToken = account.page_access_token as string;

          // Check keyword triggers
          const triggers = await sql`
            SELECT keyword, match_type, response
            FROM keyword_triggers
            WHERE business_id = ${businessId}
              AND enabled = true
              AND (platform = 'all' OR platform = 'whatsapp')
          `;

          let replied = false;
          for (const trigger of triggers) {
            const kw = (trigger.keyword as string).toLowerCase();
            const msgLower = text.toLowerCase();
            const matchType = trigger.match_type as string;

            const matched =
              matchType === "exact" ? msgLower === kw :
              matchType === "starts_with" ? msgLower.startsWith(kw) :
              msgLower.includes(kw);

            if (matched) {
              await sendWhatsAppMessage(phoneNumberId, senderId, trigger.response as string, accessToken);
              replied = true;
              break;
            }
          }

          if (!replied && account.bot_prompt) {
            // Use OpenAI for AI reply (same pattern as other webhooks)
            const { OpenAI } = await import("openai");
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: account.bot_prompt as string },
                { role: "user", content: text },
              ],
              max_tokens: 400,
            });

            const aiReply = completion.choices[0]?.message?.content ?? "Sorry, I could not process your message.";
            await sendWhatsAppMessage(phoneNumberId, senderId, aiReply, accessToken);

            // Save conversation thread
            const existingThread = await sql`
              SELECT messages FROM conversation_threads
              WHERE business_id = ${businessId} AND sender_id = ${senderId} AND platform = 'whatsapp'
              LIMIT 1
            `;

            const msgs = existingThread[0]
              ? (existingThread[0].messages as Array<{ role: string; content: string }>)
              : [];
            msgs.push({ role: "user", content: text }, { role: "assistant", content: aiReply });

            await sql`
              INSERT INTO conversation_threads (business_id, sender_id, platform, messages, last_message_at)
              VALUES (${businessId}, ${senderId}, 'whatsapp', ${JSON.stringify(msgs)}, NOW())
              ON CONFLICT (business_id, sender_id, platform)
              DO UPDATE SET messages = ${JSON.stringify(msgs)}, last_message_at = NOW()
            `;
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to WhatsApp
  }
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string, accessToken: string) {
  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}
