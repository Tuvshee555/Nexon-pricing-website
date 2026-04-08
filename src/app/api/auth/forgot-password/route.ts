import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const rows = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;

    // Always return success to prevent email enumeration.
    if (rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await sql`
      UPDATE users
      SET reset_token = ${token}, reset_token_expires = ${expires.toISOString()}
      WHERE email = ${normalizedEmail}
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const subject = "Nexon: Нууц үг сэргээх холбоос";
    const text =
      `Сайн байна уу,\n\n` +
      `Та Nexon нууц үгээ сэргээх хүсэлт илгээсэн байна.\n` +
      `Доорх холбоос дээр дарж 1 цагийн дотор шинэ нууц үг тохируулна уу:\n\n` +
      `${resetUrl}\n\n` +
      `Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тооно уу.\n\n` +
      `Nexon баг`;

    const result = await sendEmail({
      to: normalizedEmail,
      subject,
      text,
      html: `<p>Сайн байна уу,</p>
<p>Та Nexon нууц үгээ сэргээх хүсэлт илгээсэн байна.</p>
<p><a href="${resetUrl}">ЭНД ДАРЖ НУУЦ ҮГЭЭ СЭРГЭЭНЭ ҮҮ</a> (1 цагийн хүчинтэй)</p>
<p>Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тооно уу.</p>
<p>Nexon баг</p>`,
    });

    if (!result.ok) {
      // Non-blocking fallback
      console.log(`Password reset link fallback for ${normalizedEmail}: ${resetUrl}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
