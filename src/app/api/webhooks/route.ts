import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { randomBytes } from "crypto";

async function getBusinessId(userId: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ endpoints: [] });

  const endpoints = await sql`
    SELECT id, url, events, enabled, created_at
    FROM webhook_endpoints
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ endpoints });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { url, events } = await request.json() as { url: string; events: string[] };
  if (!url || !events?.length) return NextResponse.json({ error: "url and events required" }, { status: 400 });

  const secret = randomBytes(24).toString("hex");
  const rows = await sql`
    INSERT INTO webhook_endpoints (business_id, url, events, secret)
    VALUES (${businessId}, ${url}, ${events}, ${secret})
    RETURNING id, url, events, secret, enabled, created_at
  `;
  return NextResponse.json({ endpoint: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sql`DELETE FROM webhook_endpoints WHERE id = ${id} AND business_id = ${businessId}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id, enabled } = await request.json() as { id: string; enabled: boolean };
  await sql`UPDATE webhook_endpoints SET enabled = ${enabled} WHERE id = ${id} AND business_id = ${businessId}`;
  return NextResponse.json({ ok: true });
}
