import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { notifyLowMessageCredits } from "@/lib/telegram";

interface CreditAlertRow {
  balance: number;
  total_purchased: number;
  low_credit_alert_active: boolean | null;
  business_name: string;
  user_email: string | null;
  contact_email: string | null;
}

function lowCreditThreshold(totalPurchased: number): number {
  return Math.max(1, Math.ceil(totalPurchased * 0.2));
}

export async function rearmLowCreditAlertIfRecovered(businessId: string) {
  await sql`
    UPDATE credits
    SET low_credit_alert_active = false,
        low_credit_alert_sent_at = NULL,
        updated_at = NOW()
    WHERE business_id = ${businessId}
      AND low_credit_alert_active = true
      AND balance > GREATEST(1, CEIL(total_purchased::numeric * 0.2)::int)
  `;
}

export async function maybeSendLowCreditAlert(businessId: string) {
  const rows = await sql`
    SELECT
      c.balance,
      c.total_purchased,
      c.low_credit_alert_active,
      b.name AS business_name,
      u.email AS user_email,
      b.contact_email
    FROM credits c
    JOIN businesses b ON b.id = c.business_id
    JOIN users u ON u.id = b.user_id
    WHERE c.business_id = ${businessId}
    LIMIT 1
  `;
  const row = (rows[0] ?? null) as CreditAlertRow | null;
  if (!row) return;

  const totalPurchased = Number(row.total_purchased || 0);
  if (totalPurchased <= 0) return;

  const balance = Number(row.balance || 0);
  const threshold = lowCreditThreshold(totalPurchased);
  const alertActive = !!row.low_credit_alert_active;
  const isLow = balance <= threshold;

  if (!isLow) {
    if (alertActive) {
      await rearmLowCreditAlertIfRecovered(businessId);
    }
    return;
  }

  if (alertActive) return;

  const businessName = row.business_name || "Таны бизнес";
  const recipientEmail = row.user_email?.trim() || row.contact_email?.trim() || "";

  const subject = "Nexon сануулга: Мессеж кредит багаслаа";
  const text =
    `Сайн байна уу,\n\n` +
    `${businessName} бизнесийн мессеж кредит багассан байна.\n` +
    `Үлдэгдэл: ${balance.toLocaleString()}\n` +
    `Сануулгын босго: ${threshold.toLocaleString()} (нийт худалдан авалтын 20%)\n\n` +
    `Bot гацахаас өмнө dashboard-с кредит нэмнэ үү.\n\n` +
    `Nexon баг`;

  const emailJob =
    recipientEmail.length > 0
      ? sendEmail({
          to: recipientEmail,
          subject,
          text,
          html: `<p>Сайн байна уу,</p>
<p><b>${businessName}</b> бизнесийн мессеж кредит багассан байна.</p>
<p>Үлдэгдэл: <b>${balance.toLocaleString()}</b><br/>Сануулгын босго: <b>${threshold.toLocaleString()}</b> (нийт худалдан авалтын 20%)</p>
<p>Bot гацахаас өмнө dashboard-с кредит нэмнэ үү.</p>
<p>Nexon баг</p>`,
        })
      : Promise.resolve({ ok: false, skipped: true, error: "NO_RECIPIENT" });

  const telegramJob = notifyLowMessageCredits(businessName, balance, threshold, recipientEmail);

  await Promise.allSettled([emailJob, telegramJob]);

  await sql`
    UPDATE credits
    SET low_credit_alert_active = true,
        low_credit_alert_sent_at = NOW(),
        updated_at = NOW()
    WHERE business_id = ${businessId}
      AND low_credit_alert_active = false
  `;
}
