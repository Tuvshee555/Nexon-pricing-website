import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { MONTHLY_PLANS } from "@/types";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const {
      email, password, businessName, platforms, monthlyTier,
      botPrompt, contactPhone, contactEmail,
    } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (existing[0]) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await sql`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email.toLowerCase()}, ${passwordHash}, 'client')
      RETURNING id
    `;
    if (!newUser) return NextResponse.json({ error: "Failed to create user" }, { status: 400 });

    const newUserId = newUser.id as string;

    const [business] = await sql`
      INSERT INTO businesses (user_id, name, platforms, bot_prompt, contact_phone, contact_email, status, onboarding_done, onboarding_step)
      VALUES (${newUserId}, ${businessName}, ${platforms || []}::text[], ${botPrompt || ""}, ${contactPhone || ""}, ${contactEmail || ""}, 'active', true, 5)
      RETURNING id
    `;
    if (!business) return NextResponse.json({ error: "Failed to create business" }, { status: 500 });

    const businessId = business.id as string;
    const monthlyPlan = MONTHLY_PLANS.find((p) => p.tier === monthlyTier);

    await sql`
      INSERT INTO plans (business_id, plan_type, monthly_tier, monthly_message_limit, monthly_price, billing_cycle_start)
      VALUES (
        ${businessId},
        'monthly',
        ${monthlyTier},
        ${monthlyPlan?.contactLimit === Infinity ? -1 : monthlyPlan?.contactLimit || null},
        ${monthlyPlan?.price || null},
        ${new Date().toISOString().split("T")[0]}
      )
    `;

    return NextResponse.json({ businessId });
  } catch (err) {
    console.error("Create client error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
