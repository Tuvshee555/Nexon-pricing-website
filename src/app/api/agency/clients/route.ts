import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Check if user is agency
  const userRow = await sql`SELECT is_agency FROM users WHERE id = ${userId} LIMIT 1`;
  if (!userRow[0]?.is_agency && session.user.role !== "admin") {
    return NextResponse.json({ error: "Agency access required" }, { status: 403 });
  }

  const agencyBusiness = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!agencyBusiness[0]) return NextResponse.json({ clients: [] });

  const agencyId = agencyBusiness[0].id as string;

  const clients = await sql`
    SELECT b.id, b.name, b.status, b.virtual_balance, b.created_at,
           u.email as owner_email,
           (SELECT COUNT(*) FROM conversation_threads ct WHERE ct.business_id = b.id)::int as contact_count
    FROM businesses b
    JOIN users u ON u.id = b.user_id
    WHERE b.agency_id = ${agencyId}
    ORDER BY b.created_at DESC
  `;
  return NextResponse.json({ clients, agencyId });
}
