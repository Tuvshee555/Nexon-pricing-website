import nodemailer from "nodemailer";

interface EmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface EmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

let cachedTransporter: nodemailer.Transporter | null | undefined;

function envAsBoolean(value: string | undefined, fallback = false): boolean {
  if (value == null) return fallback;
  return value.toLowerCase() === "true";
}

function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const secure = envAsBoolean(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP is not configured; email skipped");
    return { ok: false, skipped: true, error: "SMTP_NOT_CONFIGURED" };
  }

  try {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@example.com";
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown mailer error";
    console.error("Email send failed:", message);
    return { ok: false, error: message };
  }
}
