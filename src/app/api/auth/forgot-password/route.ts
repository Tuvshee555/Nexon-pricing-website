import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const rows = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    // Always return success to prevent email enumeration
    if (rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      UPDATE users
      SET reset_token = ${token}, reset_token_expires = ${expires.toISOString()}
      WHERE email = ${email.toLowerCase()}
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Log to console for now — replace with email service when ready
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    // Optionally send via Telegram to admin
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (telegramToken && chatId) {
      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔑 Password reset requested for ${email}\nLink: ${resetUrl}`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
