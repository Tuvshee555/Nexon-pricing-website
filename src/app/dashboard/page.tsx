import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import { needsOnboarding } from "@/lib/onboarding";
import type { Business, Plan, MessageLog } from "@/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const params = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const businesses = await sql`SELECT * FROM businesses WHERE user_id = ${userId}`;
  const business = businesses[0] ?? null;

  if (!business) redirect("/dashboard/setup");

  const platformAccounts = await sql`
    SELECT page_id, external_id, page_access_token
    FROM platform_accounts WHERE business_id = ${business.id as string}
  `;

  if (needsOnboarding(business, platformAccounts)) {
    redirect("/dashboard/setup");
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [plans, logs, monthlyLogs, recentTransactions] = await Promise.all([
    sql`SELECT * FROM plans WHERE business_id = ${business.id as string} LIMIT 1`,
    sql`SELECT * FROM message_logs WHERE business_id = ${business.id as string} ORDER BY logged_at DESC LIMIT 10`,
    sql`SELECT message_count, credits_used FROM message_logs WHERE business_id = ${business.id as string} AND logged_at >= ${startOfMonth.toISOString()}`,
    sql`SELECT * FROM transactions WHERE business_id = ${business.id as string} AND status = 'paid' ORDER BY paid_at DESC LIMIT 5`,
  ]);

  const plan = plans[0] ?? null;
  const messagesThisMonth = monthlyLogs.reduce((sum, l) => sum + (l.message_count as number), 0);

  const trialEndsAt = (business.trial_ends_at as string | null) ?? null;

  return (
    <ClientDashboard
      business={business as unknown as Business}
      plan={plan as unknown as Plan | null}
      logs={logs as unknown as MessageLog[]}
      messagesThisMonth={messagesThisMonth}
      recentTransactions={recentTransactions as unknown as { id: string; amount: number; credits_added: number; transaction_type?: string; status: string; paid_at?: string }[]}
      showWelcome={!!params.welcome}
      trialEndsAt={trialEndsAt}
    />
  );
}
