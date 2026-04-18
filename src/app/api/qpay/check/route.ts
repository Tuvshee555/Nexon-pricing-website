import { NextResponse } from "next/server";
import { processQPayPayment } from "@/lib/qpay-process";
import { checkPayment } from "@/lib/qpay";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    if (!invoiceId) return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });

    // Quick pre-check: if QPay doesn't show PAID yet, skip DB work entirely
    const verification = await checkPayment(invoiceId);
    if (!verification.count || verification.rows[0]?.payment_status !== "PAID") {
      return NextResponse.json({ paid: false });
    }

    const result = await processQPayPayment(invoiceId, verification.rows[0].payment_id);

    switch (result.status) {
      case "not_found":
        return NextResponse.json({ paid: false, error: "Transaction not found" });
      case "already_paid":
        return NextResponse.json({ paid: true, alreadyProcessed: true });
      case "cancelled":
        return NextResponse.json({ paid: false, expired: true, error: "Invoice expired" });
      case "verification_failed":
        return NextResponse.json({ paid: false, error: "Payment verification failed" });
      case "success":
        return NextResponse.json({ paid: true, type: result.transactionType });
    }
  } catch (err: unknown) {
    console.error("QPay check error:", err);
    return NextResponse.json({ paid: false, error: String(err) });
  }
}
