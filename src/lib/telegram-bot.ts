// Client bot functions — for sending messages to a client's customers via their own bot token.
// This is DIFFERENT from telegram.ts which sends admin notifications to the Nexon owner.

export async function sendTelegramBotMessage({
  botToken,
  chatId,
  text,
}: {
  botToken: string;
  chatId: number | string;
  text: string;
}) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

export async function setTelegramWebhook({
  botToken,
  webhookUrl,
  secretToken,
}: {
  botToken: string;
  webhookUrl: string;
  secretToken: string;
}) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ["message"],
    }),
  });
  return res.json();
}

export async function deleteTelegramWebhook(botToken: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: "POST",
    });
  } catch {
    // non-critical
  }
}

export async function getTelegramBotInfo(botToken: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  return res.json();
}
