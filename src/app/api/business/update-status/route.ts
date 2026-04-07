import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { status } = body as { status?: string };

  if (!status || !["active", "paused"].includes(status)) {
    return NextResponse.json({ error: "Status must be 'active' or 'paused'" }, { status: 400 });
  }

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  const business = businesses[0] ?? null;
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (status === "active") {
    await sql`
      UPDATE businesses
      SET status = 'active', onboarding_done = true, onboarding_step = 5
      WHERE id = ${business.id as string}
    `;
  } else {
    await sql`UPDATE businesses SET status = ${status} WHERE id = ${business.id as string}`;
  }

  return NextResponse.json({ success: true });
}
