import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { getTelegramBotInfo, setTelegramWebhook, deleteTelegramWebhook } from "@/lib/telegram-bot";
import { randomUUID } from "crypto";

async function getBusinessId(userId: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ connected: false, username: null });

  const rows = await sql`
    SELECT telegram_bot_username,
           telegram_bot_token IS NOT NULL AS connected
    FROM platform_accounts
    WHERE business_id = ${businessId} AND platform = 'telegram'
    LIMIT 1
  `;

  if (!rows[0]) return NextResponse.json({ connected: false, username: null });
  return NextResponse.json({
    connected: rows[0].connected === true || rows[0].connected === "true",
    username: rows[0].telegram_bot_username ?? null,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { botToken } = await request.json();
  if (!botToken?.trim()) return NextResponse.json({ error: "Bot token required" }, { status: 400 });

  const botInfo = await getTelegramBotInfo(botToken.trim());
  if (!botInfo.ok) {
    return NextResponse.json({ error: "Invalid bot token. Make sure you copied it correctly from @BotFather." }, { status: 400 });
  }

  const webhookSecret = randomUUID().replace(/-/g, "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexon-digital-nova.com";
  const webhookUrl = `${appUrl}/api/webhook/telegram`;

  await setTelegramWebhook({ botToken: botToken.trim(), webhookUrl, secretToken: webhookSecret });

  // Upsert — delete existing then insert fresh
  await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId} AND platform = 'telegram'`;
  await sql`
    INSERT INTO platform_accounts (
      business_id, platform, page_id, external_id,
      telegram_bot_token, telegram_bot_username, telegram_webhook_secret
    )
    VALUES (
      ${businessId}, 'telegram',
      ${String(botInfo.result.id)}, ${String(botInfo.result.id)},
      ${botToken.trim()}, ${botInfo.result.username}, ${webhookSecret}
    )
  `;

  return NextResponse.json({ ok: true, username: botInfo.result.username });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const rows = await sql`
    SELECT telegram_bot_token FROM platform_accounts
    WHERE business_id = ${businessId} AND platform = 'telegram' LIMIT 1
  `;
  if (rows[0]?.telegram_bot_token) {
    await deleteTelegramWebhook(rows[0].telegram_bot_token as string);
  }

  await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId} AND platform = 'telegram'`;
  return NextResponse.json({ ok: true });
}
