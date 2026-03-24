import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

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

  const { data: userData } = await supabase
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
