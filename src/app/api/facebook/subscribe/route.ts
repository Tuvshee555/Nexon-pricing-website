import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import {
  subscribePageToWebhook,
  getInstagramAccount,
  type FacebookPage,
} from "@/lib/facebook";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { pageId, businessId, connectInstagram } = body as {
    pageId: string;
    businessId: string;
    connectInstagram?: boolean;
  };

  if (!pageId || !businessId) {
    return NextResponse.json({ error: "pageId and businessId required" }, { status: 400 });
  }

  const businesses = await sql`
    SELECT id FROM businesses WHERE id = ${businessId} AND user_id = ${userId} LIMIT 1
  `;
  if (!businesses[0]) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const cookieHeader = request.headers.get("cookie") || "";
  const fbPagesCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("fb_pages="))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();

  if (!fbPagesCookie) {
    return NextResponse.json({ error: "Facebook pages not found. Please reconnect." }, { status: 400 });
  }

  let pages: FacebookPage[];
  try {
    pages = JSON.parse(Buffer.from(fbPagesCookie, "base64").toString());
  } catch {
    return NextResponse.json({ error: "Invalid pages data" }, { status: 400 });
  }

  const selectedPage = pages.find((p) => p.id === pageId);
  if (!selectedPage) {
    return NextResponse.json({ error: "Selected page not found in authorized pages" }, { status: 400 });
  }

  const subscribed = await subscribePageToWebhook(pageId, selectedPage.access_token);
  if (!subscribed) {
    return NextResponse.json({ error: "Failed to subscribe page to webhook" }, { status: 500 });
  }

  let instagramAccountId: string | null = null;
  if (connectInstagram) {
    const igAccount = await getInstagramAccount(pageId, selectedPage.access_token);
    instagramAccountId = igAccount?.id ?? null;
  }

  // Upsert messenger platform account
  await sql`
    INSERT INTO platform_accounts (business_id, platform, external_id, page_id, page_name, page_access_token)
    VALUES (${businessId}, 'messenger', ${pageId}, ${pageId}, ${selectedPage.name}, ${selectedPage.access_token})
    ON CONFLICT (platform, external_id)
    DO UPDATE SET page_id = ${pageId}, page_name = ${selectedPage.name}, page_access_token = ${selectedPage.access_token}
  `;

  if (instagramAccountId) {
    await sql`
      INSERT INTO platform_accounts (business_id, platform, external_id, page_id, page_name, page_access_token, instagram_account_id)
      VALUES (${businessId}, 'instagram', ${instagramAccountId}, ${pageId}, ${selectedPage.name}, ${selectedPage.access_token}, ${instagramAccountId})
      ON CONFLICT (platform, external_id)
      DO UPDATE SET page_id = ${pageId}, page_name = ${selectedPage.name}, page_access_token = ${selectedPage.access_token}, instagram_account_id = ${instagramAccountId}
    `;
  }

  const platforms = ["messenger", ...(instagramAccountId ? ["instagram"] : [])];
  await sql`
    UPDATE businesses SET platforms = ${platforms}::text[], onboarding_step = 3 WHERE id = ${businessId}
  `;

  return NextResponse.json({
    success: true,
    pageName: selectedPage.name,
    instagramConnected: !!instagramAccountId,
  });
}
