import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const segmentId = searchParams.get("segmentId");
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
    LIMIT 500
  `;

  if (!segmentId) {
    return NextResponse.json({ contacts });
  }

  const segments = await sql`
    SELECT id, filters
    FROM contact_segments
    WHERE id = ${segmentId} AND business_id = ${businessId}
    LIMIT 1
  `;
  const segment = segments[0] ?? null;
  const filters = Array.isArray(segment?.filters)
    ? (segment.filters as Array<{ field: string; operator: string; value: string }>)
    : [];

  const filtered = (contacts as Array<{
    sender_id: string;
    platform: string;
    last_message_at: string;
    message_count: number;
    last_message: string;
    tags: string[];
  }>).filter((contact) => {
    return filters.every((filter) => {
      if (filter.field === "platform") {
        return String(contact.platform) === String(filter.value);
      }

      if (filter.field === "last_message_at") {
        const contactDate = new Date(contact.last_message_at).getTime();
        const filterDate = new Date(filter.value).getTime();
        if (Number.isNaN(contactDate) || Number.isNaN(filterDate)) return true;
        if (filter.operator === "before") return contactDate < filterDate;
        if (filter.operator === "after") return contactDate > filterDate;
        return true;
      }

      if (filter.field === "has_tag") {
        const hasTag = (contact.tags || []).includes(filter.value);
        if (filter.operator === "does_not_have") return !hasTag;
        return hasTag;
      }

      return true;
    });
  });

  return NextResponse.json({ contacts: filtered });
}
