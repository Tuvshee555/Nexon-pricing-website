import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { needsOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client for DB queries to bypass RLS issues
  const adminClient = await createAdminClient();
  const { data: userData } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role === "admin") redirect("/admin");

  // Check onboarding status
  const { data: business } = await adminClient
    .from("businesses")
    .select("id, onboarding_done, status, platforms, bot_prompt")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: platformAccounts } = business
    ? await adminClient
        .from("platform_accounts")
        .select("page_id, external_id, page_access_token")
        .eq("business_id", business.id)
    : { data: [] };

  // Get current path to avoid redirect loop on /dashboard/setup
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isSetupPath = pathname.includes("/dashboard/setup");

  // Redirect to onboarding if no business or onboarding not complete
  if (!isSetupPath && needsOnboarding(business, platformAccounts || [])) {
    redirect("/dashboard/setup");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={user} role={userData?.role || "client"} />
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}
