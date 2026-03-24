"use client";

import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";
import type { Business, Plan, Credits, MessageLog } from "@/types";

interface Props {
  business: Business;
  plan: Plan | null;
  credits: Credits | null;
  logs: MessageLog[];
  messagesThisMonth: number;
  creditsUsedThisMonth: number;
  showWelcome: boolean;
}

export default function ClientDashboard({
  business,
  plan,
  credits,
  logs,
  messagesThisMonth,
  creditsUsedThisMonth,
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

  const statusColor = {
    active: "text-success bg-success/10 border-success/30",
    paused: "text-warning bg-warning/10 border-warning/30",
    cancelled: "text-danger bg-danger/10 border-danger/30",
  };

  const statusLabel = {
    active: "Идэвхтэй",
    paused: "Түр зогссон",
    cancelled: "Цуцлагдсан",
  };

  const progressPct = monthlyPlan && plan?.monthly_message_limit
    ? Math.min((messagesThisMonth / plan.monthly_message_limit) * 100, 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {showWelcome && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl p-4 text-sm animate-fade-in">
          🎉 Тавтай морил! Таны бүртгэл амжилттай үүслээ.
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
              {business.platforms.includes("instagram") && (
                <span className="text-xs bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                  Instagram
                </span>
              )}
              {business.platforms.includes("messenger") && (
                <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                  Messenger
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      {plan?.plan_type === "credit" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-6">
            <p className="text-text-secondary text-sm mb-1">Үлдсэн кредит</p>
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

          <div className="sm:col-span-3">
            <Link
              href="/dashboard/buy-credits"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Кредит авах
            </Link>
          </div>
        </div>
      ) : plan?.plan_type === "monthly" ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-secondary text-sm">Одоогийн Төлөвлөгөө</p>
              <p className="text-xl font-bold text-text-primary mt-1">
                {monthlyPlan ? `${monthlyPlan.nameMn} — ${monthlyPlan.price.toLocaleString()}₮/сар` : "Custom"}
              </p>
            </div>
            <Link
              href="/dashboard/buy-credits"
              className="text-sm text-primary hover:text-primary/80 font-medium border border-primary/30 px-4 py-2 rounded-lg transition-colors"
            >
              Шинэчлэх
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Ашигласан мессеж</span>
              <span className="text-text-primary font-medium">
                {messagesThisMonth.toLocaleString()} /{" "}
                {plan.monthly_message_limit === -1
                  ? "∞"
                  : plan.monthly_message_limit?.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
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
      ) : (
        <div className="card p-6 text-center text-text-secondary">
          Төлөвлөгөө байхгүй байна. Админтай холбоо барина уу.
        </div>
      )}

      {/* Recent activity */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-text-primary">Сүүлийн үйл ажиллагаа</h2>
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
                  <th className="text-right text-muted font-medium px-6 py-3">Кредит</th>
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
