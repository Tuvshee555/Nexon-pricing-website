import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

async function getBusinessId(userId: string) {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string | undefined) ?? null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ flows: [] });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const rows = await sql`
      SELECT id, business_id, name, nodes, edges, enabled, created_at
      FROM flows
      WHERE id = ${id} AND business_id = ${businessId}
      LIMIT 1
    `;
    return NextResponse.json({ flow: rows[0] ?? null });
  }

  const flows = await sql`
    SELECT id, business_id, name, nodes, edges, enabled, created_at
    FROM flows
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ flows });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const name = String(body?.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO flows (business_id, name, nodes, edges, enabled)
    VALUES (${businessId}, ${name}, ${JSON.stringify(body?.nodes ?? [])}, ${JSON.stringify(body?.edges ?? [])}, ${body?.enabled !== false})
    RETURNING id, business_id, name, nodes, edges, enabled, created_at
  `;

  return NextResponse.json({ flow: rows[0] });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const id = body?.id ? String(body.id) : null;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const rows = await sql`
    UPDATE flows
    SET
      name = COALESCE(NULLIF(${String(body?.name || "").trim()}, ''), name),
      nodes = ${JSON.stringify(body?.nodes ?? [])},
      edges = ${JSON.stringify(body?.edges ?? [])},
      enabled = ${body?.enabled !== false}
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING id, business_id, name, nodes, edges, enabled, created_at
  `;

  return NextResponse.json({ flow: rows[0] ?? null });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sql`DELETE FROM flows WHERE id = ${id} AND business_id = ${businessId}`;
  return NextResponse.json({ success: true });
}
