import { sql } from "@/lib/db";
import Link from "next/link";
import AdminRecentTransactions from "@/components/admin/AdminRecentTransactions";

export default async function AdminOverviewPage() {
  const revenueWindowStart = new Date();
  revenueWindowStart.setDate(revenueWindowStart.getDate() - 30);
  revenueWindowStart.setHours(0, 0, 0, 0);

  const [
    totalClientsRows,
    activeClientsRows,
    recentRevenueRows,
    totalMessagesRows,
    activeSubscriptionsRows,
    recentTransactions,
    recentClients,
    allBillingClients,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM users WHERE role = 'client'`,
    sql`SELECT COUNT(*) as count FROM businesses WHERE status = 'active'`,
    sql`SELECT amount FROM transactions WHERE status = 'paid' AND paid_at >= ${revenueWindowStart.toISOString()}`,
    sql`SELECT message_count FROM message_logs`,
    sql`SELECT COUNT(*) as count FROM businesses WHERE billing_active = true`,
    sql`
      SELECT t.*, b.name as business_name
      FROM transactions t
      LEFT JOIN businesses b ON t.business_id = b.id
      WHERE t.status = 'paid'
      ORDER BY t.paid_at DESC LIMIT 50
    `,
    sql`
      SELECT b.id, b.name, b.created_at, u.email
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC LIMIT 20
    `,
    sql`
      SELECT id, name, virtual_balance, subscription_price
      FROM businesses WHERE billing_active = true AND status != 'cancelled'
    `,
  ]);

  const totalClients = Number(totalClientsRows[0]?.count ?? 0);
  const activeClients = Number(activeClientsRows[0]?.count ?? 0);
  const activeSubscriptions = Number(activeSubscriptionsRows[0]?.count ?? 0);
  const revenueLast30Days = recentRevenueRows.reduce((sum, tx) => sum + (tx.amount as number), 0);
  const totalMessages = totalMessagesRows.reduce((sum, log) => sum + (log.message_count as number), 0);

  const lowBalance = allBillingClients.filter(
    (b) =>
      (b.subscription_price as number) > 0 &&
      ((b.virtual_balance as number) || 0) < (b.subscription_price as number)
  );

  const stats = [
    { label: "Нийт клиент", value: totalClients, icon: "👥", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { label: "Идэвхтэй бизнес", value: activeClients, icon: "✅", color: "text-success", bg: "bg-success/10 border-success/20" },
    { label: "Сүүлийн 30 хоногийн орлого", value: `${revenueLast30Days.toLocaleString()}₮`, icon: "💰", color: "text-accent", bg: "bg-accent/10 border-accent/20" },
    { label: "Нийт мессеж", value: totalMessages.toLocaleString(), icon: "💬", color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Админ Самбар</h1>
          <p className="text-text-secondary text-sm mt-1">Платформын ерөнхий тойм</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Захиалга идэвхтэй: {activeSubscriptions}</span>
          <form action="/api/admin/run-billing" method="POST">
            <button type="submit" className="text-xs border border-border text-text-secondary hover:border-primary/50 hover:text-primary px-4 py-2 rounded-lg transition-colors">
              🔄 Billing ажиллуулах
            </button>
          </form>
        </div>
      </div>

      {lowBalance.length > 0 && (
        <div className="card p-4 border-warning/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-warning font-semibold text-sm">⚠️ Үлдэгдэл бага клиентүүд</span>
            <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full font-semibold">{lowBalance.length}</span>
          </div>
          <div className="space-y-2">
            {lowBalance.map((business) => (
              <div key={business.id as string} className="flex items-center justify-between bg-warning/5 rounded-lg px-3 py-2">
                <div>
                  <span className="text-text-primary text-sm font-medium">{business.name as string}</span>
                  <span className="text-text-secondary text-xs ml-2">
                    {((business.virtual_balance as number) || 0).toLocaleString()}₮ үлдсэн / {(business.subscription_price as number).toLocaleString()}₮ захиалга
                  </span>
                </div>
                <Link href={`/admin/clients/${business.id as string}`} className="text-xs text-warning border border-warning/30 px-2 py-1 rounded hover:bg-warning/10 transition-colors">
                  Харах
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`card p-6 border ${stat.bg}`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-text-secondary text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-text-primary">Сүүлийн төлбөрүүд</h2>
            <Link href="/admin/clients" className="text-xs text-primary hover:text-primary/80">Бүгдийг харах →</Link>
          </div>
          <AdminRecentTransactions transactions={recentTransactions.map((tx) => ({
            id: tx.id as string,
            businesses: tx.business_name ? { name: tx.business_name as string } : undefined,
            amount: tx.amount as number,
            credits_added: tx.credits_added as number,
            transaction_type: tx.transaction_type as string | undefined,
            payment_method: tx.payment_method as string,
            paid_at: tx.paid_at as string | null,
          }))} />
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-text-primary">Шинэ клиентүүд</h2>
          </div>
          {recentClients.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">Клиент байхгүй байна.</div>
          ) : (
            <div className="divide-y divide-border">
              {recentClients.map((client) => (
                <Link key={client.id as string} href={`/admin/clients/${client.id as string}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(client.name as string)?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{(client.name as string) || "Тохируулаагүй"}</p>
                    <p className="text-muted text-xs truncate">{(client.email as string) || "—"}</p>
                  </div>
                  <p className="text-muted text-xs ml-auto shrink-0">
                    {new Date(client.created_at as string).toLocaleDateString("mn-MN")}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-border">
            <Link href="/admin/clients" className="text-xs text-primary hover:text-primary/80 font-medium">Бүгдийг харах →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
