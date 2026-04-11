import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ contacts: [] });

  const businessId = businesses[0].id as string;

  const contacts = await sql`
    SELECT
      ct.sender_id,
      ct.platform,
      ct.last_message_at,
      jsonb_array_length(ct.messages::jsonb) AS message_count,
      (ct.messages::jsonb -> -1 -> 'content')::text AS last_message,
      COALESCE(
        (SELECT jsonb_agg(tag) FROM contact_tags WHERE business_id = ${businessId} AND sender_id = ct.sender_id AND platform = ct.platform),
        '[]'::jsonb
      ) AS tags
    FROM conversation_threads ct
    WHERE ct.business_id = ${businessId}
    ORDER BY ct.last_message_at DESC
    LIMIT 200
  `;

  return NextResponse.json({ contacts });
}
