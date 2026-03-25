import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/qpay";

export async function POST(request: Request) {
  try {
    // Read body FIRST before cookies() is accessed
    const { businessId, amount, credits, type = "message_pack" } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!businessId || !amount) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (type === "message_pack" && !credits) {
      return NextResponse.json({ error: "Credits required for message pack" }, { status: 400 });
    }

    // Use admin client for all DB operations to bypass RLS
    const adminClient = await createAdminClient();

    // Verify business belongs to user
    const { data: business } = await adminClient
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

    const description =
      type === "topup"
        ? `Nexon үлдэгдэл нэмэх: ${amount.toLocaleString()}₮`
        : `Nexon мессеж пакет: ${credits} мессеж`;

    const invoice = await createInvoice({
      amount,
      description,
      callbackUrl,
      senderInvoiceNo,
    });

    // Create pending transaction using admin client
    const { error: txError } = await adminClient.from("transactions").insert({
      business_id: businessId,
      amount,
      credits_added: type === "message_pack" ? credits : 0,
      payment_method: "qpay",
      qpay_invoice_id: invoice.invoice_id,
      status: "pending",
      transaction_type: type,
    });

    if (txError) {
      console.error("Transaction insert error:", txError);
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    return NextResponse.json(invoice);
  } catch (err: unknown) {
    console.error("QPay create invoice error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invoice creation failed" },
      { status: 500 }
    );
  }
}
