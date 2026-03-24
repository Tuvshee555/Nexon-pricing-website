const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function sendTelegramMessage(text: string): Promise<void> {
  try {
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

export async function notifyNewUser(email: string): Promise<void> {
  await sendTelegramMessage(
    `🆕 <b>Шинэ хэрэглэгч бүртгүүллээ</b>\n\n📧 И-мэйл: <code>${email}</code>`
  );
}

export async function notifyCreditspurchased(
  businessName: string,
  amount: number,
  creditsAdded: number
): Promise<void> {
  await sendTelegramMessage(
    `💳 <b>Кредит худалдан авлаа</b>\n\n🏢 Бизнес: <b>${businessName}</b>\n💰 Дүн: <b>${amount.toLocaleString()}₮</b>\n⚡ Нэмэгдсэн кредит: <b>${creditsAdded}</b>`
  );
}

export async function notifyContactForm(
  name: string,
  phone: string,
  email: string,
  message: string
): Promise<void> {
  await sendTelegramMessage(
    `📩 <b>Холбоо барих маягт</b>\n\n👤 Нэр: <b>${name}</b>\n📞 Утас: <code>${phone}</code>\n📧 И-мэйл: <code>${email}</code>\n💬 Мессеж:\n${message}`
  );
}
