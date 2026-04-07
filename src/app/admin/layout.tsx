import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={{ email: session.user.email, name: session.user.name }} role="admin" />
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}
