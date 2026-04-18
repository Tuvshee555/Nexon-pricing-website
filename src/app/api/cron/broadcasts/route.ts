import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all scheduled broadcasts whose time has arrived
  const due = await sql`
    SELECT b.id, b.business_id, b.message, b.platform
    FROM broadcasts b
    WHERE b.status = 'scheduled'
      AND b.scheduled_at <= NOW()
    LIMIT 50
  `;

  let processed = 0;

  for (const broadcast of due) {
    const businessId = broadcast.business_id as string;
    const platform = broadcast.platform as string;
    const message = broadcast.message as string;

    // Get page tokens
    const accounts = await sql`
      SELECT page_access_token, platform as pa_platform
      FROM platform_accounts
      WHERE business_id = ${businessId}
    `;
    const pageTokenMap: Record<string, string> = {};
    for (const a of accounts) {
      if (a.page_access_token && a.pa_platform) {
        pageTokenMap[a.pa_platform as string] = a.page_access_token as string;
      }
    }

    // Get contacts
    const contacts = await sql`
      SELECT DISTINCT sender_id, platform
      FROM conversation_threads
      WHERE business_id = ${businessId}
      ${platform !== "all" ? sql`AND platform = ${platform}` : sql``}
      ORDER BY last_message_at DESC
      LIMIT 1000
    `;

    let sentCount = 0;
    for (const contact of contacts) {
      const token = pageTokenMap[contact.platform as string];
      if (!token) continue;
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: contact.sender_id },
              message: { text: message },
              messaging_type: "MESSAGE_TAG",
              tag: "ACCOUNT_UPDATE",
            }),
          }
        );
        if (res.ok) sentCount++;
      } catch { /* skip */ }
    }

    await sql`
      UPDATE broadcasts
      SET status = 'sent', sent_count = ${sentCount}, sent_at = NOW()
      WHERE id = ${broadcast.id as string}
    `;
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
