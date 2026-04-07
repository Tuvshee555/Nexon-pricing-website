import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkPayment } from "@/lib/qpay";
import { notifyPaymentReceived } from "@/lib/telegram";
import { addCredits, addVirtualBalance } from "@/lib/credits";
import { inferTransactionType } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    if (!invoiceId) return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });

    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.rows[0]?.payment_status === "PAID") {
      const txRows = await sql`
        SELECT t.*, b.name as business_name
        FROM transactions t
        LEFT JOIN businesses b ON t.business_id = b.id
        WHERE t.qpay_invoice_id = ${invoiceId} LIMIT 1
      `;
      const tx = txRows[0] ?? null;

      if (!tx) return NextResponse.json({ paid: false, error: "Transaction not found" });
      if (tx.status === "paid") return NextResponse.json({ paid: true, alreadyProcessed: true });

      const paymentId = result.rows[0].payment_id;
      const txType = inferTransactionType(tx as { transaction_type?: string; payment_method?: string; credits_added?: number; amount?: number });
      const businessName = (tx.business_name as string) || "Unknown";

      if (txType === "topup") {
        await addVirtualBalance(tx.business_id as string, tx.amount as number);
      } else {
        await addCredits(tx.business_id as string, tx.credits_added as number);
      }

      await sql`
        UPDATE transactions
        SET status = 'paid', qpay_payment_id = ${paymentId}, paid_at = NOW()
        WHERE qpay_invoice_id = ${invoiceId}
      `;

      const bizRows = await sql`
        SELECT onboarding_done, status FROM businesses WHERE id = ${tx.business_id as string} LIMIT 1
      `;
      const biz = bizRows[0] ?? null;

      if (biz && !biz.onboarding_done) {
        await sql`
          UPDATE businesses
          SET onboarding_done = true, onboarding_step = 5, status = 'active'
          WHERE id = ${tx.business_id as string}
        `;
      }

      await notifyPaymentReceived(businessName, tx.amount as number, txType as "topup" | "message_pack");

      return NextResponse.json({ paid: true, type: txType });
    }

    return NextResponse.json({ paid: false });
  } catch (err: unknown) {
    console.error("QPay check error:", err);
    return NextResponse.json({ paid: false, error: String(err) });
  }
}
