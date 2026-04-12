import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ triggers: [] });

  const businessId = businesses[0].id as string;
  const triggers = await sql`
    SELECT id, business_id, keyword, match_type, response, platform, enabled, sequence_id, trigger_fires_count, created_at
    FROM keyword_triggers
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ triggers });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { keyword, matchType, response, platform, sequenceId } = body;

  if (!keyword || !response) return NextResponse.json({ error: "keyword and response required" }, { status: 400 });

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });
  const businessId = businesses[0].id as string;

  const rows = await sql`
    INSERT INTO keyword_triggers (business_id, keyword, match_type, response, platform, sequence_id)
    VALUES (${businessId}, ${keyword}, ${matchType || "contains"}, ${response}, ${platform || "all"}, ${sequenceId || null})
    RETURNING id, business_id, keyword, match_type, response, platform, enabled, sequence_id, trigger_fires_count, created_at
  `;

  return NextResponse.json({ trigger: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id } = await request.json();

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });
  const businessId = businesses[0].id as string;

  await sql`DELETE FROM keyword_triggers WHERE id = ${id} AND business_id = ${businessId}`;

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id, enabled } = await request.json();

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });
  const businessId = businesses[0].id as string;

  await sql`UPDATE keyword_triggers SET enabled = ${enabled} WHERE id = ${id} AND business_id = ${businessId}`;

  return NextResponse.json({ success: true });
}
