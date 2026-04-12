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
