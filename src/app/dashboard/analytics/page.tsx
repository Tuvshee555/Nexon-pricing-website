"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyticsResponse = {
  totalContacts: number;
  messagesThisMonth: number;
  messagesAllTime: number;
  triggerFires: number;
  messagesPerDay: Array<{ date: string; count: number }>;
  platformBreakdown: Array<{ platform: string; count: number }>;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load analytics");
        if (!cancelled) setData(json as AnalyticsResponse);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const messengerCount = useMemo(() => {
    if (!data?.platformBreakdown) return 0;
    return data.platformBreakdown.find((row) => row.platform === "messenger")?.count ?? 0;
  }, [data]);

  const instagramCount = useMemo(() => {
    if (!data?.platformBreakdown) return 0;
    return data.platformBreakdown.find((row) => row.platform === "instagram")?.count ?? 0;
  }, [data]);

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="max-w-3xl">
          <p className="section-label">Analytics</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Message activity</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Contacts, message volume, and trigger usage from the last 30 days.
          </p>
        </div>

        {loading && (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            Loading analytics…
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 px-5 py-8 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <StatCard label="Total Contacts" value={data.totalContacts.toLocaleString()} />
              <StatCard label="Messages This Month" value={data.messagesThisMonth.toLocaleString()} />
              <StatCard label="All Time Messages" value={data.messagesAllTime.toLocaleString()} />
              <StatCard label="Trigger Fires" value={data.triggerFires.toLocaleString()} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="surface-panel rounded-[30px] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Messages per day</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">Last 30 days</h2>
                <MessagesBarChart series={data.messagesPerDay} />
              </div>

              <div className="surface-panel rounded-[30px] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Platform breakdown</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">Messenger vs Instagram</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  <PlatformPill platform="messenger" count={messengerCount} />
                  <PlatformPill platform="instagram" count={instagramCount} />
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">{value}</p>
    </div>
  );
}

function PlatformPill({ platform, count }: { platform: "messenger" | "instagram"; count: number }) {
  const classes =
    platform === "messenger"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-pink-200 bg-pink-50 text-pink-700";
  const label = platform === "messenger" ? "Messenger" : "Instagram";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${classes}`}>
      {label}
      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-black text-slate-900">
        {count.toLocaleString()}
      </span>
    </span>
  );
}

function MessagesBarChart({ series }: { series: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...series.map((d) => d.count));

  return (
    <div className="mt-5">
      <div className="relative h-44 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-3">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-slate-200"
              strokeWidth="0.6"
            />
          ))}
        </svg>

        <div className="absolute inset-3 flex items-end gap-1">
          {series.map((day) => (
            <div key={day.date} className="flex-1" title={`${day.date}: ${day.count}`}>
              <div
                className="w-full rounded-sm bg-primary/90 transition-colors hover:bg-primary"
                style={{ height: `${(day.count / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

