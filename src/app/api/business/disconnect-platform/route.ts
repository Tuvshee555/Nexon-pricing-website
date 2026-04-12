import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform"); // "messenger" | "instagram" | "all."

  const businesses = await sql`
    SELECT id, platforms FROM businesses WHERE user_id = ${session.user.id} LIMIT 1
  `;
  const business = businesses[0] ?? null;
  if (!business)
    return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const businessId = business.id as string;

  if (platform === "all" || !platform) {
    await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId}`;
    await sql`UPDATE businesses SET platforms = '{}' WHERE id = ${businessId}`;
  } else {
    await sql`DELETE FROM platform_accounts WHERE business_id = ${businessId} AND platform = ${platform}`;
    const remaining =
      await sql`SELECT platform FROM platform_accounts WHERE business_id = ${businessId}`;
    const remainingPlatforms = remaining.map((r) => r.platform as string);
    await sql`UPDATE businesses SET platforms = ${remainingPlatforms}::text[] WHERE id = ${businessId}`;
  }

  return NextResponse.json({ success: true });
}
