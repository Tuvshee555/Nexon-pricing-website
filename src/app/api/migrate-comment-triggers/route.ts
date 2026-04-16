import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS comment_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL,
      match_type TEXT NOT NULL DEFAULT 'contains',
      public_reply_text TEXT NOT NULL DEFAULT '✅ Sent! Check your DM',
      dm_message TEXT NOT NULL,
      like_comment BOOLEAN NOT NULL DEFAULT true,
      enabled BOOLEAN NOT NULL DEFAULT true,
      platform TEXT NOT NULL DEFAULT 'all',
      trigger_fires_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_comment_triggers_business ON comment_triggers(business_id)`;
  return NextResponse.json({ ok: true });
}
