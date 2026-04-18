import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/mailer";

async function getBusinessId(userId: string): Promise<string | null> {
  const rows = await sql`SELECT id, name FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return rows[0] ? (rows[0].id as string) : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ members: [] });

  const members = await sql`
    SELECT id, email, name, role, status, created_at
    FROM team_members
    WHERE business_id = ${businessId} AND status != 'removed'
    ORDER BY created_at ASC
  `;
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessRows = await sql`SELECT id, name FROM businesses WHERE user_id = ${session.user.id} LIMIT 1`;
  if (!businessRows[0]) return NextResponse.json({ error: "No business" }, { status: 404 });

  const businessId = businessRows[0].id as string;
  const businessName = businessRows[0].name as string;

  const { email, name, role } = await request.json() as { email: string; name: string; role: string };
  if (!email || !role) return NextResponse.json({ error: "email and role required" }, { status: 400 });

  const validRoles = ["support", "growth", "viewer"];
  if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const inviteToken = randomBytes(32).toString("hex");

  const rows = await sql`
    INSERT INTO team_members (business_id, email, name, role, invite_token, status)
    VALUES (${businessId}, ${email}, ${name || ""}, ${role}, ${inviteToken}, 'pending')
    ON CONFLICT (business_id, email) DO UPDATE
      SET role = ${role}, invite_token = ${inviteToken}, status = 'pending'
    RETURNING id, email, name, role, status, created_at
  `;

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/team/accept/${inviteToken}`;

  await sendEmail({
    to: email,
    subject: `You've been invited to ${businessName} on Nexon`,
    text: `You've been invited to join ${businessName} as a ${role}.\n\nAccept your invite: ${inviteUrl}`,
    html: `<p>You've been invited to join <strong>${businessName}</strong> as a <strong>${role}</strong>.</p><p><a href="${inviteUrl}">Accept invite</a></p>`,
  });

  return NextResponse.json({ member: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sql`
    UPDATE team_members SET status = 'removed'
    WHERE id = ${id} AND business_id = ${businessId}
  `;
  return NextResponse.json({ ok: true });
}
