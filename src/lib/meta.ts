import { sql } from "@/lib/db";

const FB_API_VERSION = "v19.0";
const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMetaMessage({
  recipientId,
  text,
  pageAccessToken,
  messagingType = "RESPONSE",
  tag,
}: {
  recipientId: string;
  text: string;
  pageAccessToken: string;
  messagingType?: "RESPONSE" | "MESSAGE_TAG";
  tag?: string;
}) {
  const payload: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: messagingType,
  };

  if (tag) {
    payload.tag = tag;
  }

  const res = await fetch(`${FB_BASE}/me/messages?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Meta send error: ${await res.text()}`);
  }

  return res.json().catch(() => null);
}

/** A button attached to a trigger message. Stored in keyword_triggers.buttons */
export interface BotButton {
  title: string;          // max 20 chars (Instagram quick-reply limit)
  type: "postback" | "url";
  reply?: string;         // for postback: bot sends this when tapped
  url?: string;           // for url: opens this link (Messenger only)
}

/** Prefix used in button payloads so webhook can identify them */
export const BTN_PAYLOAD_PREFIX = "NEXON_BTN:";

/**
 * Send a message with up to 3 buttons.
 * - Messenger → Button Template (supports URL + postback buttons)
 * - Instagram  → Quick Replies (all become quick-reply chips; URL buttons open via webview)
 */
export async function sendMessageWithButtons({
  recipientId,
  text,
  buttons,
  pageAccessToken,
  platform,
}: {
  recipientId: string;
  text: string;
  buttons: BotButton[];
  pageAccessToken: string;
  platform: string;
}) {
  const safe = buttons.slice(0, 3);

  if (platform === "messenger") {
    const fbButtons = safe.map((btn) => {
      if (btn.type === "url" && btn.url) {
        return { type: "web_url", title: btn.title.slice(0, 20), url: btn.url };
      }
      return {
        type: "postback",
        title: btn.title.slice(0, 20),
        payload: BTN_PAYLOAD_PREFIX + JSON.stringify({ r: (btn.reply || "").slice(0, 900) }),
      };
    });

    const payload = {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: text.slice(0, 640),
            buttons: fbButtons,
          },
        },
      },
    };

    const res = await fetch(`${FB_BASE}/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Meta send error: ${await res.text()}`);
    return res.json().catch(() => null);
  }

  // Instagram — quick replies
  const quickReplies = safe.map((btn) => ({
    content_type: "text",
    title: btn.title.slice(0, 20),
    payload:
      btn.type === "url" && btn.url
        ? BTN_PAYLOAD_PREFIX + JSON.stringify({ u: btn.url })
        : BTN_PAYLOAD_PREFIX + JSON.stringify({ r: (btn.reply || "").slice(0, 900) }),
  }));

  const payload = {
    recipient: { id: recipientId },
    messaging_type: "RESPONSE",
    message: { text, quick_replies: quickReplies },
  };

  const res = await fetch(`${FB_BASE}/me/messages?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Meta send error: ${await res.text()}`);
  return res.json().catch(() => null);
}

export async function upsertConversationThreadMessages({
  businessId,
  platform,
  senderId,
  messages,
}: {
  businessId: string;
  platform: string;
  senderId: string;
  messages: ConversationMessage[];
}) {
  const existing = await sql`
    SELECT messages
    FROM conversation_threads
    WHERE business_id = ${businessId}
      AND platform = ${platform}
      AND sender_id = ${senderId}
    LIMIT 1
  `;

  const existingMessages = Array.isArray(existing[0]?.messages)
    ? (existing[0].messages as ConversationMessage[])
    : [];
  const updatedMessages = [...existingMessages, ...messages].slice(-100);

  await sql`
    INSERT INTO conversation_threads (business_id, platform, sender_id, messages, last_message_at)
    VALUES (${businessId}, ${platform}, ${senderId}, ${JSON.stringify(updatedMessages)}, NOW())
    ON CONFLICT (business_id, platform, sender_id)
    DO UPDATE SET messages = ${JSON.stringify(updatedMessages)}, last_message_at = NOW()
  `;

  return updatedMessages;
}

export async function sendTypingIndicator({
  recipientId,
  pageAccessToken,
}: {
  recipientId: string;
  pageAccessToken: string;
}) {
  try {
    await fetch(`${FB_BASE}/me/messages?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: "typing_on",
      }),
    });
  } catch {
    // non-critical
  }
}

export async function replyToComment({
  commentId,
  message,
  pageAccessToken,
}: {
  commentId: string;
  message: string;
  pageAccessToken: string;
}) {
  const res = await fetch(`${FB_BASE}/${commentId}/replies?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json().catch(() => null);
}

export async function logMessageDelivery({
  businessId,
  platform,
  messageCount = 1,
  source = "api",
  promptTokens = 0,
  completionTokens = 0,
  totalTokens = 0,
  creditsUsed = 0,
}: {
  businessId: string;
  platform: string;
  messageCount?: number;
  source?: "manual" | "api";
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
}) {
  await sql`
    INSERT INTO message_logs (
      business_id, platform, message_count, prompt_tokens, completion_tokens, total_tokens, credits_used, source
    )
    VALUES (
      ${businessId}, ${platform}, ${messageCount}, ${promptTokens}, ${completionTokens}, ${totalTokens}, ${creditsUsed}, ${source}
    )
  `;
}
