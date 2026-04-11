import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { notifyPaymentReceived } from "@/lib/telegram";
import { addVirtualBalance } from "@/lib/credits";
import { checkPayment } from "@/lib/qpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, invoice_id, payment_status } = body;

    if (payment_status !== "PAID") return NextResponse.json({ success: true });

    const txRows = await sql`
      SELECT t.*, b.name as business_name
      FROM transactions t
      LEFT JOIN businesses b ON t.business_id = b.id
      WHERE t.qpay_invoice_id = ${invoice_id} LIMIT 1
    `;
    const tx = txRows[0] ?? null;

    if (!tx) {
      console.error("QPay callback: no transaction found for invoice", invoice_id);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (tx.status === "paid") return NextResponse.json({ success: true, message: "Already processed" });
    if (tx.status === "cancelled") {
      return NextResponse.json({ success: true, message: "Invoice cancelled" });
    }

    const verification = await checkPayment(invoice_id);
    if (!verification.count || verification.count === 0) {
      console.error("QPay callback: payment verification failed for invoice", invoice_id);
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const businessName = (tx.business_name as string) || "Unknown";
    const txType = (tx.transaction_type as string) || "subscription";

    await addVirtualBalance(tx.business_id as string, tx.amount as number);

    await sql`
      UPDATE transactions
      SET status = 'paid', qpay_payment_id = ${payment_id}, paid_at = NOW()
      WHERE id = ${tx.id as string}
    `;

    const bizRows = await sql`SELECT onboarding_done FROM businesses WHERE id = ${tx.business_id as string} LIMIT 1`;
    if (bizRows[0] && !bizRows[0].onboarding_done) {
      await sql`
        UPDATE businesses
        SET onboarding_done = true, onboarding_step = 5, status = 'active'
        WHERE id = ${tx.business_id as string}
      `;
    }

    await notifyPaymentReceived(businessName, tx.amount as number, txType === "topup" ? "topup" : "subscription");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("QPay callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
