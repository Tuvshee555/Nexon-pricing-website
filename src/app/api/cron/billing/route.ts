import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  notifySubscriptionDeducted,
  notifyLowBalance,
} from "@/lib/telegram";
import { insertTransaction } from "@/lib/transactions";

/**
 * Cron-safe billing endpoint.
 * Call with: POST /api/cron/billing
 * Header: Authorization: Bearer <CRON_SECRET>
 *
 * Set CRON_SECRET in your environment variables and configure
 * an external cron service (e.g., Vercel Cron, cron-job.org) to call this.
 */
// Vercel Cron calls GET — handle both GET and POST
export async function GET(request: NextRequest) {
  return handleBilling(request);
}

export async function POST(request: NextRequest) {
  return handleBilling(request);
}

async function handleBilling(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = await createAdminClient();
    const now = new Date().toISOString();

    // Find all active billing businesses due for deduction
    const { data: dueBusinesses } = await adminClient
      .from("businesses")
      .select("id, name, virtual_balance, subscription_price, next_billing_date")
      .eq("billing_active", true)
      .lte("next_billing_date", now);

    if (!dueBusinesses || dueBusinesses.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const results = [];

    for (const biz of dueBusinesses) {
      const newBalance = (biz.virtual_balance || 0) - (biz.subscription_price || 0);
      const nextDate = new Date(biz.next_billing_date || now);
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDateStr = nextDate.toISOString();

      if (newBalance < 0) {
        await adminClient
          .from("businesses")
          .update({
            virtual_balance: 0,
            billing_active: false,
            status: "paused",
            next_billing_date: nextDateStr,
          })
          .eq("id", biz.id);

        await notifyLowBalance(biz.name, 0, nextDateStr);
      } else {
        await adminClient
          .from("businesses")
          .update({
            virtual_balance: newBalance,
            next_billing_date: nextDateStr,
          })
          .eq("id", biz.id);

        await insertTransaction(adminClient, {
          business_id: biz.id,
          amount: biz.subscription_price,
          credits_added: 0,
          payment_method: "manual",
          status: "paid",
          paid_at: now,
          transaction_type: "subscription",
        });

        await notifySubscriptionDeducted(
          biz.name,
          biz.subscription_price,
          newBalance,
          nextDateStr
        );

        if (newBalance < biz.subscription_price) {
          await notifyLowBalance(biz.name, newBalance, nextDateStr);
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
