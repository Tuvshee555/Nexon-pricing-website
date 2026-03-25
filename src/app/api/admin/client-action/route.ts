import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MONTHLY_PLANS } from "@/types";
import { addCredits, addVirtualBalance } from "@/lib/credits";

export async function POST(request: Request) {
  try {
    // Read body FIRST — before cookies() is called by createClient()
    // Next.js 14 can fail to read request body after cookies() is accessed
    const body = await request.json();
    const { businessId, action } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = await createAdminClient();

    const { data: userData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    switch (action) {
      case "activate":
        await adminClient
          .from("businesses")
          .update({ status: "active" })
          .eq("id", businessId);
        break;

      case "pause":
        await adminClient
          .from("businesses")
          .update({ status: "paused" })
          .eq("id", businessId);
        break;

      case "cancel":
        await adminClient
          .from("businesses")
          .update({ status: "cancelled" })
          .eq("id", businessId);
        break;

      case "add_credits": {
        const credits = parseInt(body.credits);
        if (!credits || credits <= 0) {
          return NextResponse.json({ error: "Invalid credits" }, { status: 400 });
        }
        await addCredits(adminClient, businessId, credits);
        await adminClient.from("transactions").insert({
          business_id: businessId,
          amount: 0,
          credits_added: credits,
          payment_method: "manual",
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_type: "manual",
        });
        break;
      }

      case "add_balance": {
        const amount = parseInt(body.amount);
        if (!amount || amount <= 0) {
          return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }
        await addVirtualBalance(adminClient, businessId, amount);
        await adminClient.from("transactions").insert({
          business_id: businessId,
          amount,
          credits_added: 0,
          payment_method: "manual",
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_type: "topup",
        });
        break;
      }

      case "set_billing": {
        await adminClient
          .from("businesses")
          .update({
            subscription_price: parseInt(body.subscription_price) || 0,
            billing_active: body.billing_active === true,
            next_billing_date: body.next_billing_date || null,
          })
          .eq("id", businessId);
        break;
      }

      case "add_platform":
        await adminClient.from("platform_accounts").upsert({
          business_id: businessId,
          platform: body.platform,
          external_id: body.external_id,
        });
        break;

      case "setup_business": {
        // Create a business for an existing user who registered but has no business
        const { userId, businessName, platforms, planType, monthlyTier, initialCredits, botPrompt } = body;
        if (!userId || !businessName) {
          return NextResponse.json({ error: "userId and businessName required" }, { status: 400 });
        }

        const { data: newBiz, error: bizErr } = await adminClient
          .from("businesses")
          .insert({
            user_id: userId,
            name: businessName,
            platforms: platforms || [],
            bot_prompt: botPrompt || "",
            contact_phone: "",
            contact_email: "",
            status: "active",
          })
          .select()
          .single();

        if (bizErr || !newBiz) {
          return NextResponse.json({ error: bizErr?.message || "Failed to create business" }, { status: 500 });
        }

        // Create plan
        const mp = MONTHLY_PLANS.find((p) => p.tier === (monthlyTier || "basic"));
        await adminClient.from("plans").insert({
          business_id: newBiz.id,
          plan_type: planType || "credit",
          monthly_tier: planType === "monthly" ? (monthlyTier || "basic") : null,
          monthly_message_limit:
            planType === "monthly"
              ? mp?.messageLimit === Infinity ? -1 : mp?.messageLimit || null
              : null,
          monthly_price: planType === "monthly" ? mp?.price || null : null,
          billing_cycle_start: new Date().toISOString().split("T")[0],
        });

        // Create credits
        const initCredits = parseInt(initialCredits) || 0;
        await adminClient.from("credits").insert({
          business_id: newBiz.id,
          balance: initCredits,
          total_purchased: initCredits,
        });

        return NextResponse.json({ success: true, businessId: newBiz.id });
      }

      case "update": {
        await adminClient
          .from("businesses")
          .update({
            name: body.name,
            bot_prompt: body.bot_prompt,
            contact_phone: body.contact_phone,
            contact_email: body.contact_email,
            status: body.status,
          })
          .eq("id", businessId);

        // Update plan
        const { data: existingPlan } = await adminClient
          .from("plans")
          .select("id")
          .eq("business_id", businessId)
          .single();

        const monthlyPlan = MONTHLY_PLANS.find((p) => p.tier === body.monthly_tier);
        const planData = {
          business_id: businessId,
          plan_type: body.plan_type,
          monthly_tier: body.plan_type === "monthly" ? body.monthly_tier : null,
          monthly_message_limit:
            body.plan_type === "monthly"
              ? monthlyPlan?.messageLimit === Infinity
                ? -1
                : monthlyPlan?.messageLimit || null
              : null,
          monthly_price:
            body.plan_type === "monthly" ? monthlyPlan?.price || null : null,
        };

        if (existingPlan) {
          await adminClient.from("plans").update(planData).eq("id", existingPlan.id);
        } else {
          await adminClient.from("plans").insert({
            ...planData,
            billing_cycle_start: new Date().toISOString().split("T")[0],
          });
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
