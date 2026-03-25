import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  notifySubscriptionDeducted,
  notifyLowBalance,
} from "@/lib/telegram";

export async function POST() {
  try {
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        // Pause bot — insufficient balance
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
        // Deduct and advance billing date
        await adminClient
          .from("businesses")
          .update({
            virtual_balance: newBalance,
            next_billing_date: nextDateStr,
          })
          .eq("id", biz.id);

        // Log subscription transaction
        await adminClient.from("transactions").insert({
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

        // Warn if balance is now below one month's subscription
        if (newBalance < biz.subscription_price) {
          await notifyLowBalance(biz.name, newBalance, nextDateStr);
        }
      }

      results.push({ id: biz.id, name: biz.name, newBalance, nextDate: nextDateStr });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (err) {
    console.error("Run billing error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
