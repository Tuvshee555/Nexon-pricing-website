import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { FacebookPage } from "@/lib/facebook";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieHeader = request.headers.get("cookie") || "";
  const fbPagesCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("fb_pages="))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();

  if (!fbPagesCookie) return NextResponse.json({ pages: [] });

  try {
    const pages = JSON.parse(Buffer.from(fbPagesCookie, "base64").toString()) as FacebookPage[];
    return NextResponse.json({
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    });
  } catch {
    return NextResponse.json({ pages: [] });
  }
}
