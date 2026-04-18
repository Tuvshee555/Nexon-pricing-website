import { sql } from "@/lib/db";
import { checkPayment } from "@/lib/qpay";
import { addVirtualBalance } from "@/lib/credits";
import { notifyPaymentReceived } from "@/lib/telegram";

export type ProcessPaymentResult =
  | { status: "not_found" }
  | { status: "already_paid" }
  | { status: "cancelled" }
  | { status: "verification_failed" }
  | { status: "success"; transactionType: string };

/**
 * Shared payment processing logic used by both the QPay callback and
 * the client-side polling (check) endpoints.
 *
 * Returns a result discriminated union so each caller can build its
 * own HTTP response shape.
 */
export async function processQPayPayment(
  invoiceId: string,
  paymentId: string | null
): Promise<ProcessPaymentResult> {
  const txRows = await sql`
    SELECT t.*, b.name as business_name
    FROM transactions t
    LEFT JOIN businesses b ON t.business_id = b.id
    WHERE t.qpay_invoice_id = ${invoiceId} LIMIT 1
  `;
  const tx = txRows[0] ?? null;

  if (!tx) return { status: "not_found" };
  if (tx.status === "paid") return { status: "already_paid" };
  if (tx.status === "cancelled") return { status: "cancelled" };

  const verification = await checkPayment(invoiceId);
  if (!verification.count || verification.count === 0) {
    return { status: "verification_failed" };
  }

  const resolvedPaymentId = paymentId ?? verification.rows[0]?.payment_id ?? null;
  const businessName = (tx.business_name as string) || "Unknown";
  const txType = (tx.transaction_type as string) || "subscription";

  await addVirtualBalance(tx.business_id as string, tx.amount as number);

  await sql`
    UPDATE transactions
    SET status = 'paid', qpay_payment_id = ${resolvedPaymentId}, paid_at = NOW()
    WHERE qpay_invoice_id = ${invoiceId}
  `;

  const bizRows = await sql`
    SELECT onboarding_done FROM businesses WHERE id = ${tx.business_id as string} LIMIT 1
  `;
  if (bizRows[0] && !bizRows[0].onboarding_done) {
    await sql`
      UPDATE businesses
      SET onboarding_done = true, onboarding_step = 5, status = 'active'
      WHERE id = ${tx.business_id as string}
    `;
  }

  await notifyPaymentReceived(
    businessName,
    tx.amount as number,
    txType === "topup" ? "topup" : "subscription"
  );

  return { status: "success", transactionType: txType };
}
