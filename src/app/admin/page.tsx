import { createAdminClient } from "@/lib/supabase/server";
import { inferTransactionType } from "@/lib/transactions";
import Link from "next/link";

const TX_TYPE_LABEL: Record<string, string> = {
  topup: "Үлдэгдэл нэмэх",
  message_pack: "Мессеж пакет",
  subscription: "Сарын захиалга",
  manual: "Гараар",
};

export default async function AdminOverviewPage() {
  const adminClient = await createAdminClient();

  const revenueWindowStart = new Date();
  revenueWindowStart.setDate(revenueWindowStart.getDate() - 30);
  revenueWindowStart.setHours(0, 0, 0, 0);

  const [
    { count: totalClients },
    { count: activeClients },
    { data: recentRevenueTransactions },
    { data: totalMessagesData },
    { count: activeSubscriptions },
    { data: recentTransactions },
    { data: recentClients },
    { data: allBillingClients },
  ] = await Promise.all([
    adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "client"),

    adminClient
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    adminClient
      .from("transactions")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", revenueWindowStart.toISOString()),

    adminClient.from("message_logs").select("message_count"),

    adminClient
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("billing_active", true),

    adminClient
      .from("transactions")
      .select("*, businesses(name)")
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(10),

    adminClient
      .from("businesses")
      .select("id, name, created_at, users(email)")
      .order("created_at", { ascending: false })
      .limit(5),

    adminClient
      .from("businesses")
      .select("id, name, virtual_balance, subscription_price")
      .eq("billing_active", true)
      .neq("status", "cancelled"),
  ]);

  const revenueLast30Days =
    recentRevenueTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
  const totalMessages =
    totalMessagesData?.reduce((sum, log) => sum + log.message_count, 0) || 0;

  const lowBalance = (allBillingClients || []).filter(
    (business) =>
      business.subscription_price > 0 &&
      (business.virtual_balance || 0) < business.subscription_price
  );

  const stats = [
    {
      label: "Нийт клиент",
      value: totalClients || 0,
      icon: "👥",
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Идэвхтэй бизнес",
      value: activeClients || 0,
      icon: "✅",
      color: "text-success",
      bg: "bg-success/10 border-success/20",
    },
    {
      label: "Сүүлийн 30 хоногийн орлого",
      value: `${revenueLast30Days.toLocaleString()}₮`,
      icon: "💰",
      color: "text-accent",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      label: "Нийт мессеж",
      value: totalMessages.toLocaleString(),
      icon: "💬",
      color: "text-warning",
      bg: "bg-warning/10 border-warning/20",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Админ Самбар</h1>
          <p className="text-text-secondary text-sm mt-1">Платформын ерөнхий тойм</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            Захиалга идэвхтэй: {activeSubscriptions || 0}
          </span>
          <form action="/api/admin/run-billing" method="POST">
            <button
              type="submit"
              className="text-xs border border-border text-text-secondary hover:border-primary/50 hover:text-primary px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Billing ажиллуулах
            </button>
          </form>
        </div>
      </div>

      {lowBalance.length > 0 && (
        <div className="card p-4 border-warning/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-warning font-semibold text-sm">⚠️ Үлдэгдэл бага клиентүүд</span>
            <span className="bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full font-semibold">
              {lowBalance.length}
            </span>
          </div>
          <div className="space-y-2">
            {lowBalance.map((business) => (
              <div
                key={business.id}
                className="flex items-center justify-between bg-warning/5 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="text-text-primary text-sm font-medium">{business.name}</span>
                  <span className="text-text-secondary text-xs ml-2">
                    {(business.virtual_balance || 0).toLocaleString()}₮ үлдсэн /{" "}
                    {business.subscription_price.toLocaleString()}₮ захиалга
                  </span>
                </div>
                <Link
                  href={`/admin/clients/${business.id}`}
                  className="text-xs text-warning border border-warning/30 px-2 py-1 rounded hover:bg-warning/10 transition-colors"
                >
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
            <Link href="/admin/clients" className="text-xs text-primary hover:text-primary/80">
              Бүгдийг харах →
            </Link>
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
                    <th className="text-left text-muted font-medium px-5 py-3">Бизнес</th>
                    <th className="text-left text-muted font-medium px-5 py-3">Төрөл</th>
                    <th className="text-right text-muted font-medium px-5 py-3">Дүн</th>
                    <th className="text-left text-muted font-medium px-5 py-3">Огноо</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(
                    (tx: {
                      id: string;
                      businesses?: { name: string };
                      amount: number;
                      credits_added: number;
                      transaction_type?: string;
                      payment_method: string;
                      paid_at: string | null;
                    }) => (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-2/50">
                        <td className="px-5 py-3 text-text-primary font-medium">
                          {tx.businesses?.name || "—"}
                        </td>
                        <td className="px-5 py-3 text-text-secondary text-xs">
                          {TX_TYPE_LABEL[inferTransactionType(tx)] || tx.payment_method}
                        </td>
                        <td className="px-5 py-3 text-right text-success font-medium">
                          {tx.amount > 0 ? `${tx.amount.toLocaleString()}₮` : "—"}
                        </td>
                        <td className="px-5 py-3 text-text-secondary text-xs">
                          {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("mn-MN") : "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-text-primary">Шинэ клиентүүд</h2>
          </div>
          {!recentClients || recentClients.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              Клиент байхгүй байна.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(recentClients as any[]).map((client) => (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {client.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {client.name || "Тохируулаагүй"}
                    </p>
                    <p className="text-muted text-xs truncate">
                      {(client.users as { email: string } | null)?.email || "—"}
                    </p>
                  </div>
                  <p className="text-muted text-xs ml-auto shrink-0">
                    {new Date(client.created_at).toLocaleDateString("mn-MN")}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-border">
            <Link
              href="/admin/clients"
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Бүгдийг харах →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
