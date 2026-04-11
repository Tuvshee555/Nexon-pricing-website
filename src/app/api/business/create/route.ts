import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { needsOnboarding } from "@/lib/onboarding";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { businessName, businessType } = body as { businessName?: string; businessType?: string };

  if (!businessName || typeof businessName !== "string" || businessName.trim().length < 1) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const existing = (await sql`
    SELECT id, onboarding_done, status, platforms, bot_prompt
    FROM businesses WHERE user_id = ${userId} LIMIT 1
  `)[0] ?? null;

  const platformAccounts = existing
    ? await sql`SELECT page_id, external_id, page_access_token FROM platform_accounts WHERE business_id = ${existing.id as string}`
    : [];

  if (existing && !needsOnboarding(existing, platformAccounts)) {
    return NextResponse.json({ error: "Business already exists" }, { status: 409 });
  }

  if (existing) {
    await sql`
      UPDATE businesses
      SET name = ${businessName.trim()}, business_type = ${businessType || "other"},
          onboarding_step = 1, onboarding_done = false, status = 'paused'
      WHERE id = ${existing.id as string}
    `;
    return NextResponse.json({ businessId: existing.id });
  }

  const [newBiz] = await sql`
    INSERT INTO businesses (
      user_id, name, business_type, platforms, bot_prompt,
      contact_phone, contact_email, status, onboarding_step, onboarding_done
    ) VALUES (
      ${userId}, ${businessName.trim()}, ${businessType || "other"}, '{}', '',
      '', '', 'paused', 1, false
    ) RETURNING id
  `;

  if (!newBiz) {
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }

  const businessId = newBiz.id as string;

  await Promise.all([
    sql`INSERT INTO plans (business_id, plan_type, monthly_tier, monthly_message_limit, monthly_price, billing_cycle_start) VALUES (${businessId}, 'monthly', 'basic', 600, 79000, ${new Date().toISOString().split("T")[0]})`,
  ]);

  return NextResponse.json({ businessId });
}
