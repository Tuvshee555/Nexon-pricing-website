import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPayment } from "@/lib/qpay";
import { notifyPaymentReceived } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.rows[0]?.payment_status === "PAID") {
      const supabase = await createAdminClient();

      // Load transaction
      const { data: tx } = await supabase
        .from("transactions")
        .select("*, businesses(name)")
        .eq("qpay_invoice_id", invoiceId)
        .single();

      if (!tx) {
        return NextResponse.json({ paid: false, error: "Transaction not found" });
      }

      // Already processed — just return success
      if (tx.status === "paid") {
        return NextResponse.json({ paid: true, alreadyProcessed: true });
      }

      const paymentId = result.rows[0].payment_id;
      const txType = tx.transaction_type || "message_pack";
      const businessName = (tx.businesses as { name: string } | null)?.name || "Unknown";

      if (txType === "topup") {
        // Atomic virtual balance increment
        await supabase.rpc("increment_virtual_balance", {
          p_business_id: tx.business_id,
          p_amount: tx.amount,
        });
      } else {
        // Add message credits atomically
        await supabase.rpc("add_credits", {
          p_business_id: tx.business_id,
          p_credits: tx.credits_added,
        });
      }

      // Mark paid
      await supabase
        .from("transactions")
        .update({
          status: "paid",
          qpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq("qpay_invoice_id", invoiceId);

      // Notify admin
      await notifyPaymentReceived(businessName, tx.amount, txType as "topup" | "message_pack");

      return NextResponse.json({ paid: true, type: txType });
    }

    return NextResponse.json({ paid: false });
  } catch (err: unknown) {
    console.error("QPay check error:", err);
    return NextResponse.json({ paid: false, error: String(err) });
  }
}
