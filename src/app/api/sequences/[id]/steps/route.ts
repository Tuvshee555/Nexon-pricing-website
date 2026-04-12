import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

async function getBusinessId(userId: string) {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string | undefined) ?? null;
}

async function getOwnedSequence(sequenceId: string, businessId: string) {
  const rows = await sql`
    SELECT id
    FROM sequences
    WHERE id = ${sequenceId} AND business_id = ${businessId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ steps: [] });

  const sequence = await getOwnedSequence(params.id, businessId);
  if (!sequence) return NextResponse.json({ steps: [] });

  const steps = await sql`
    SELECT id, sequence_id, message, delay_days, delay_hours, step_order, created_at
    FROM sequence_steps
    WHERE sequence_id = ${params.id}
    ORDER BY step_order ASC
  `;

  return NextResponse.json({ steps });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const sequence = await getOwnedSequence(params.id, businessId);
  if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  const body = await request.json();
  const message = String(body?.message || "").trim();
  const delayDays = Number(body?.delayDays ?? 0);
  const delayHours = Number(body?.delayHours ?? 0);
  const stepOrder = body?.stepOrder ? Number(body.stepOrder) : null;

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const orderRows = stepOrder
    ? []
    : await sql`
        SELECT COALESCE(MAX(step_order), 0) + 1 AS next_order
        FROM sequence_steps
        WHERE sequence_id = ${params.id}
      `;
  const resolvedOrder = stepOrder ?? Number(orderRows[0]?.next_order ?? 1);

  const rows = await sql`
    INSERT INTO sequence_steps (
      sequence_id, message, delay_days, delay_hours, step_order
    )
    VALUES (
      ${params.id}, ${message}, ${delayDays}, ${delayHours}, ${resolvedOrder}
    )
    RETURNING id, sequence_id, message, delay_days, delay_hours, step_order, created_at
  `;

  return NextResponse.json({ step: rows[0] });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const sequence = await getOwnedSequence(params.id, businessId);
  if (!sequence) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  const body = await request.json();
  const stepId = body?.stepId ? String(body.stepId) : null;
  if (!stepId) return NextResponse.json({ error: "stepId required" }, { status: 400 });

  await sql`
    DELETE FROM sequence_steps
    WHERE id = ${stepId} AND sequence_id = ${params.id}
  `;

  return NextResponse.json({ success: true });
}
