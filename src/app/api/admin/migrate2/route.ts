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
      CREATE TABLE IF NOT EXISTS sequences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sequences_business_created
      ON sequences (business_id, created_at DESC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sequence_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        delay_days INTEGER NOT NULL DEFAULT 0,
        delay_hours INTEGER NOT NULL DEFAULT 0,
        step_order INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(sequence_id, step_order)
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_order
      ON sequence_steps (sequence_id, step_order)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sequence_enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL,
        platform TEXT NOT NULL CHECK (platform IN ('instagram', 'messenger')),
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        current_step INTEGER NOT NULL DEFAULT 1,
        completed BOOLEAN NOT NULL DEFAULT false,
        UNIQUE(business_id, sequence_id, sender_id, platform)
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_due
      ON sequence_enrollments (business_id, completed, current_step, enrolled_at)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS contact_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        filters JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_contact_segments_business_created
      ON contact_segments (business_id, created_at DESC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
        edges JSONB NOT NULL DEFAULT '[]'::jsonb,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_flows_business_created
      ON flows (business_id, created_at DESC)
    `;

    await sql`
      ALTER TABLE IF EXISTS keyword_triggers
      ADD COLUMN IF NOT EXISTS sequence_id UUID REFERENCES sequences(id) ON DELETE SET NULL
    `;

    await sql`
      ALTER TABLE IF EXISTS keyword_triggers
      ADD COLUMN IF NOT EXISTS trigger_fires_count INTEGER NOT NULL DEFAULT 0
    `;

    return NextResponse.json({ success: true, message: "Migration 2 applied" });
  } catch (err) {
    console.error("Migration 2 error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
