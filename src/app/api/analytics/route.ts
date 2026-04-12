import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  const businessId = businesses[0]?.id as string | undefined;
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(end);
  startOfMonth.setDate(1);

  const start30d = new Date(end);
  start30d.setDate(start30d.getDate() - 29);

  const [
    thisMonthRows,
    perDayRows,
    allTimeRows,
    platformRows,
    contactRows,
    triggerRows,
  ] = await Promise.all([
    sql`
      SELECT COALESCE(SUM(message_count), 0)::int AS value
      FROM message_logs
      WHERE business_id = ${businessId} AND logged_at >= ${startOfMonth.toISOString()}
    `,
    sql`
      SELECT TO_CHAR(logged_at::date, 'YYYY-MM-DD') AS date, COALESCE(SUM(message_count), 0)::int AS value
      FROM message_logs
      WHERE business_id = ${businessId} AND logged_at >= ${start30d.toISOString()}
      GROUP BY logged_at::date
      ORDER BY logged_at::date ASC
    `,
    sql`
      SELECT COALESCE(SUM(message_count), 0)::int AS value
      FROM message_logs
      WHERE business_id = ${businessId}
    `,
    sql`
      SELECT platform, COALESCE(SUM(message_count), 0)::int AS value
      FROM message_logs
      WHERE business_id = ${businessId}
      GROUP BY platform
      ORDER BY value DESC
    `,
    sql`
      SELECT COUNT(*)::int AS value
      FROM conversation_threads
      WHERE business_id = ${businessId}
    `,
    sql`
      SELECT COALESCE(SUM(trigger_fires_count), 0)::int AS value
      FROM keyword_triggers
      WHERE business_id = ${businessId}
    `,
  ]);

  const perDayMap = new Map(
    (perDayRows as Array<{ date: string; value: number }>).map((row) => [row.date, Number(row.value) || 0])
  );

  const messagesPerDay: Array<{ date: string; count: number }> = [];
  const cursor = new Date(start30d);
  while (cursor <= end) {
    const key = formatDateKey(cursor);
    messagesPerDay.push({ date: key, count: perDayMap.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const platformBreakdown = (platformRows as Array<{ platform: string; value: number }>).map((row) => ({
    platform: String(row.platform),
    count: Number(row.value) || 0,
  }));

  return NextResponse.json({
    totalContacts: Number(contactRows[0]?.value || 0),
    messagesThisMonth: Number(thisMonthRows[0]?.value || 0),
    messagesAllTime: Number(allTimeRows[0]?.value || 0),
    triggerFires: Number(triggerRows[0]?.value || 0),
    messagesPerDay,
    platformBreakdown,
  });
}

