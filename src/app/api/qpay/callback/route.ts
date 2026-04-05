import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyPaymentReceived } from "@/lib/telegram";
import { addCredits, addVirtualBalance } from "@/lib/credits";
import { inferTransactionType } from "@/lib/transactions";
import { checkPayment } from "@/lib/qpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, invoice_id, payment_status } = body;

    if (payment_status !== "PAID") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createAdminClient();

    // Find the transaction by invoice_id
    const { data: tx } = await supabase
      .from("transactions")
      .select("*, businesses(name)")
      .eq("qpay_invoice_id", invoice_id)
      .single();

    if (!tx) {
      console.error("QPay callback: no transaction found for invoice", invoice_id);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Idempotency: skip if already processed
    if (tx.status === "paid") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Verify payment with QPay API to prevent fake callbacks
    const verification = await checkPayment(invoice_id);
    if (!verification.count || verification.count === 0) {
      console.error("QPay callback: payment verification failed for invoice", invoice_id);
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const txType = inferTransactionType(tx);
    const businessName = (tx.businesses as { name: string } | null)?.name || "Unknown";

    if (txType === "topup") {
      await addVirtualBalance(supabase, tx.business_id, tx.amount);
    } else {
      await addCredits(supabase, tx.business_id, tx.credits_added);
    }

    await supabase
      .from("transactions")
      .update({
        status: "paid",
        qpay_payment_id: payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    await notifyPaymentReceived(businessName, tx.amount, txType as "topup" | "message_pack");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("QPay callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
