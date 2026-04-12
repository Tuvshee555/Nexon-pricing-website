import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import AnalyticsCharts from "@/components/dashboard/analytics/AnalyticsCharts";

export const dynamic = "force-dynamic";

type RangeKey = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const RANGE_META: Record<RangeKey, { label: string; hint: string }> = {
  "7d": { label: "Last 7 days", hint: "Short-term trend" },
  "30d": { label: "Last 30 days", hint: "Balanced snapshot" },
  "90d": { label: "Last 90 days", hint: "Longer pattern" },
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateSeries(start: Date, end: Date, rows: Array<{ date: string; value: number }>) {
  const map = new Map(rows.map((row) => [row.date, Number(row.value) || 0]));
  const series = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = formatDateKey(cursor);
    series.push({
      date: key.slice(5),
      value: map.get(key) || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = (params.range === "30d" || params.range === "90d" ? params.range : "7d") as RangeKey;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const businessRows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  const business = businessRows[0] ?? null;
  if (!business) redirect("/dashboard");

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - RANGE_DAYS[range] + 1);
  start.setHours(0, 0, 0, 0);

  const [contactsRows, messagesRows, platformRows, triggerRows, totalContactsRows, totalMessagesRows] =
    await Promise.all([
      sql`
        SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS value
        FROM conversation_threads
        WHERE business_id = ${business.id as string}
          AND created_at >= ${start.toISOString()}
        GROUP BY created_at::date
        ORDER BY created_at::date ASC
      `,
      sql`
        SELECT TO_CHAR(logged_at::date, 'YYYY-MM-DD') AS date, COALESCE(SUM(message_count), 0)::int AS value
        FROM message_logs
        WHERE business_id = ${business.id as string}
          AND logged_at >= ${start.toISOString()}
        GROUP BY logged_at::date
        ORDER BY logged_at::date ASC
      `,
      sql`
        SELECT platform AS name, COUNT(*)::int AS value
        FROM conversation_threads
        WHERE business_id = ${business.id as string}
          AND created_at >= ${start.toISOString()}
        GROUP BY platform
        ORDER BY value DESC
      `,
      sql`
        SELECT keyword, COALESCE(trigger_fires_count, 0)::int AS trigger_fires_count
        FROM keyword_triggers
        WHERE business_id = ${business.id as string}
        ORDER BY trigger_fires_count DESC, created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT COUNT(*)::int AS value
        FROM conversation_threads
        WHERE business_id = ${business.id as string}
          AND created_at >= ${start.toISOString()}
      `,
      sql`
        SELECT COALESCE(SUM(message_count), 0)::int AS value
        FROM message_logs
        WHERE business_id = ${business.id as string}
          AND logged_at >= ${start.toISOString()}
      `,
    ]);

  const contactSeries = buildDateSeries(start, now, contactsRows as Array<{ date: string; value: number }>);
  const messageSeries = buildDateSeries(start, now, messagesRows as Array<{ date: string; value: number }>);
  const platformBreakdown = (platformRows as Array<{ name: string; value: number }>).map((row) => ({
    name: row.name,
    value: row.value,
  }));

  const totalContacts = Number(totalContactsRows[0]?.value || 0);
  const totalMessages = Number(totalMessagesRows[0]?.value || 0);
  const avgMessagesPerContact = totalContacts > 0 ? Math.round(totalMessages / totalContacts) : 0;
  const mostActiveDay = messageSeries.reduce(
    (best, current) => (current.value > best.value ? current : best),
    messageSeries[0] || { date: "-", value: 0 }
  );
  const topPlatform = platformBreakdown[0]?.name || "n/a";
  const rangeMeta = RANGE_META[range];

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="surface-card rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-label">Analytics</p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
                The numbers behind your automation
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                See where conversations start, which channels lead, and how much work your flows are saving the team.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                {(["7d", "30d", "90d"] as RangeKey[]).map((option) => (
                  <Link
                    key={option}
                    href={`/dashboard/analytics?range=${option}`}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      range === option ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {RANGE_META[option].label}
                  </Link>
                ))}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {rangeMeta.hint}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard label="Contacts" value={totalContacts.toLocaleString()} note={`${rangeMeta.label} total`} />
            <MetricCard label="Messages" value={totalMessages.toLocaleString()} note="Sent by the bot and team" />
            <MetricCard label="Avg per contact" value={avgMessagesPerContact.toString()} note="Response density" />
            <MetricCard label="Top platform" value={topPlatform} note={`Peak day: ${mostActiveDay.date}`} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AnalyticsCharts
            contactSeries={contactSeries}
            messageSeries={messageSeries}
            platformBreakdown={platformBreakdown.length ? platformBreakdown : [{ name: "instagram", value: 0 }]}
            keywordTriggers={
              (triggerRows as Array<{ keyword: string; trigger_fires_count: number }>).slice(0, 10)
            }
            stats={{
              totalContacts,
              totalMessages,
              mostActiveDay: mostActiveDay.date,
              topPlatform,
            }}
            rangeLabel={range === "7d" ? "7d" : range === "30d" ? "30d" : "90d"}
          />

          <div className="space-y-6">
            <div className="surface-panel rounded-[30px] p-6">
              <p className="section-label">What to watch</p>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
                A few signals tell the whole story
              </h2>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                <p>High message volume with flat contact growth usually means the bot is working, but discovery can improve.</p>
                <p>A rising top platform share is a clue to double down on the channel that already converts best.</p>
                <p>Trigger spikes point to the exact questions customers ask most, which is the fastest place to add better automations.</p>
              </div>
            </div>

            <div className="surface-panel rounded-[30px] p-6">
              <p className="section-label">Next move</p>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
                Turn this data into a better flow
              </h2>
              <div className="mt-5 grid gap-3">
                <Link href="/dashboard/automation" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Review the top keyword trigger
                </Link>
                <Link href="/dashboard/flows" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Add a flow for the busiest question
                </Link>
                <Link href="/dashboard/inbox" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Check handoffs and live replies
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}
