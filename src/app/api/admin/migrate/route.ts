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
    // keyword_triggers table
    await sql`
      CREATE TABLE IF NOT EXISTS keyword_triggers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        keyword TEXT NOT NULL,
        match_type TEXT NOT NULL DEFAULT 'contains',
        response TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'all',
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // broadcasts table
    await sql`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'all',
        status TEXT NOT NULL DEFAULT 'draft',
        sent_count INT NOT NULL DEFAULT 0,
        scheduled_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // contact_tags table
    await sql`
      CREATE TABLE IF NOT EXISTS contact_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        tag TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(business_id, sender_id, platform, tag)
      )
    `;

    return NextResponse.json({ success: true, message: "Tables created successfully" });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
