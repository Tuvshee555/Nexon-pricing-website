import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const rows = await sql`
    SELECT knowledge_json, ai_comments_enabled
    FROM businesses
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  const row = rows[0] ?? null;

  return NextResponse.json({
    knowledge: row?.knowledge_json ?? null,
    aiCommentsEnabled: row?.ai_comments_enabled ?? false,
  });
}
