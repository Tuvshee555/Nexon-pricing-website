"use client";

import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";
import type { Business, Plan, MessageLog } from "@/types";
import { inferTransactionType } from "@/lib/transaction-utils";

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
  logs: MessageLog[];
  messagesThisMonth: number;
  recentTransactions: RecentTransaction[];
  showWelcome: boolean;
}

const TX_TYPE_LABEL: Record<string, string> = {
  topup: "Үлдэгдэл нэмэх",
  subscription: "Сарын захиалга",
  manual: "Гараар нэмсэн",
};

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="1.2" fill="white" />
      <defs>
        <linearGradient id="ig" x1="2" y1="22" x2="22" y2="2">
          <stop offset="0%" stopColor="#F9CE34" />
          <stop offset="30%" stopColor="#EE2A7B" />
          <stop offset="100%" stopColor="#6228D7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#0084FF" />
      <path d="M12 6C8.686 6 6 8.508 6 11.595c0 1.69.7 3.2 1.832 4.267V18l1.983-1.087C10.487 17.124 11.226 17.19 12 17.19c3.314 0 6-2.508 6-5.595S15.314 6 12 6zm.615 7.524l-1.538-1.638-2.998 1.638 3.307-3.517 1.57 1.638 2.968-1.638-3.309 3.517z" fill="white" />
    </svg>
  );
}

export default function ClientDashboard({
  business,
  plan,
  logs,
  messagesThisMonth,
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
    return Math.ceil((nextReset.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const messageLimit = plan?.monthly_message_limit;
  const progressPct = monthlyPlan && messageLimit && messageLimit > 0
    ? Math.min((messagesThisMonth / messageLimit) * 100, 100)
    : 0;

  const virtualBalance = business.virtual_balance || 0;
  const subscriptionPrice = business.subscription_price || 0;
  const nextBillingDate = business.next_billing_date
    ? new Date(business.next_billing_date).toLocaleDateString("mn-MN")
    : "—";
  const billingActive = business.billing_active;

  const statusColor: Record<string, string> = {
    active: "text-green-600 bg-green-50 border-green-200",
    paused: "text-amber-600 bg-amber-50 border-amber-200",
    cancelled: "text-red-600 bg-red-50 border-red-200",
  };
  const statusLabel: Record<string, string> = {
    active: "Идэвхтэй",
    paused: "Түр зогссон",
    cancelled: "Цуцлагдсан",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showWelcome && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Тавтай морил! Таны бүртгэл амжилттай үүслээ.
        </div>
      )}

      <div className={`rounded-xl p-4 text-sm flex items-center gap-3 border ${
        billingActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
      }`}>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <p className="font-semibold">
            {billingActive ? "Биллинг идэвхтэй байна" : "Биллинг идэвхгүй байна"}
          </p>
          <p className="mt-0.5">
            Дараагийн төлбөр: {nextBillingDate} · Үлдэгдэл: {virtualBalance.toLocaleString()}₮
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor[business.status] || ""}`}>
              {statusLabel[business.status] || business.status}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/bot"
          className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Bot тохиргоо
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Төлөвлөгөө",
            value: monthlyPlan ? (monthlyPlan.nameMn || monthlyPlan.nameEn) : "—",
            sub: subscriptionPrice > 0 ? `${subscriptionPrice.toLocaleString()}₮/сар` : "Custom",
            color: "text-gray-900",
          },
          {
            label: "Энэ сарын мессеж",
            value: messagesThisMonth.toLocaleString(),
            sub: messageLimit === -1 ? "Хязгааргүй" : messageLimit ? `${messageLimit.toLocaleString()}-с` : "—",
            color: "text-gray-900",
          },
          {
            label: "Үлдэгдэл",
            value: `${virtualBalance.toLocaleString()}₮`,
            sub: billingActive ? `Дараагийн төлбөр ${nextBillingDate}` : "Billing хаалттай",
            color: billingActive ? "text-gray-900" : "text-amber-600",
          },
          {
            label: "Дахин шинэчлэгдэх",
            value: daysUntilReset() != null ? `${daysUntilReset()} өдөр` : "—",
            sub: plan?.billing_cycle_start ? new Date(plan.billing_cycle_start).toLocaleDateString("mn-MN") : "—",
            color: "text-gray-900",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {plan?.plan_type === "monthly" && messageLimit && messageLimit > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Мессежийн хэрэглээ</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {monthlyPlan?.nameMn} · {daysUntilReset()} өдрийн дараа шинэчлэгдэнэ
              </p>
            </div>
            <span className="text-sm font-bold text-gray-700">
              {messagesThisMonth.toLocaleString()} / {messageLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressPct > 90 ? "bg-red-500" : progressPct > 70 ? "bg-amber-400" : "bg-primary"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{progressPct.toFixed(0)}% ашигласан</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recentTransactions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Сүүлийн төлбөрүүд</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      {TX_TYPE_LABEL[inferTransactionType(tx)] || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("mn-MN") : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    {tx.amount > 0 && <p className="text-sm font-semibold text-green-600">{tx.amount.toLocaleString()}₮</p>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tx.status === "paid" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
                    }`}>
                      {tx.status === "paid" ? "Төлсөн" : "Хүлээгдэж байна"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Мессежийн үйл ажиллагаа</h2>
          </div>
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Одоогоор үйл ажиллагаа байхгүй</p>
              <p className="text-gray-400 text-xs mt-1">Хэрэглэгч мессеж илгээхэд энд харагдана</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      log.platform === "instagram" ? "bg-pink-50" : "bg-blue-50"
                    }`}>
                      {log.platform === "instagram" ? <InstagramIcon /> : <MessengerIcon />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{log.message_count} мессеж</p>
                      <p className="text-xs text-gray-400">{new Date(log.logged_at).toLocaleDateString("mn-MN")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{log.total_tokens.toLocaleString()} token</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
