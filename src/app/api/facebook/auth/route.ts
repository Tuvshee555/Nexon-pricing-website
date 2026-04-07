import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId") || "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/facebook/callback`;

  const nonce = crypto.randomUUID();
  const statePayload = Buffer.from(
    JSON.stringify({ userId: session.user.id, businessId, nonce })
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
  response.cookies.set("fb_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
