import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { invoice_id: invoiceId } = (await request.json()) as { invoice_id?: string };
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE transactions t
      SET status = 'cancelled'
      FROM businesses b
      WHERE t.business_id = b.id
        AND b.user_id = ${userId}
        AND t.qpay_invoice_id = ${invoiceId}
        AND t.status = 'pending'
      RETURNING t.id
    `;

    return NextResponse.json({ success: true, cancelled: updated.length > 0 });
  } catch (err) {
    console.error("QPay expire invoice error:", err);
    return NextResponse.json({ error: "Failed to expire invoice" }, { status: 500 });
  }
}
