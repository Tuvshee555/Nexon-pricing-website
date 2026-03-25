import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyPaymentReceived } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, invoice_id, payment_status } = body;

    if (payment_status !== "PAID") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createAdminClient();

    // Get transaction with business name
    const { data: tx } = await supabase
      .from("transactions")
      .select("*, businesses(name)")
      .eq("qpay_invoice_id", invoice_id)
      .single();

    if (!tx || tx.status === "paid") {
      return NextResponse.json({ success: true });
    }

    const txType = tx.transaction_type || "message_pack";
    const businessName = (tx.businesses as { name: string } | null)?.name || "Unknown";

    if (txType === "topup") {
      // Atomic virtual balance increment — no race conditions
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

    // Update transaction to paid
    await supabase
      .from("transactions")
      .update({
        status: "paid",
        qpay_payment_id: payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    // Notify admin
    await notifyPaymentReceived(businessName, tx.amount, txType as "topup" | "message_pack");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("QPay callback error:", err);
    // Always return 200 to QPay
    return NextResponse.json({ success: true });
  }
}
