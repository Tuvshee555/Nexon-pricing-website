import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  subscribePageToWebhook,
  getInstagramAccount,
  type FacebookPage,
} from "@/lib/facebook";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { pageId, businessId, connectInstagram } = body as {
    pageId: string;
    businessId: string;
    connectInstagram?: boolean;
  };

  if (!pageId || !businessId) {
    return NextResponse.json({ error: "pageId and businessId required" }, { status: 400 });
  }

  // Verify the business belongs to this user
  const adminClient = await createAdminClient();
  const { data: business } = await adminClient
    .from("businesses")
    .select("id, user_id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Read pages from cookie to get the access token
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

  // Subscribe the page to our webhook
  const subscribed = await subscribePageToWebhook(pageId, selectedPage.access_token);
  if (!subscribed) {
    return NextResponse.json({ error: "Failed to subscribe page to webhook" }, { status: 500 });
  }

  // Optionally get Instagram account linked to this page
  let instagramAccountId: string | null = null;
  if (connectInstagram) {
    const igAccount = await getInstagramAccount(pageId, selectedPage.access_token);
    instagramAccountId = igAccount?.id ?? null;
  }

  // Upsert platform_accounts for Messenger (Facebook Page)
  await adminClient.from("platform_accounts").upsert({
    business_id: businessId,
    platform: "messenger",
    external_id: pageId,
    page_id: pageId,
    page_name: selectedPage.name,
    page_access_token: selectedPage.access_token,
  }, { onConflict: "business_id,platform" });

  // Upsert platform_accounts for Instagram if connected
  if (instagramAccountId) {
    await adminClient.from("platform_accounts").upsert({
      business_id: businessId,
      platform: "instagram",
      external_id: instagramAccountId,
      page_id: pageId,
      page_name: selectedPage.name,
      page_access_token: selectedPage.access_token,
      instagram_account_id: instagramAccountId,
    }, { onConflict: "business_id,platform" });
  }

  // Update the business platforms array
  const platforms = ["messenger"];
  if (instagramAccountId) platforms.push("instagram");
  await adminClient
    .from("businesses")
    .update({ platforms, onboarding_step: 3 })
    .eq("id", businessId);

  return NextResponse.json({
    success: true,
    pageName: selectedPage.name,
    instagramConnected: !!instagramAccountId,
  });
}
