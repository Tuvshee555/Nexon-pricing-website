import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Fetch stats
  const { count: totalClients } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyTransactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("status", "paid")
    .gte("paid_at", startOfMonth.toISOString());

  const monthlyRevenue =
    monthlyTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

  const { data: totalMessagesData } = await supabase
    .from("message_logs")
    .select("message_count");

  const totalMessages =
    totalMessagesData?.reduce((sum, l) => sum + l.message_count, 0) || 0;

  const { data: totalCreditsData } = await supabase
    .from("transactions")
    .select("credits_added")
    .eq("status", "paid");

  const totalCreditsSold =
    totalCreditsData?.reduce((sum, t) => sum + t.credits_added, 0) || 0;

  const stats = [
    {
      label: "Нийт идэвхтэй клиент",
      value: totalClients || 0,
      icon: "👥",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Энэ сарын орлого",
      value: `${monthlyRevenue.toLocaleString()}₮`,
      icon: "💰",
      color: "text-success",
      bg: "bg-success/10 border-success/20",
    },
    {
      label: "Нийт мессеж",
      value: totalMessages.toLocaleString(),
      icon: "💬",
      color: "text-accent",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      label: "Нийт кредит зарагдсан",
      value: totalCreditsSold.toLocaleString(),
      icon: "⚡",
      color: "text-warning",
      bg: "bg-warning/10 border-warning/20",
    },
  ];

  // Recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, businesses(name)")
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Админ Самбар</h1>
        <p className="text-text-secondary text-sm mt-1">Платформын ерөнхий тойм</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`card p-6 border ${stat.bg}`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-text-secondary text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent payments */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text-primary">Сүүлийн төлбөрүүд</h2>
        </div>
        {!recentTransactions || recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            Одоогоор төлбөр байхгүй байна.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted font-medium px-6 py-3">Бизнес</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Дүн</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Кредит</th>
                  <th className="text-left text-muted font-medium px-6 py-3">Огноо</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx: {id: string; businesses?: {name: string}; amount: number; credits_added: number; paid_at: string | null}) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-2/50">
                    <td className="px-6 py-3 text-text-primary font-medium">
                      {tx.businesses?.name || "—"}
                    </td>
                    <td className="px-6 py-3 text-right text-success font-medium">
                      {tx.amount.toLocaleString()}₮
                    </td>
                    <td className="px-6 py-3 text-right text-accent">{tx.credits_added}</td>
                    <td className="px-6 py-3 text-text-secondary">
                      {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("mn-MN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
