import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Run once after deploying to add:
 *  - businesses.trial_ends_at       — 14-day free trial end date
 *  - conversation_threads.assigned_to — team inbox assignment
 *
 * Visit /api/migrate-features to apply.
 */
export async function GET() {
  await sql`
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
  `;

  await sql`
    ALTER TABLE conversation_threads
    ADD COLUMN IF NOT EXISTS assigned_to TEXT
  `;

  return NextResponse.json({ ok: true });
}
