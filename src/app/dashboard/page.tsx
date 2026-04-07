import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import { needsOnboarding } from "@/lib/onboarding";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const params = await searchParams;

  // Auth is already checked by the layout — just get the user id
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use admin client for all data fetching to bypass RLS
  const adminClient = await createAdminClient();

  // Fetch business
  const { data: business } = await adminClient
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    redirect("/dashboard/setup");
  }

  const { data: platformAccounts } = await adminClient
    .from("platform_accounts")
    .select("page_id, external_id, page_access_token")
    .eq("business_id", business.id);

  if (needsOnboarding(business, platformAccounts || [])) {
    redirect("/dashboard/setup");
  }

  // Fetch plan, credits, logs in parallel
  const [
    { data: plan },
    { data: credits },
    { data: logs },
    { data: monthlyLogs },
    { data: recentTransactions },
  ] = await Promise.all([
    adminClient
      .from("plans")
      .select("*")
      .eq("business_id", business.id)
      .single(),

    adminClient
      .from("credits")
      .select("*")
      .eq("business_id", business.id)
      .single(),

    adminClient
      .from("message_logs")
      .select("*")
      .eq("business_id", business.id)
      .order("logged_at", { ascending: false })
      .limit(10),

    (() => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return adminClient
        .from("message_logs")
        .select("message_count, credits_used")
        .eq("business_id", business.id)
        .gte("logged_at", startOfMonth.toISOString());
    })(),

    adminClient
      .from("transactions")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(5),
  ]);

  const messagesThisMonth =
    monthlyLogs?.reduce((sum, l) => sum + l.message_count, 0) || 0;
  const creditsUsedThisMonth =
    monthlyLogs?.reduce((sum, l) => sum + l.credits_used, 0) || 0;

  return (
    <ClientDashboard
      business={business}
      plan={plan}
      credits={credits}
      logs={logs || []}
      messagesThisMonth={messagesThisMonth}
      creditsUsedThisMonth={creditsUsedThisMonth}
      recentTransactions={recentTransactions || []}
      showWelcome={!!params.welcome}
    />
  );
}
