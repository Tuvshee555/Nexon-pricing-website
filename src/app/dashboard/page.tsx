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
            Тавтай морил! Таны бүртгэл амжилттай үүслээ.
          </div>
        )}
        <div className="card p-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            Бизнес тохируулагдаагүй байна
          </h2>
          <p className="text-text-secondary mb-2">
            Таны бизнесийг идэвхжүүлж байна. Админтай холбоо барьж, тохиргоог дуусгана уу.
          </p>
          <p className="text-text-secondary text-sm mb-6">
            Доорх аргуудаар админтай шууд холбогдож болно:
          </p>

          <div className="space-y-3">
            <a
              href="tel:+97686185769"
              className="flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +976 8618 5769
            </a>
            <a
              href="mailto:nexondigitalnova@gmail.com"
              className="flex items-center justify-center gap-3 border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              nexondigitalnova@gmail.com
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
