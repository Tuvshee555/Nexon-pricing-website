import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const rows = await sql`
    SELECT id, business_id, email, status
    FROM team_members
    WHERE invite_token = ${token}
    LIMIT 1
  `;

  if (!rows[0] || rows[0].status === "removed") {
    return NextResponse.redirect(new URL("/login?error=invalid_invite", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  if (rows[0].status === "active") {
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  await sql`
    UPDATE team_members
    SET status = 'active', invite_token = NULL
    WHERE id = ${rows[0].id as string}
  `;

  return NextResponse.redirect(new URL("/login?invited=1", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
