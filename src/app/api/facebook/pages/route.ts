import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FacebookPage } from "@/lib/facebook";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Read pages from the cookie set during OAuth callback
  const cookieHeader = request.headers.get("cookie") || "";
  const fbPagesCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("fb_pages="))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();

  if (!fbPagesCookie) {
    return NextResponse.json({ pages: [] });
  }

  try {
    const pages = JSON.parse(
      Buffer.from(fbPagesCookie, "base64").toString()
    ) as FacebookPage[];
    return NextResponse.json({
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        // Never expose access_token to the client
      })),
    });
  } catch {
    return NextResponse.json({ pages: [] });
  }
}
