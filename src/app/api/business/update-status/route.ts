import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { status } = body as { status?: string };

  // Clients can only toggle between active and paused (not cancel)
  if (!status || !["active", "paused"].includes(status)) {
    return NextResponse.json({ error: "Status must be 'active' or 'paused'" }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  const { data: business } = await adminClient
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await adminClient
    .from("businesses")
    .update({ status })
    .eq("id", business.id);

  return NextResponse.json({ success: true });
}
