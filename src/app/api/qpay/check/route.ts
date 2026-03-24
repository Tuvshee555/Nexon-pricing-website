import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPayment } from "@/lib/qpay";
import { notifyCreditspurchased } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");
    const businessId = searchParams.get("business_id");
    const credits = parseInt(searchParams.get("credits") || "0");
    const amount = parseInt(searchParams.get("amount") || "0");

    if (!invoiceId || !businessId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.rows[0]?.payment_status === "PAID") {
      const supabase = await createAdminClient();

      // Check if already processed
      const { data: tx } = await supabase
        .from("transactions")
        .select("status")
        .eq("qpay_invoice_id", invoiceId)
        .single();

      if (tx?.status === "paid") {
        return NextResponse.json({ paid: true, alreadyProcessed: true });
      }

      const paymentId = result.rows[0].payment_id;

      // Add credits
      await supabase.rpc("add_credits", {
        p_business_id: businessId,
        p_credits: credits,
      });

      // Update transaction
      await supabase
        .from("transactions")
        .update({
          status: "paid",
          qpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq("qpay_invoice_id", invoiceId);

      // Notify admin
      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .single();

      await notifyCreditspurchased(business?.name || "Unknown", amount, credits);

      return NextResponse.json({ paid: true });
    }

    return NextResponse.json({ paid: false });
  } catch (err: unknown) {
    console.error("QPay check error:", err);
    return NextResponse.json({ paid: false, error: String(err) });
  }
}
