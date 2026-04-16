import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

async function getBusinessId(userId: string): Promise<string | null> {
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (businesses[0]?.id as string) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ triggers: [] });

  const triggers = await sql`
    SELECT id, keyword, match_type, public_reply_text, dm_message, like_comment, enabled, platform, trigger_fires_count, created_at
    FROM comment_triggers
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ triggers });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const { keyword, matchType, publicReplyText, dmMessage, likeComment, platform } = body;

  if (!keyword || !dmMessage) {
    return NextResponse.json({ error: "keyword and dmMessage required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO comment_triggers (business_id, keyword, match_type, public_reply_text, dm_message, like_comment, platform)
    VALUES (
      ${businessId},
      ${keyword},
      ${matchType || "contains"},
      ${publicReplyText || "✅ Sent! Check your DM"},
      ${dmMessage},
      ${likeComment !== false},
      ${platform || "all"}
    )
    RETURNING id, keyword, match_type, public_reply_text, dm_message, like_comment, enabled, platform, trigger_fires_count, created_at
  `;

  return NextResponse.json({ trigger: rows[0] });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id, enabled } = await request.json();
  await sql`UPDATE comment_triggers SET enabled = ${enabled} WHERE id = ${id} AND business_id = ${businessId}`;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id } = await request.json();
  await sql`DELETE FROM comment_triggers WHERE id = ${id} AND business_id = ${businessId}`;

  return NextResponse.json({ success: true });
}
