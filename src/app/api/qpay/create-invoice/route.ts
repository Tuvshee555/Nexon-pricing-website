import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/qpay";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, amount, credits } = await request.json();

    if (!businessId || !amount || !credits) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify business belongs to user
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const senderInvoiceNo = `NEXON-${Date.now()}-${businessId.slice(0, 8)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qpay/callback`;

    const invoice = await createInvoice({
      amount,
      description: `Nexon кредит: ${credits} кредит`,
      callbackUrl,
      senderInvoiceNo,
    });

    // Create pending transaction
    await supabase.from("transactions").insert({
      business_id: businessId,
      amount,
      credits_added: credits,
      payment_method: "qpay",
      qpay_invoice_id: invoice.invoice_id,
      status: "pending",
    });

    return NextResponse.json(invoice);
  } catch (err: unknown) {
    console.error("QPay create invoice error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invoice creation failed" },
      { status: 500 }
    );
  }
}
