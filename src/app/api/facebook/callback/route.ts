import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForShortToken,
  exchangeForLongLivedToken,
  getUserPages,
} from "@/lib/facebook";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=fb_denied`);
  }

  // Validate CSRF
  const cookieNonce = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("fb_oauth_nonce="))
    ?.split("=")[1]
    ?.trim();

  let stateData: { userId: string; businessId: string; nonce: string };
  try {
    stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString());
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=invalid_state`);
  }

  if (!cookieNonce || cookieNonce !== stateData.nonce) {
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=csrf`);
  }

  // Verify the session user matches state
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== stateData.userId) {
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=auth`);
  }

  try {
    const redirectUri = `${appUrl}/api/facebook/callback`;

    // Exchange code → short-lived token → long-lived user token
    const shortToken = await exchangeCodeForShortToken(code, redirectUri);
    const longToken = await exchangeForLongLivedToken(shortToken);

    // Fetch user's pages (each page has its own long-lived page token)
    const pages = await getUserPages(longToken);

    // Store pages in a short-lived httpOnly cookie (base64 JSON, 10 min TTL)
    const pagesPayload = Buffer.from(JSON.stringify(pages)).toString("base64");

    const redirectUrl = `${appUrl}/dashboard/setup?step=2&fb_connected=1&businessId=${stateData.businessId}`;
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set("fb_pages", pagesPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutes to complete the step
      sameSite: "lax",
      path: "/",
    });

    // Clear the nonce cookie
    response.cookies.set("fb_oauth_nonce", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("FB callback error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=fb_error`);
  }
}
