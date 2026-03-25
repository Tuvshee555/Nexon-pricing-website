import { redirect } from "next/navigation";
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

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={user} role={userData?.role || "client"} />
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}
