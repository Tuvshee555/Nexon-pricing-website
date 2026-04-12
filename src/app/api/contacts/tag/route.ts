import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { senderId, platform, tag, action } = await request.json();

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });
  const businessId = businesses[0].id as string;

  if (action === "remove") {
    await sql`DELETE FROM contact_tags WHERE business_id = ${businessId} AND sender_id = ${senderId} AND platform = ${platform} AND tag = ${tag}`;
  } else {
    await sql`
      INSERT INTO contact_tags (business_id, sender_id, platform, tag)
      VALUES (${businessId}, ${senderId}, ${platform}, ${tag})
      ON CONFLICT (business_id, sender_id, platform, tag) DO NOTHING
    `;
  }

  return NextResponse.json({ success: true });
}
