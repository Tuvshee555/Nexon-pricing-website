import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { notifySubscriptionDeducted, notifyLowBalance } from "@/lib/telegram";
import { insertTransaction } from "@/lib/transactions";

export async function GET(request: NextRequest) {
  return handleBilling(request);
}

export async function POST(request: NextRequest) {
  return handleBilling(request);
}

async function handleBilling(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret && !isVercelCron) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    const dueBusinesses = await sql`
      SELECT id, name, virtual_balance, subscription_price, next_billing_date
      FROM businesses WHERE billing_active = true AND next_billing_date <= ${now}
    `;

    if (!dueBusinesses.length) return NextResponse.json({ success: true, processed: 0 });

    const results = [];

    for (const biz of dueBusinesses) {
      const newBalance = ((biz.virtual_balance as number) || 0) - ((biz.subscription_price as number) || 0);
      const nextDate = new Date((biz.next_billing_date as string) || now);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDateStr = nextDate.toISOString();

      if (newBalance < 0) {
        await sql`
          UPDATE businesses
          SET virtual_balance = 0, billing_active = false, status = 'paused', next_billing_date = ${nextDateStr}
          WHERE id = ${biz.id as string}
        `;
        await notifyLowBalance(biz.name as string, 0, nextDateStr);
      } else {
        await sql`
          UPDATE businesses SET virtual_balance = ${newBalance}, next_billing_date = ${nextDateStr}
          WHERE id = ${biz.id as string}
        `;
        await insertTransaction({
          business_id: biz.id as string, amount: biz.subscription_price as number,
          credits_added: 0, payment_method: "manual", status: "paid",
          paid_at: now, transaction_type: "subscription",
        });
        await notifySubscriptionDeducted(biz.name as string, biz.subscription_price as number, newBalance, nextDateStr);
        if (newBalance < (biz.subscription_price as number)) {
          await notifyLowBalance(biz.name as string, newBalance, nextDateStr);
        }
      }

      results.push({ id: biz.id, name: biz.name, newBalance, nextDate: nextDateStr });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (err) {
    console.error("Cron billing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
