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

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateSeries(
  start: Date,
  end: Date,
  rows: Array<{ date: string; value: number }>
) {
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
  const mostActiveDay = messageSeries.reduce(
    (best, current) => (current.value > best.value ? current : best),
    messageSeries[0] || { date: "—", value: 0 }
  );
  const topPlatform = platformBreakdown[0]?.name || "n/a";

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Track contacts, message volume, and trigger performance over time.</p>
          </div>
          <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            {(["7d", "30d", "90d"] as RangeKey[]).map((option) => (
              <Link
                key={option}
                href={`/dashboard/analytics?range=${option}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  range === option ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {option === "7d" ? "Last 7 days" : option === "30d" ? "Last 30 days" : "Last 90 days"}
              </Link>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}
