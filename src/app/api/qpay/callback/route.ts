import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyCreditspurchased } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, invoice_id, payment_status } = body;

    if (payment_status !== "PAID") {
      return NextResponse.json({ success: true });
    }

    const supabase = await createAdminClient();

    // Get transaction
    const { data: tx } = await supabase
      .from("transactions")
      .select("*, businesses(name)")
      .eq("qpay_invoice_id", invoice_id)
      .single();

    if (!tx || tx.status === "paid") {
      return NextResponse.json({ success: true });
    }

    // Add credits
    await supabase.rpc("add_credits", {
      p_business_id: tx.business_id,
      p_credits: tx.credits_added,
    });

    // Update transaction
    await supabase
      .from("transactions")
      .update({
        status: "paid",
        qpay_payment_id: payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    // Notify admin
    const businessName = (tx.businesses as {name: string} | null)?.name || "Unknown";
    await notifyCreditspurchased(businessName, tx.amount, tx.credits_added);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("QPay callback error:", err);
    // Always return 200 to QPay
    return NextResponse.json({ success: true });
  }
}
