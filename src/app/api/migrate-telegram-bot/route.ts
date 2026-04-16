import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  await sql`
    ALTER TABLE platform_accounts
    ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT,
    ADD COLUMN IF NOT EXISTS telegram_bot_username TEXT,
    ADD COLUMN IF NOT EXISTS telegram_webhook_secret TEXT
  `;
  await sql`
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS owner_telegram_chat_id TEXT,
    ADD COLUMN IF NOT EXISTS notify_contact_limit BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notify_payment BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notify_bot_status BOOLEAN DEFAULT true
  `;
  return NextResponse.json({ ok: true });
}
