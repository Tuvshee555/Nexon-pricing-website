"use client";

import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";
import type { Business, Plan, Credits, MessageLog } from "@/types";
import { inferTransactionType } from "@/lib/transactions";

interface RecentTransaction {
  id: string;
  amount: number;
  credits_added: number;
  transaction_type?: string;
  status: string;
  paid_at?: string;
}

interface Props {
  business: Business;
  plan: Plan | null;
  credits: Credits | null;
  logs: MessageLog[];
  messagesThisMonth: number;
  creditsUsedThisMonth: number;
  recentTransactions: RecentTransaction[];
  showWelcome: boolean;
}

const TX_TYPE_LABEL: Record<string, string> = {
  topup: "Үлдэгдэл нэмэх",
  message_pack: "Мессеж пакет",
  subscription: "Сарын хасалт",
  manual: "Гараар нэмсэн",
};

export default function ClientDashboard({
  business,
  plan,
  credits,
  logs,
  messagesThisMonth,
  creditsUsedThisMonth,
  recentTransactions,
  showWelcome,
}: Props) {
  const monthlyPlan = plan?.plan_type === "monthly"
    ? MONTHLY_PLANS.find((p) => p.tier === plan.monthly_tier)
    : null;

  const daysUntilReset = () => {
    if (!plan?.billing_cycle_start) return null;
    const start = new Date(plan.billing_cycle_start);
    const nextReset = new Date(start);
    nextReset.setMonth(nextReset.getMonth() + 1);
    const now = new Date();
    const diff = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const nextBillingDisplay = () => {
    if (!business.next_billing_date) return null;
    return new Date(business.next_billing_date).toLocaleDateString("mn-MN");
  };

  const statusColor: Record<string, string> = {
    active: "text-success bg-success/10 border-success/30",
    paused: "text-warning bg-warning/10 border-warning/30",
    cancelled: "text-danger bg-danger/10 border-danger/30",
  };

  const statusLabel: Record<string, string> = {
    active: "Идэвхтэй",
    paused: "Түр зогссон",
    cancelled: "Цуцлагдсан",
  };

  const messageLimit = plan?.monthly_message_limit;
  const progressPct = monthlyPlan && messageLimit && messageLimit > 0
    ? Math.min((messagesThisMonth / messageLimit) * 100, 100)
    : 0;

  const virtualBalance = business.virtual_balance || 0;
  const subscriptionPrice = business.subscription_price || 0;
  const isLowBalance = subscriptionPrice > 0 && virtualBalance < subscriptionPrice;
  const monthsRemaining = subscriptionPrice > 0
    ? Math.floor(virtualBalance / subscriptionPrice)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showWelcome && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl p-4 text-sm animate-fade-in">
          🎉 Тавтай морил! Таны бүртгэл амжилттай үүслээ.
        </div>
      )}

      {/* Low balance warning */}
      {isLowBalance && (
        <div className="bg-warning/10 border border-warning/30 text-warning rounded-xl p-4 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-semibold">Үлдэгдэл бага байна</p>
            <p className="text-warning/80 mt-0.5">
              Таны үлдэгдэл {virtualBalance.toLocaleString()}₮ байна. Сарын захиалга ({subscriptionPrice.toLocaleString()}₮) хасагдах тул нэмэх шаардлагатай.
            </p>
          </div>
          <Link href="/dashboard/buy-credits" className="ml-auto shrink-0 bg-warning/20 hover:bg-warning/30 text-warning font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors">
            Нэмэх
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{business.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor[business.status]}`}>
              {statusLabel[business.status]}
            </span>
            <div className="flex gap-1">
              {business.platforms?.includes("instagram") && (
                <span className="text-xs bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                  Instagram
                </span>
              )}
              {business.platforms?.includes("messenger") && (
                <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                  Messenger
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`card p-5 ${isLowBalance ? "border-warning/40" : ""}`}>
          <p className="text-text-secondary text-xs mb-1">Үлдэгдэл (₮)</p>
          <p className={`text-2xl font-black ${isLowBalance ? "text-warning" : "text-gradient"}`}>
            {virtualBalance.toLocaleString()}₮
          </p>
          {subscriptionPrice > 0 && (
            <p className="text-xs text-muted mt-1">~{monthsRemaining} сар үлдсэн</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-text-secondary text-xs mb-1">Үлдсэн мессеж</p>
          <p className="text-2xl font-black text-accent">{credits?.balance || 0}</p>
          <p className="text-xs text-muted mt-1">Энэ сард: {creditsUsedThisMonth} зарцуулсан</p>
        </div>
        <div className="card p-5">
          <p className="text-text-secondary text-xs mb-1">Төлөвлөгөө</p>
          <p className="text-lg font-bold text-text-primary">
            {plan?.plan_type === "monthly"
              ? monthlyPlan?.nameMn || "Сарын"
              : plan?.plan_type === "credit"
              ? "Мессеж пакет"
              : "—"}
          </p>
          {subscriptionPrice > 0 && (
            <p className="text-xs text-muted mt-1">{subscriptionPrice.toLocaleString()}₮/сар</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-text-secondary text-xs mb-1">Дараагийн төлбөр</p>
          <p className="text-lg font-bold text-text-primary">
            {nextBillingDisplay() || "—"}
          </p>
          {daysUntilReset() !== null && (
            <p className="text-xs text-muted mt-1">{daysUntilReset()} өдрийн дараа</p>
          )}
        </div>
      </div>

      {/* Credit / Message pack plan */}
      {plan?.plan_type === "credit" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6">
              <p className="text-text-secondary text-sm mb-1">Үлдсэн мессеж</p>
              <p className="text-4xl font-black text-gradient">{credits?.balance || 0}</p>
            </div>
            <div className="card p-6">
              <p className="text-text-secondary text-sm mb-1">Нийт худалдан авсан</p>
              <p className="text-4xl font-black text-text-primary">{credits?.total_purchased || 0}</p>
            </div>
            <div className="card p-6">
              <p className="text-text-secondary text-sm mb-1">Энэ сард зарцуулсан</p>
              <p className="text-4xl font-black text-text-primary">{creditsUsedThisMonth}</p>
            </div>
          </div>

          <Link
            href="/dashboard/buy-credits"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Мессеж авах
          </Link>
        </div>
      ) : plan?.plan_type === "monthly" ? (
        <div className="space-y-4">
          {/* Virtual balance + subscription */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`card p-6 ${isLowBalance ? "border-warning/40" : ""}`}>
              <p className="text-text-secondary text-sm mb-1">Үлдэгдэл</p>
              <p className={`text-3xl font-black ${isLowBalance ? "text-warning" : "text-gradient"}`}>
                {virtualBalance.toLocaleString()}₮
              </p>
              {subscriptionPrice > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>~{monthsRemaining} сар үлдсэн</span>
                  </div>
                  <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLowBalance ? "bg-warning" : "bg-gradient-to-r from-primary to-accent"
                      }`}
                      style={{ width: `${Math.min(monthsRemaining * 20, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="card p-6">
              <p className="text-text-secondary text-sm mb-1">Сарын захиалга</p>
              <p className="text-3xl font-black text-text-primary">{subscriptionPrice.toLocaleString()}₮</p>
              <p className="text-xs text-muted mt-2">сар бүр автомат хасагдана</p>
            </div>
            <div className="card p-6 flex flex-col justify-between">
              <p className="text-text-secondary text-sm mb-3">Цэнэглэх</p>
              <Link
                href="/dashboard/buy-credits"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Цэнэглэх
              </Link>
            </div>
          </div>

          {/* Message usage progress */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-sm">Одоогийн Төлөвлөгөө</p>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {monthlyPlan ? `${monthlyPlan.nameMn} — ${monthlyPlan.price.toLocaleString()}₮/сар` : "Custom"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Ашигласан мессеж</span>
                <span className="text-text-primary font-medium">
                  {messagesThisMonth.toLocaleString()} /{" "}
                  {messageLimit === -1 ? "∞" : messageLimit?.toLocaleString() || "—"}
                </span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPct > 90 ? "bg-danger" : progressPct > 70 ? "bg-warning" : "bg-gradient-to-r from-primary to-accent"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{progressPct.toFixed(0)}% ашигласан</span>
                {daysUntilReset() !== null && (
                  <span>{daysUntilReset()} өдрийн дараа шинэчлэгдэнэ</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center text-text-secondary">
          Төлөвлөгөө байхгүй байна. Админтай холбоо барина уу.
        </div>
      )}

      {/* Recent payments */}
      {recentTransactions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-text-primary">Сүүлийн төлбөрүүд</h2>
            <Link
              href="/dashboard/buy-credits"
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Нэмэх →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted font-medium px-6 py-3">Огноо</th>
                  <th className="text-left text-muted font-medium px-6 py-3">Төрөл</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Дүн</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Мессеж</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-3 text-text-secondary">
                      {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("mn-MN") : "—"}
                    </td>
                    <td className="px-6 py-3 text-text-secondary text-xs">
                      {TX_TYPE_LABEL[inferTransactionType(tx)] || "—"}
                    </td>
                    <td className="px-6 py-3 text-right text-success font-medium">
                      {tx.amount > 0 ? `${tx.amount.toLocaleString()}₮` : "—"}
                    </td>
                    <td className="px-6 py-3 text-right text-accent font-medium">
                      {tx.credits_added > 0 ? `+${tx.credits_added}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent message activity */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-text-primary">Мессежийн түүх</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            Одоогоор үйл ажиллагаа байхгүй байна.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted font-medium px-6 py-3">Огноо</th>
                  <th className="text-left text-muted font-medium px-6 py-3">Платформ</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Мессеж</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Токен</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Зарцуулсан</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-3 text-text-secondary">
                      {new Date(log.logged_at).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        log.platform === "instagram"
                          ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                          : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                      }`}>
                        {log.platform === "instagram" ? "Instagram" : "Messenger"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-text-primary">{log.message_count}</td>
                    <td className="px-6 py-3 text-right text-text-secondary">{log.total_tokens.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-accent font-medium">{log.credits_used}</td>
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
