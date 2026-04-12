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
  if (!businessId) return NextResponse.json({ sequences: [] });

  const sequences = await sql`
    SELECT
      s.id,
      s.business_id,
      s.name,
      s.enabled,
      s.created_at,
      COUNT(ss.id)::int AS step_count
    FROM sequences s
    LEFT JOIN sequence_steps ss ON ss.sequence_id = s.id
    WHERE s.business_id = ${businessId}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  return NextResponse.json({ sequences });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const id = body?.id ? String(body.id) : null;
  const name = String(body?.name || "").trim();
  const enabled = body?.enabled !== undefined ? Boolean(body.enabled) : true;

  if (id) {
    const rows = await sql`
      UPDATE sequences
      SET
        name = COALESCE(NULLIF(${name}, ''), name),
        enabled = ${enabled}
      WHERE id = ${id} AND business_id = ${businessId}
      RETURNING id, business_id, name, enabled, created_at
    `;
    return NextResponse.json({ sequence: rows[0] ?? null });
  }

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO sequences (business_id, name, enabled)
    VALUES (${businessId}, ${name}, ${enabled})
    RETURNING id, business_id, name, enabled, created_at
  `;

  return NextResponse.json({ sequence: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sql`DELETE FROM sequences WHERE id = ${id} AND business_id = ${businessId}`;
  return NextResponse.json({ success: true });
}
