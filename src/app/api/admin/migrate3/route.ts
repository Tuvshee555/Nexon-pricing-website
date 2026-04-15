import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sql`
      ALTER TABLE conversation_threads
      ADD COLUMN IF NOT EXISTS needs_human BOOLEAN NOT NULL DEFAULT FALSE
    `;
    await sql`
      ALTER TABLE conversation_threads
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ
    `;
    await sql`
      ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS ai_comments_enabled BOOLEAN NOT NULL DEFAULT FALSE
    `;
    // Buttons support on keyword triggers
    await sql`
      ALTER TABLE keyword_triggers
      ADD COLUMN IF NOT EXISTS buttons JSONB NOT NULL DEFAULT '[]'
    `;

    return NextResponse.json({ success: true, message: "Migration 3 complete" });
  } catch (err) {
    console.error("Migration 3 error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
