import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { senderId, platform, durationMinutes = 30 } = await request.json();
  if (!senderId || !platform) return NextResponse.json({ error: "senderId and platform required" }, { status: 400 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });

  const businessId = businesses[0].id as string;
  const pausedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

  await sql`
    INSERT INTO conversation_threads (business_id, sender_id, platform, messages, last_message_at, paused_until)
    VALUES (${businessId}, ${senderId}, ${platform}, '[]', NOW(), ${pausedUntil})
    ON CONFLICT (business_id, sender_id, platform)
    DO UPDATE SET paused_until = ${pausedUntil}
  `;

  return NextResponse.json({ ok: true, pausedUntil });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const senderId = searchParams.get("senderId");
  const platform = searchParams.get("platform");
  if (!senderId || !platform) return NextResponse.json({ error: "senderId and platform required" }, { status: 400 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });

  const businessId = businesses[0].id as string;

  await sql`
    UPDATE conversation_threads
    SET paused_until = NULL
    WHERE business_id = ${businessId} AND sender_id = ${senderId} AND platform = ${platform}
  `;

  return NextResponse.json({ ok: true });
}
