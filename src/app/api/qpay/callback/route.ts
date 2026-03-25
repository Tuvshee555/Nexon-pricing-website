import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyPaymentReceived } from "@/lib/telegram";
import { addCredits, addVirtualBalance } from "@/lib/credits";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, invoice_id, payment_status } = body;

    if (payment_status !== "PAID") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createAdminClient();

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
    return NextResponse.json({ success: true });
  }
}
