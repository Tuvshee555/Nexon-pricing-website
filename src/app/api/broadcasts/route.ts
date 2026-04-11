import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ broadcasts: [] });

  const businessId = businesses[0].id as string;
  const broadcasts = await sql`
    SELECT * FROM broadcasts WHERE business_id = ${businessId} ORDER BY created_at DESC LIMIT 50
  `;

  return NextResponse.json({ broadcasts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { message, platform } = body;

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const businesses = await sql`
    SELECT b.id, pa.page_access_token, pa.platform as pa_platform
    FROM businesses b
    LEFT JOIN platform_accounts pa ON pa.business_id = b.id
    WHERE b.user_id = ${userId}
    LIMIT 10
  `;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });

  const businessId = businesses[0].id as string;

  // Get contacts to send to
  const contacts = await sql`
    SELECT DISTINCT sender_id, platform
    FROM conversation_threads
    WHERE business_id = ${businessId}
    ${platform && platform !== "all" ? sql`AND platform = ${platform}` : sql``}
    ORDER BY last_message_at DESC
    LIMIT 1000
  `;

  // Create broadcast record
  const broadcastRows = await sql`
    INSERT INTO broadcasts (business_id, message, platform, status)
    VALUES (${businessId}, ${message}, ${platform || "all"}, 'sending')
    RETURNING id
  `;
  const broadcastId = broadcastRows[0].id as string;

  // Send messages using page_access_token
  const pageTokenMap: Record<string, string> = {};
  for (const b of businesses) {
    if (b.page_access_token && b.pa_platform) {
      pageTokenMap[b.pa_platform as string] = b.page_access_token as string;
    }
  }

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
    } catch {
      // skip failed sends
    }
  }

  await sql`
    UPDATE broadcasts
    SET status = 'sent', sent_count = ${sentCount}, sent_at = NOW()
    WHERE id = ${broadcastId}
  `;

  return NextResponse.json({ success: true, sentCount, broadcastId });
}
