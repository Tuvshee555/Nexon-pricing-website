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

// 1. New client registered
export async function notifyNewUser(email: string, businessName?: string): Promise<void> {
  const date = new Date().toLocaleDateString("mn-MN");
  await sendTelegramMessage(
    `🆕 <b>Шинэ клиент бүртгэгдлээ!</b>\n\n` +
    `👤 Нэр: <b>${businessName || "—"}</b>\n` +
    `📧 И-мэйл: <code>${email}</code>\n` +
    `📅 Огноо: ${date}`
  );
}

// 2. Payment received (top-up or message pack)
export async function notifyPaymentReceived(
  businessName: string,
  amount: number,
  type: "topup" | "message_pack"
): Promise<void> {
  const typeLabel = type === "topup" ? "Үлдэгдэл нэмэх" : "Мессеж пакет";
  await sendTelegramMessage(
    `💰 <b>Төлбөр хүлээн авлаа!</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `💵 Дүн: <b>${amount.toLocaleString()}₮</b>\n` +
    `📦 Төрөл: ${typeLabel}\n` +
    `✅ Статус: Амжилттай`
  );
}

// 3. Low virtual balance warning
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

// 4. Client ran out of messages
export async function notifyOutOfMessages(businessName: string): Promise<void> {
  await sendTelegramMessage(
    `🚫 <b>Мессеж дууслаа!</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `📊 Мессеж үлдэгдэл: 0\n` +
    `❗ Бот зогссон`
  );
}

// 5. Monthly subscription deducted
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

// Contact form
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

// Legacy alias — used in existing QPay check/callback routes
export async function notifyCreditspurchased(
  businessName: string,
  amount: number,
  creditsAdded: number
): Promise<void> {
  await sendTelegramMessage(
    `💰 <b>Төлбөр хүлээн авлаа!</b>\n\n` +
    `👤 Клиент: <b>${businessName}</b>\n` +
    `💵 Дүн: <b>${amount.toLocaleString()}₮</b>\n` +
    `📦 Нэмэгдсэн мессеж: <b>${creditsAdded}</b>\n` +
    `✅ Статус: Амжилттай`
  );
}
