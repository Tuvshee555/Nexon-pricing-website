import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { needsOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role || "client";

  if (role === "admin") redirect("/admin");

  // Check onboarding status
  const businesses = await sql`
    SELECT id, onboarding_done, status, platforms, bot_prompt
    FROM businesses WHERE user_id = ${userId}
  `;
  const business = businesses[0] ?? null;

  const platformAccounts = business
    ? await sql`
        SELECT page_id, external_id, page_access_token
        FROM platform_accounts WHERE business_id = ${business.id as string}
      `
    : [];

  // Get current path to avoid redirect loop on /dashboard/setup
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isSetupPath = pathname.includes("/dashboard/setup");

  if (!isSetupPath && needsOnboarding(business, platformAccounts)) {
    redirect("/dashboard/setup");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar user={{ email: session.user.email, name: session.user.name }} role={role} />
      <main className="flex-1 lg:ml-60 p-6 pt-6">{children}</main>
    </div>
  );
}
