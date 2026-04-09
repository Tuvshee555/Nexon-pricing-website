import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

const MAX_UPLOAD_BYTES = 100 * 1024;

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const fileEntries = Array.from(formData.entries()).filter((entry): entry is [string, File] => isFile(entry[1]));

  if (fileEntries.length !== 1) {
    return NextResponse.json({ error: "Upload exactly one JSON file" }, { status: 400 });
  }

  const file = fileEntries[0][1];
  if (!file.name.toLowerCase().endsWith(".json")) {
    return NextResponse.json({ error: "File must have a .json extension" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File must be 100KB or smaller" }, { status: 400 });
  }

  let parsed: unknown;
  try {
    const rawText = (await file.text()).replace(/^\uFEFF/, "").trim();
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
  }

  if (parsed === null || typeof parsed !== "object") {
    return NextResponse.json({ error: "Knowledge base must be a JSON object or array" }, { status: 400 });
  }

  const userId = session.user.id;
  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  const business = businesses[0] ?? null;
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await sql`
    UPDATE businesses
    SET knowledge_json = ${JSON.stringify(parsed)}::jsonb
    WHERE id = ${business.id as string}
  `;

  return NextResponse.json({ success: true });
}
