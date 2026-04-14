"use client";

import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";
import type { Business, MessageLog, Plan } from "@/types";
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
  topup: "Balance top-up",
  subscription: "Monthly subscription",
  manual: "Manual adjustment",
};

export default function ClientDashboard({
  business,
  plan,
  logs,
  messagesThisMonth,
  recentTransactions,
  showWelcome,
}: Props) {
  const monthlyPlan =
    plan?.plan_type === "monthly"
      ? MONTHLY_PLANS.find((item) => item.tier === plan.monthly_tier)
      : null;

  const daysUntilReset = () => {
    if (!plan?.billing_cycle_start) return null;
    const start = new Date(plan.billing_cycle_start);
    const nextReset = new Date(start);
    nextReset.setMonth(nextReset.getMonth() + 1);
    return Math.ceil((nextReset.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const virtualBalance = business.virtual_balance || 0;
  const subscriptionPrice = business.subscription_price || 0;
  const nextBillingDate = business.next_billing_date
    ? new Date(business.next_billing_date).toLocaleDateString("mn-MN")
    : "—";

  const quickActions = [
    {
      title: "Review inbox",
      description: "Stay close to escalated or high-value conversations.",
      href: "/dashboard/inbox",
    },
    {
      title: "Tune the bot",
      description: "Refine prompt behavior and answers for repeat questions.",
      href: "/dashboard/bot",
    },
    {
      title: "Finish setup",
      description: "Reconnect channels or tighten your current automation flow.",
      href: "/dashboard/setup",
    },
    {
      title: "Browse templates",
      description: "Start from proven flows for FAQs, lead capture, or handoff.",
      href: "/dashboard/templates",
    },
    {
      title: "Manage team",
      description: "See roles, notes, and collaboration workflow in one place.",
      href: "/dashboard/team",
    },
  ];

  const starterTemplates = [
    {
      title: "FAQ responder",
      description: "Great for price, delivery, and availability questions.",
    },
    {
      title: "Lead qualifier",
      description: "Capture intent before a human follows up.",
    },
    {
      title: "Welcome flow",
      description: "Set expectations and guide new chats automatically.",
    },
    {
      title: "Lead capture",
      description: "Qualify interest before human follow-up.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {business.onboarding_done === false && (
        <div className="flex flex-col gap-3 rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>Setup is not complete — your bot is not active yet.</p>
          <Link
            href="/dashboard/setup"
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Complete Setup
          </Link>
        </div>
      )}
      {showWelcome && (
        <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          Welcome aboard. Your workspace is ready and the first dashboard view is live.
        </div>
      )}

      <div className="surface-card rounded-[32px] p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Workspace health</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950">
              {business.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Your dashboard now emphasizes channel visibility, automation readiness, and the moments that need a real person.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard/bot" className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Bot settings
            </Link>
            <Link href="/dashboard/inbox" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
              Open inbox
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Current plan",
              value: monthlyPlan ? monthlyPlan.nameEn : "Custom",
              sub: subscriptionPrice > 0 ? `${subscriptionPrice.toLocaleString()}₮ / mo` : "Custom billing",
            },
            {
              label: "Messages this month",
              value: messagesThisMonth.toLocaleString(),
              sub: "Activity this billing cycle",
            },
            {
              label: "Virtual balance",
              value: `${virtualBalance.toLocaleString()}₮`,
              sub: `Next billing ${nextBillingDate}`,
            },
            {
              label: "Reset window",
              value: daysUntilReset() != null ? `${daysUntilReset()} days` : "—",
              sub: plan?.billing_cycle_start ? new Date(plan.billing_cycle_start).toLocaleDateString("mn-MN") : "No billing cycle",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[26px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>


      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-5">
          <div className="surface-card rounded-[30px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Next actions</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">What to tighten this week</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href} className="rounded-[26px] border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50">
                  <h4 className="text-lg font-black text-slate-900">{action.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{action.description}</p>
                  <span className="mt-5 inline-flex text-sm font-semibold text-primary">Open</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface-card rounded-[30px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Message activity</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Recent channel activity</h3>

            {logs.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                No activity yet. Once customers start messaging, usage and channel events will appear here.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {logs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {log.platform === "instagram" ? "Instagram" : "Messenger"} • {log.message_count} messages
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(log.logged_at).toLocaleDateString("mn-MN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{log.total_tokens.toLocaleString()} tokens</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Processed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-panel rounded-[30px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Starter templates</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Launch faster with a preset flow</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {starterTemplates.map((template, index) => (
                <div key={template.title} className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-primary">
                    0{index + 1}
                  </div>
                  <h4 className="text-lg font-black text-slate-900">{template.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="surface-card rounded-[30px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Billing snapshot</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Recent payments</h3>

            {recentTransactions.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                No paid transactions yet.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {TX_TYPE_LABEL[inferTransactionType(tx)] || "Payment"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("mn-MN") : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          {tx.amount > 0 ? `${tx.amount.toLocaleString()}₮` : "—"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{tx.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-panel rounded-[30px] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace status</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Current operating notes</h3>

            <div className="mt-5 space-y-3">
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Billing date</p>
                <p className="mt-2 text-sm text-slate-600">{nextBillingDate}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Business status</p>
                <p className="mt-2 text-sm capitalize text-slate-600">{business.status}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Plan type</p>
                <p className="mt-2 text-sm text-slate-600">{plan?.plan_type || "Custom"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Collaboration</p>
                <p className="mt-2 text-sm text-slate-600">Make ownership, notes, and handoff rules visible to the team.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
