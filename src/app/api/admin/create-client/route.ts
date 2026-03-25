import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MONTHLY_PLANS } from "@/types";

export async function POST(request: Request) {
  try {
    // Read body FIRST before cookies() is accessed
    const {
      email,
      password,
      businessName,
      platforms,
      planType,
      monthlyTier,
      initialCredits,
      botPrompt,
      contactPhone,
      contactEmail,
    } = await request.json();

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

    // Create auth user
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "client" },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // Ensure user record exists
    await adminClient.from("users").upsert({
      id: newUserId,
      email,
      role: "client",
    });

    // Create business
    const { data: business, error: bizError } = await adminClient
      .from("businesses")
      .insert({
        user_id: newUserId,
        name: businessName,
        platforms: platforms || [],
        bot_prompt: botPrompt || "",
        contact_phone: contactPhone || "",
        contact_email: contactEmail || "",
        status: "active",
      })
      .select()
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Failed to create business" },
        { status: 500 }
      );
    }

    // Create plan
    const monthlyPlan = MONTHLY_PLANS.find((p) => p.tier === monthlyTier);
    await adminClient.from("plans").insert({
      business_id: business.id,
      plan_type: planType,
      monthly_tier: planType === "monthly" ? monthlyTier : null,
      monthly_message_limit:
        planType === "monthly"
          ? monthlyPlan?.messageLimit === Infinity
            ? -1
            : monthlyPlan?.messageLimit || null
          : null,
      monthly_price: planType === "monthly" ? monthlyPlan?.price || null : null,
      billing_cycle_start: new Date().toISOString().split("T")[0],
    });

    // Create credits
    const credits = parseInt(initialCredits) || 0;
    await adminClient.from("credits").insert({
      business_id: business.id,
      balance: credits,
      total_purchased: credits,
    });

    if (credits > 0) {
      await adminClient.from("transactions").insert({
        business_id: business.id,
        amount: 0,
        credits_added: credits,
        payment_method: "manual",
        status: "paid",
        paid_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ businessId: business.id });
  } catch (err) {
    console.error("Create client error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
