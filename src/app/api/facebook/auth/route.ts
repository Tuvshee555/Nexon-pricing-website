import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId") || "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/facebook/callback`;

  // CSRF token: encode userId + businessId + random nonce
  const nonce = crypto.randomUUID();
  const statePayload = Buffer.from(
    JSON.stringify({ userId: user.id, businessId, nonce })
  ).toString("base64url");

  const fbParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: redirectUri,
    scope: [
      "pages_messaging",
      "pages_read_engagement",
      "pages_show_list",
      "instagram_basic",
      "instagram_manage_messages",
    ].join(","),
    state: statePayload,
    response_type: "code",
  });

  const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?${fbParams}`;

  const response = NextResponse.redirect(fbUrl);
  // Store nonce in httpOnly cookie for CSRF validation in callback
  response.cookies.set("fb_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300, // 5 minutes
    sameSite: "lax",
    path: "/",
  });

  return response;
}
