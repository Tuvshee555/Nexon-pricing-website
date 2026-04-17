import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const senderId = searchParams.get("senderId");
  const platform = searchParams.get("platform");

  if (!senderId || !platform) return NextResponse.json({ error: "senderId and platform required" }, { status: 400 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ thread: null });

  const businessId = businesses[0].id as string;
  const rows = await sql`
    SELECT sender_id, platform, messages, last_message_at, assigned_to
    FROM conversation_threads
    WHERE business_id = ${businessId} AND sender_id = ${senderId} AND platform = ${platform}
    LIMIT 1
  `;

  return NextResponse.json({ thread: rows[0] || null });
}
