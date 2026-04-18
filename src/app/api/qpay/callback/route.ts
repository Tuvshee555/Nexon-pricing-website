import { NextResponse } from "next/server";
import { processQPayPayment } from "@/lib/qpay-process";
import { resumeFlowAfterPayment } from "@/lib/flow-runner";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, invoice_id, payment_status } = body;

    if (payment_status !== "PAID") return NextResponse.json({ success: true });

    const result = await processQPayPayment(invoice_id, payment_id);

    switch (result.status) {
      case "not_found":
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      case "already_paid":
        return NextResponse.json({ success: true, message: "Already processed" });
      case "cancelled":
        return NextResponse.json({ success: true, message: "Invoice cancelled" });
      case "verification_failed":
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
      case "success":
        // Resume any flow executions waiting on this payment
        await resumeFlowAfterPayment(invoice_id).catch(() => null);
        return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("QPay callback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
