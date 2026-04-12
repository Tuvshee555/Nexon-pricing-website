import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  exchangeCodeForShortToken,
  exchangeForLongLivedToken,
  getUserPages,
} from "@/lib/facebook";
import { getAppUrl } from "@/lib/app-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appUrl = getAppUrl(request);

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=fb_denied`);
  }

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

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.id !== stateData.userId) {
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=auth`);
  }

  try {
    const redirectUri = `${appUrl}/api/facebook/callback`;
    const shortToken = await exchangeCodeForShortToken(code, redirectUri);
    console.log("[FB callback] short token obtained, exchanging for long token...");
    const longToken = await exchangeForLongLivedToken(shortToken);
    console.log("[FB callback] long token obtained, fetching pages...");
    const pages = await getUserPages(longToken);
    console.log("[FB callback] getUserPages result:", JSON.stringify(pages));

    const pagesPayload = Buffer.from(JSON.stringify(pages)).toString("base64");
    const redirectUrl = `${appUrl}/dashboard/setup?step=2&fb_connected=1&businessId=${stateData.businessId}`;
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set("fb_pages", pagesPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      sameSite: "lax",
      path: "/",
    });
    response.cookies.set("fb_oauth_nonce", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    console.error("FB callback error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard/setup?step=2&error=fb_error`);
  }
}
