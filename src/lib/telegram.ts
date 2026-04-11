const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function sendTelegramMessage(text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

export async function notifyNewUser(email: string, businessName?: string): Promise<void> {
  const date = new Date().toLocaleDateString("mn-MN");
  await sendTelegramMessage(
    `🆕 <b>Шинэ клиент бүртгэгдлээ!</b>\n\n` +
    `👤 Нэр: <b>${businessName || "—"}</b>\n` +
    `📧 И-мэйл: <code>${email}</code>\n` +
    `📅 Огноо: ${date}`
  );
}

export async function notifyPaymentReceived(
  businessName: string,
  amount: number,
  type: "topup" | "subscription"
): Promise<void> {
  const typeLabel = type === "topup" ? "Үлдэгдэл нэмэх" : "Сарын захиалга";
  await sendTelegramMessage(
    `💰 <b>Төлбөр хүлээн авлаа!</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `💵 Дүн: <b>${amount.toLocaleString()}₮</b>\n` +
    `📦 Төрөл: ${typeLabel}\n` +
    `✅ Статус: Амжилттай`
  );
}

export async function notifyLowBalance(
  businessName: string,
  balance: number,
  nextBillingDate: string
): Promise<void> {
  const dateStr = new Date(nextBillingDate).toLocaleDateString("mn-MN");
  await sendTelegramMessage(
    `⚠️ <b>Үлдэгдэл бага байна!</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `💵 Үлдэгдэл: <b>${balance.toLocaleString()}₮</b>\n` +
    `📅 Дараагийн төлбөр: ${dateStr}\n` +
    `❗ Клиенттэй холбоо барина уу`
  );
}

export async function notifyOutOfMessages(businessName: string): Promise<void> {
  await sendTelegramMessage(
    `🚫 <b>Мессеж дууслаа!</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `📊 Мессеж үлдэгдэл: 0\n` +
    `❗ Бот зогссон`
  );
}

export async function notifySubscriptionDeducted(
  businessName: string,
  amount: number,
  remaining: number,
  nextDate: string
): Promise<void> {
  const dateStr = new Date(nextDate).toLocaleDateString("mn-MN");
  await sendTelegramMessage(
    `🔄 <b>Сарын төлбөр хасагдлаа</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `💵 Хасагдсан: <b>${amount.toLocaleString()}₮</b>\n` +
    `💰 Үлдэгдэл: <b>${remaining.toLocaleString()}₮</b>\n` +
    `📅 Дараагийн: ${dateStr}`
  );
}

export async function notifyContactForm(
  name: string,
  phone: string,
  email: string,
  message: string
): Promise<void> {
  await sendTelegramMessage(
    `📩 <b>Холбоо барих маягт</b>\n\n` +
    `👤 Нэр: <b>${name}</b>\n` +
    `📞 Утас: <code>${phone}</code>\n` +
    `📧 И-мэйл: <code>${email}</code>\n` +
    `💬 Мессеж:\n${message}`
  );
}
