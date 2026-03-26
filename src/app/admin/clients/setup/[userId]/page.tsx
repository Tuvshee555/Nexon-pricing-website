import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SetupBusinessForm from "./SetupBusinessForm";

export default async function SetupBusinessPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const adminClient = await createAdminClient();

  // Check if this user already has a business
  const { data: existing } = await adminClient
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  // If business exists, redirect to its detail page
  if (existing) {
    redirect(`/admin/clients/${existing.id}`);
  }

  // Get user email for display
  const { data: userData } = await adminClient
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  return <SetupBusinessForm userId={userId} email={userData?.email || ""} />;
}
