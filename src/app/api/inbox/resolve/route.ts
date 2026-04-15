import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { senderId, platform } = await request.json();

  if (!senderId || !platform) {
    return NextResponse.json({ error: "senderId and platform required" }, { status: 400 });
  }

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });
  const businessId = businesses[0].id as string;

  await sql`
    UPDATE conversation_threads
    SET needs_human = false, resolved_at = NOW()
    WHERE business_id = ${businessId}
      AND sender_id = ${senderId}
      AND platform = ${platform}
  `;

  return NextResponse.json({ success: true });
}
