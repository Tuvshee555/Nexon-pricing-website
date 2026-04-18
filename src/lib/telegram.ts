function getBotToken(): string {
  const val = process.env.TELEGRAM_BOT_TOKEN;
  if (!val) throw new Error("Missing env var: TELEGRAM_BOT_TOKEN");
  return val;
}
function getChatId(): string {
  const val = process.env.TELEGRAM_CHAT_ID;
  if (!val) throw new Error("Missing env var: TELEGRAM_CHAT_ID");
  return val;
}

export async function sendTelegramMessage(text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: getChatId(), text, parse_mode: "HTML" }),
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

// ── Owner notifications (sent to individual business owners, not admin) ────────

export async function notifyOwner(chatId: string, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("Owner notification failed:", err);
  }
}

export async function notifyOwnerContactLimit(
  chatId: string,
  businessName: string,
  used: number,
  limit: number
): Promise<void> {
  const pct = Math.round((used / limit) * 100);
  await notifyOwner(
    chatId,
    `⚠️ <b>Nexon — Контактын хязгаар</b>\n\n` +
    `👤 Бизнес: <b>${businessName}</b>\n` +
    `📊 Ашигласан: <b>${used} / ${limit}</b> (${pct}%)\n\n` +
    `Хязгаарт ойртож байна. Дашбоард дээрээс шинэчлэлт хийнэ үү.\n` +
    `👉 nexon-digital-nova.com/dashboard`
  );
}

export async function notifyOwnerPaymentConfirmed(
  chatId: string,
  businessName: string,
  amount: number,
  nextDate: string
): Promise<void> {
  const dateStr = new Date(nextDate).toLocaleDateString("mn-MN");
  await notifyOwner(
    chatId,
    `✅ <b>Nexon — Төлбөр баталгаажлаа</b>\n\n` +
    `👤 Бизнес: <b>${businessName}</b>\n` +
    `💵 Төлсөн: <b>${amount.toLocaleString()}₮</b>\n` +
    `📅 Дараагийн төлбөр: ${dateStr}\n\n` +
    `Таны бот үргэлжлүүлэн ажиллаж байна. 🤖`
  );
}

export async function notifyOwnerBotPaused(
  chatId: string,
  businessName: string
): Promise<void> {
  await notifyOwner(
    chatId,
    `🔴 <b>Nexon — Бот зогссон</b>\n\n` +
    `👤 Бизнес: <b>${businessName}</b>\n\n` +
    `Үлдэгдэл дуусмагц таны бот зогссон.\n` +
    `Дансаа цэнэглэж дахин идэвхжүүлнэ үү.\n` +
    `👉 nexon-digital-nova.com/dashboard`
  );
}

export async function notifyOwnerBotResumed(
  chatId: string,
  businessName: string
): Promise<void> {
  await notifyOwner(
    chatId,
    `🟢 <b>Nexon — Бот дахин идэвхжлээ</b>\n\n` +
    `👤 Бизнес: <b>${businessName}</b>\n\n` +
    `Таны бот дахин хэрэглэгчдийн асуултад хариулж эхэллээ. 🤖`
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
