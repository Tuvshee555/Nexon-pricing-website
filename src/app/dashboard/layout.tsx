import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

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
    .select("id, onboarding_done")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get current path to avoid redirect loop on /dashboard/setup
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isSetupPath = pathname.includes("/dashboard/setup");

  // Redirect to onboarding if business not set up or onboarding not done
  if (!isSetupPath && (!business || !business.onboarding_done)) {
    redirect("/dashboard/setup");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={user} role={userData?.role || "client"} />
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}
