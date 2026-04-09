import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  const business = businesses[0] ?? null;
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await sql`
    UPDATE businesses
    SET knowledge_json = NULL
    WHERE id = ${business.id as string}
  `;

  return NextResponse.json({ success: true });
}
