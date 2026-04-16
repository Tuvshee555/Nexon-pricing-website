import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import { notifyOwner } from "@/lib/telegram";

async function getBusinessId(userId: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const rows = await sql`
    SELECT owner_telegram_chat_id, notify_contact_limit, notify_payment, notify_bot_status
    FROM businesses WHERE id = ${businessId} LIMIT 1
  `;

  return NextResponse.json(rows[0] ?? {
    owner_telegram_chat_id: null,
    notify_contact_limit: true,
    notify_payment: true,
    notify_bot_status: true,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const body = await request.json();
  const { ownerTelegramChatId, notifyContactLimit, notifyPayment, notifyBotStatus, test } = body;

  // Test mode — just send a test message
  if (test && ownerTelegramChatId) {
    await notifyOwner(
      String(ownerTelegramChatId),
      `🔔 <b>Nexon тестийн мэдэгдэл</b>\n\nАмжилттай холбогдлоо! Дансны мэдэгдлүүд энд ирнэ.`
    );
    return NextResponse.json({ ok: true });
  }

  await sql`
    UPDATE businesses SET
      owner_telegram_chat_id = ${ownerTelegramChatId || null},
      notify_contact_limit = ${notifyContactLimit !== false},
      notify_payment = ${notifyPayment !== false},
      notify_bot_status = ${notifyBotStatus !== false}
    WHERE id = ${businessId}
  `;

  return NextResponse.json({ ok: true });
}
