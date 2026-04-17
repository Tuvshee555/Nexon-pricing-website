import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

async function getBusinessId(userId: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string) ?? null;
}

// Validate token by calling WhatsApp API
async function validateWhatsAppToken(phoneNumberId: string, token: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name&access_token=${token}`
  );
  if (!res.ok) return null;
  return (await res.json()) as { display_phone_number?: string; verified_name?: string };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ connected: false });

  const rows = await sql`
    SELECT id, page_name, page_id
    FROM platform_accounts
    WHERE business_id = ${businessId} AND platform = 'whatsapp'
    LIMIT 1
  `;

  if (!rows[0]) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    phoneNumber: rows[0].page_name as string,
    phoneNumberId: rows[0].page_id as string,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { phoneNumberId, accessToken } = await request.json() as {
    phoneNumberId: string;
    accessToken: string;
  };

  if (!phoneNumberId?.trim() || !accessToken?.trim()) {
    return NextResponse.json({ error: "phoneNumberId and accessToken are required" }, { status: 400 });
  }

  const info = await validateWhatsAppToken(phoneNumberId.trim(), accessToken.trim());
  if (!info) {
    return NextResponse.json({ error: "Invalid credentials — check your Phone Number ID and token" }, { status: 400 });
  }

  const phoneNumber = info.display_phone_number || phoneNumberId.trim();

  // Remove existing WhatsApp account then insert fresh
  await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId} AND platform = 'whatsapp'`;
  await sql`
    INSERT INTO platform_accounts (business_id, platform, external_id, page_access_token, page_name, page_id)
    VALUES (${businessId}, 'whatsapp', ${phoneNumberId.trim()}, ${accessToken.trim()}, ${phoneNumber}, ${phoneNumberId.trim()})
  `;

  return NextResponse.json({ connected: true, phoneNumber });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId} AND platform = 'whatsapp'`;

  return NextResponse.json({ success: true });
}
