import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

async function getBusinessId(userId: string) {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string | undefined) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ segments: [] });

  const segments = await sql`
    SELECT id, business_id, name, filters, created_at
    FROM contact_segments
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ segments });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const name = String(body?.name || "").trim();
  const filters = Array.isArray(body?.filters) ? body.filters : [];
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO contact_segments (business_id, name, filters)
    VALUES (${businessId}, ${name}, ${JSON.stringify(filters)})
    RETURNING id, business_id, name, filters, created_at
  `;

  return NextResponse.json({ segment: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sql`DELETE FROM contact_segments WHERE id = ${id} AND business_id = ${businessId}`;
  return NextResponse.json({ success: true });
}
