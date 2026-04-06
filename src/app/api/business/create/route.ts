import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { businessName, businessType } = body as {
    businessName?: string;
    businessType?: string;
  };

  if (!businessName || typeof businessName !== "string" || businessName.trim().length < 1) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  // Check if user already has a business
  const { data: existing } = await adminClient
    .from("businesses")
    .select("id, onboarding_done")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.onboarding_done) {
    return NextResponse.json({ error: "Business already exists" }, { status: 409 });
  }

  // If a business exists but onboarding isn't done, return its id so wizard can resume
  if (existing) {
    await adminClient
      .from("businesses")
      .update({ name: businessName.trim(), business_type: businessType || "other", onboarding_step: 1 })
      .eq("id", existing.id);
    return NextResponse.json({ businessId: existing.id });
  }

  // Create the business
  const { data: newBiz, error: bizErr } = await adminClient
    .from("businesses")
    .insert({
      user_id: user.id,
      name: businessName.trim(),
      business_type: businessType || "other",
      platforms: [],
      bot_prompt: "",
      contact_phone: "",
      contact_email: "",
      status: "paused", // Active once onboarding is done and plan is paid
      onboarding_step: 1,
      onboarding_done: false,
    })
    .select()
    .single();

  if (bizErr || !newBiz) {
    return NextResponse.json({ error: bizErr?.message || "Failed to create business" }, { status: 500 });
  }

  // Create initial credits row (0 balance)
  await adminClient.from("credits").insert({
    business_id: newBiz.id,
    balance: 0,
    total_purchased: 0,
  });

  // Create initial plan row (credit-based by default)
  await adminClient.from("plans").insert({
    business_id: newBiz.id,
    plan_type: "credit",
    billing_cycle_start: new Date().toISOString().split("T")[0],
  });

  return NextResponse.json({ businessId: newBiz.id });
}
