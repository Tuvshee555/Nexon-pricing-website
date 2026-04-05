import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MONTHLY_PLANS } from "@/types";
import { addCredits, addVirtualBalance } from "@/lib/credits";
import { insertTransaction } from "@/lib/transactions";

const MAX_CREDITS = 1_000_000;
const MAX_BALANCE = 100_000_000;

function safeInt(value: unknown, max: number): number | null {
  const num = typeof value === "number" ? value : parseInt(String(value));
  if (!Number.isFinite(num) || num <= 0 || num > max) return null;
  return num;
}

function isValidPlatformId(platform: string, externalId: string): boolean {
  if (!externalId || typeof externalId !== "string") return false;
  const trimmed = externalId.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  // Only allow alphanumeric, dots, underscores, hyphens
  return /^[a-zA-Z0-9._-]+$/.test(trimmed);
}

const VALID_ACTIONS = [
  "activate", "pause", "cancel", "add_credits", "reduce_credits",
  "add_balance", "set_billing", "add_platform", "setup_business", "update",
] as const;

type ValidAction = typeof VALID_ACTIONS[number];

async function logAudit(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  adminId: string,
  action: string,
  businessId: string | null,
  details?: Record<string, unknown>
) {
  try {
    await adminClient.from("audit_logs").insert({
      admin_id: adminId,
      action,
      business_id: businessId,
      details: details || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Don't fail the request if audit logging fails — log it server-side
    console.error("Audit log insert failed:", err);
  }
}

export async function POST(request: Request) {
  try {
    // Read body FIRST — before cookies() is called by createClient()
    // Next.js 14 can fail to read request body after cookies() is accessed
    const body = await request.json();
    const { businessId, action } = body;

    if (!action || !VALID_ACTIONS.includes(action as ValidAction)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

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
        await logAudit(adminClient, user.id, "activate", businessId);
        break;

      case "pause":
        await adminClient
          .from("businesses")
          .update({ status: "paused" })
          .eq("id", businessId);
        await logAudit(adminClient, user.id, "pause", businessId);
        break;

      case "cancel":
        await adminClient
          .from("businesses")
          .update({ status: "cancelled" })
          .eq("id", businessId);
        await logAudit(adminClient, user.id, "cancel", businessId);
        break;

      case "add_credits": {
        const credits = safeInt(body.credits, MAX_CREDITS);
        if (!credits) {
          return NextResponse.json({ error: "Invalid credits (must be 1-1,000,000)" }, { status: 400 });
        }
        await addCredits(adminClient, businessId, credits);
        await insertTransaction(adminClient, {
          business_id: businessId,
          amount: 0,
          credits_added: credits,
          payment_method: "manual",
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_type: "manual",
        });
        await logAudit(adminClient, user.id, "add_credits", businessId, { credits });
        break;
      }

      case "reduce_credits": {
        const reduceAmount = safeInt(body.credits, MAX_CREDITS);
        if (!reduceAmount) {
          return NextResponse.json({ error: "Invalid credits (must be 1-1,000,000)" }, { status: 400 });
        }
        const { data: curCredits } = await adminClient
          .from("credits")
          .select("balance")
          .eq("business_id", businessId)
          .single();

        const newBalance = Math.max(0, (curCredits?.balance || 0) - reduceAmount);
        await adminClient
          .from("credits")
          .update({ balance: newBalance })
          .eq("business_id", businessId);
        await logAudit(adminClient, user.id, "reduce_credits", businessId, { reduceAmount, newBalance });
        break;
      }

      case "add_balance": {
        const amount = safeInt(body.amount, MAX_BALANCE);
        if (!amount) {
          return NextResponse.json({ error: "Invalid amount (must be 1-100,000,000)" }, { status: 400 });
        }
        await addVirtualBalance(adminClient, businessId, amount);
        await insertTransaction(adminClient, {
          business_id: businessId,
          amount,
          credits_added: 0,
          payment_method: "manual",
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_type: "topup",
        });
        await logAudit(adminClient, user.id, "add_balance", businessId, { amount });
        break;
      }

      case "set_billing": {
        const subPrice = parseInt(String(body.subscription_price)) || 0;
        if (subPrice < 0 || subPrice > MAX_BALANCE) {
          return NextResponse.json({ error: "Invalid subscription price" }, { status: 400 });
        }
        await adminClient
          .from("businesses")
          .update({
            subscription_price: subPrice,
            billing_active: body.billing_active === true,
            next_billing_date: body.next_billing_date || null,
          })
          .eq("id", businessId);
        await logAudit(adminClient, user.id, "set_billing", businessId, {
          subscription_price: subPrice,
          billing_active: body.billing_active,
          next_billing_date: body.next_billing_date,
        });
        break;
      }

      case "add_platform": {
        if (!body.platform || !["instagram", "messenger"].includes(body.platform)) {
          return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
        }
        if (!isValidPlatformId(body.platform, body.external_id)) {
          return NextResponse.json(
            { error: "Invalid external ID. Must be 3-100 characters, alphanumeric with dots, underscores, hyphens." },
            { status: 400 }
          );
        }
        await adminClient.from("platform_accounts").upsert({
          business_id: businessId,
          platform: body.platform,
          external_id: body.external_id.trim(),
        });
        await logAudit(adminClient, user.id, "add_platform", businessId, {
          platform: body.platform,
          external_id: body.external_id.trim(),
        });
        break;
      }

      case "setup_business": {
        // Create a business for an existing user who registered but has no business
        const { userId, businessName, platforms, planType, monthlyTier, initialCredits, botPrompt } = body;
        if (!userId || !businessName || typeof businessName !== "string" || businessName.trim().length < 1) {
          return NextResponse.json({ error: "userId and businessName required" }, { status: 400 });
        }

        const { data: newBiz, error: bizErr } = await adminClient
          .from("businesses")
          .insert({
            user_id: userId,
            name: businessName.trim(),
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
        const initCredits = safeInt(initialCredits, MAX_CREDITS) || 0;
        await adminClient.from("credits").insert({
          business_id: newBiz.id,
          balance: initCredits,
          total_purchased: initCredits,
        });

        await logAudit(adminClient, user.id, "setup_business", newBiz.id, {
          userId,
          businessName: businessName.trim(),
          planType,
          initialCredits: initCredits,
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

        await logAudit(adminClient, user.id, "update", businessId, {
          name: body.name,
          status: body.status,
          plan_type: body.plan_type,
        });
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
