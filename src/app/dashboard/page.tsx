import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientDashboard from "@/components/dashboard/ClientDashboard";

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
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center">
        {params.welcome && (
          <div className="bg-success/10 border border-success/30 text-success rounded-xl p-4 mb-8 text-sm">
            🎉 Тавтай морил! Таны бүртгэл амжилттай үүслээ.
          </div>
        )}
        <div className="card p-12">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Таны бизнес идэвхжиж байна
          </h2>
          <p className="text-text-secondary">
            Таны бизнесийг идэвхжүүлж байна, админтай холбоо барина уу.
          </p>
          <div className="mt-6 space-y-2">
            <a
              href="tel:+97686185769"
              className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm font-medium"
            >
              📞 +976 8618 5769
            </a>
            <a
              href="mailto:nexondigitalnova@gmail.com"
              className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm font-medium"
            >
              ✉️ nexondigitalnova@gmail.com
            </a>
          </div>
        </div>
      </div>
    );
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
