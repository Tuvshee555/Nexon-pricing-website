import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { MONTHLY_PLANS } from "@/types";
import { createInvoice } from "@/lib/qpay";
import { insertTransaction } from "@/lib/transactions";

export async function POST(request: Request) {
  try {
    const { businessId, amount, monthlyTier } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    if (!businessId || !amount || !monthlyTier) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const businesses = await sql`
      SELECT id, name FROM businesses WHERE id = ${businessId} AND user_id = ${userId} LIMIT 1
    `;
    if (!businesses[0]) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const plan = MONTHLY_PLANS.find((item) => item.tier === monthlyTier);
    if (!plan) {
      return NextResponse.json({ error: "Invalid monthly plan" }, { status: 400 });
    }

    const senderInvoiceNo = `NEXON-${Date.now()}-${businessId.slice(0, 8)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/qpay/callback`;
    const description = `Nexon сарын захиалга: ${plan.nameMn} (${amount.toLocaleString()}₮)`;

    const invoice = await createInvoice({ amount, description, callbackUrl, senderInvoiceNo });

    await insertTransaction({
      business_id: businessId,
      amount,
      credits_added: 0,
      payment_method: "qpay",
      qpay_invoice_id: invoice.invoice_id,
      status: "pending",
      transaction_type: "subscription",
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
