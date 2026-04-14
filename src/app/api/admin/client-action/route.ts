import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { MONTHLY_PLANS } from "@/types";
import { addVirtualBalance } from "@/lib/credits";
import { insertTransaction } from "@/lib/transactions";

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
  return /^[a-zA-Z0-9._-]+$/.test(trimmed);
}

async function logAudit(adminId: string, action: string, businessId: string | null, details?: Record<string, unknown>) {
  try {
    await sql`
      INSERT INTO audit_logs (admin_id, action, business_id, details)
      VALUES (${adminId}, ${action}, ${businessId}, ${JSON.stringify(details || {})})
    `;
  } catch (err) {
    console.error("Audit log insert failed:", err);
  }
}

const VALID_ACTIONS = [
  "activate", "pause", "cancel",
  "add_balance", "set_billing", "add_platform", "disconnect_platform", "reset_history", "setup_business", "update",
] as const;
type ValidAction = typeof VALID_ACTIONS[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessId, action } = body;

    if (!action || !VALID_ACTIONS.includes(action as ValidAction)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminId = session.user.id;

    switch (action as ValidAction) {
      case "activate":
        await sql`UPDATE businesses SET status = 'active' WHERE id = ${businessId}`;
        await logAudit(adminId, "activate", businessId);
        break;

      case "pause":
        await sql`UPDATE businesses SET status = 'paused' WHERE id = ${businessId}`;
        await logAudit(adminId, "pause", businessId);
        break;

      case "cancel":
        await sql`UPDATE businesses SET status = 'cancelled' WHERE id = ${businessId}`;
        await logAudit(adminId, "cancel", businessId);
        break;

      case "add_balance": {
        const amount = safeInt(body.amount, MAX_BALANCE);
        if (!amount) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        await addVirtualBalance(businessId, amount);
        await insertTransaction({
          business_id: businessId, amount, credits_added: 0,
          payment_method: "manual", status: "paid",
          paid_at: new Date().toISOString(), transaction_type: "topup",
        });
        await logAudit(adminId, "add_balance", businessId, { amount });
        break;
      }

      case "set_billing": {
        const subPrice = parseInt(String(body.subscription_price)) || 0;
        if (subPrice < 0 || subPrice > MAX_BALANCE) return NextResponse.json({ error: "Invalid subscription price" }, { status: 400 });
        await sql`
          UPDATE businesses
          SET subscription_price = ${subPrice},
              billing_active = ${body.billing_active === true},
              next_billing_date = ${body.next_billing_date || null}
          WHERE id = ${businessId}
        `;
        await logAudit(adminId, "set_billing", businessId, {
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
          return NextResponse.json({ error: "Invalid external ID" }, { status: 400 });
        }
        await sql`
          INSERT INTO platform_accounts (business_id, platform, external_id, page_id, page_name, page_access_token)
          VALUES (
            ${businessId},
            ${body.platform},
            ${body.external_id.trim()},
            ${body.page_id?.trim() ?? null},
            ${body.page_name?.trim() ?? null},
            ${body.page_access_token ?? null}
          )
          ON CONFLICT (platform, external_id) DO UPDATE SET
            page_id = EXCLUDED.page_id,
            page_name = EXCLUDED.page_name,
            page_access_token = EXCLUDED.page_access_token
        `;
        await logAudit(adminId, "add_platform", businessId, {
          platform: body.platform, external_id: body.external_id.trim(),
        });
        break;
      }

      case "disconnect_platform": {
        const platform = body.platform as string;
        if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });
        if (platform === "all") {
          await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId}`;
          await sql`UPDATE businesses SET platforms = '{}' WHERE id = ${businessId}`;
        } else {
          if (!["instagram", "messenger"].includes(platform)) {
            return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
          }
          await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId} AND platform = ${platform}`;
          const remaining = await sql`SELECT platform FROM platform_accounts WHERE business_id = ${businessId}`;
          const remainingPlatforms = remaining.map((r) => r.platform as string);
          await sql`UPDATE businesses SET platforms = ${remainingPlatforms}::text[] WHERE id = ${businessId}`;
        }
        await logAudit(adminId, "disconnect_platform", businessId, { platform });
        break;
      }

      case "reset_history": {
        await sql`DELETE FROM conversation_threads WHERE business_id = ${businessId}`;
        await logAudit(adminId, "reset_history", businessId);
        break;
      }

      case "setup_business": {
        const { userId, businessName, platforms, monthlyTier, botPrompt } = body;
        if (!userId || !businessName?.trim()) {
          return NextResponse.json({ error: "userId and businessName required" }, { status: 400 });
        }

        const [newBiz] = await sql`
          INSERT INTO businesses (user_id, name, platforms, bot_prompt, contact_phone, contact_email, status, onboarding_done, onboarding_step)
          VALUES (${userId}, ${businessName.trim()}, ${platforms || []}::text[], ${botPrompt || ""}, '', '', 'active', true, 5)
          RETURNING id
        `;
        if (!newBiz) return NextResponse.json({ error: "Failed to create business" }, { status: 500 });

        const mp = MONTHLY_PLANS.find((p) => p.tier === (monthlyTier || "basic"));
        await sql`
          INSERT INTO plans (business_id, plan_type, monthly_tier, monthly_message_limit, monthly_price, billing_cycle_start)
          VALUES (
            ${newBiz.id as string},
            'monthly',
            ${monthlyTier || "basic"},
            ${mp?.contactLimit === Infinity ? -1 : mp?.contactLimit || null},
            ${mp?.price || null},
            ${new Date().toISOString().split("T")[0]}
          )
        `;

        await logAudit(adminId, "setup_business", newBiz.id as string, { userId, businessName: businessName.trim() });
        return NextResponse.json({ success: true, businessId: newBiz.id });
      }

      case "update": {
        await sql`
          UPDATE businesses
          SET name = ${body.name}, bot_prompt = ${body.bot_prompt},
              contact_phone = ${body.contact_phone}, contact_email = ${body.contact_email},
              status = ${body.status}
          WHERE id = ${businessId}
        `;

        const existingPlan = (await sql`SELECT id FROM plans WHERE business_id = ${businessId} LIMIT 1`)[0];
        const monthlyPlan = MONTHLY_PLANS.find((p) => p.tier === body.monthly_tier);
        const planValues = {
          business_id: businessId,
          plan_type: "monthly",
          monthly_tier: body.monthly_tier,
          monthly_message_limit: monthlyPlan?.contactLimit === Infinity ? -1 : monthlyPlan?.contactLimit || null,
          monthly_price: monthlyPlan?.price || null,
        };

        if (existingPlan) {
          await sql`
            UPDATE plans SET plan_type = ${planValues.plan_type}, monthly_tier = ${planValues.monthly_tier},
            monthly_message_limit = ${planValues.monthly_message_limit}, monthly_price = ${planValues.monthly_price}
            WHERE id = ${existingPlan.id as string}
          `;
        } else {
          await sql`
            INSERT INTO plans (business_id, plan_type, monthly_tier, monthly_message_limit, monthly_price, billing_cycle_start)
            VALUES (${businessId}, ${planValues.plan_type}, ${planValues.monthly_tier}, ${planValues.monthly_message_limit}, ${planValues.monthly_price}, ${new Date().toISOString().split("T")[0]})
          `;
        }

        await logAudit(adminId, "update", businessId, { name: body.name, status: body.status });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin action error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
