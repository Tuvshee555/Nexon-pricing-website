import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

// Parse a simple CSV string — handles quoted fields
function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const cols: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businesses = await sql`SELECT id FROM businesses WHERE user_id = ${session.user.id} LIMIT 1`;
  if (!businesses[0]) return NextResponse.json({ error: "No business" }, { status: 404 });
  const businessId = businesses[0].id as string;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return NextResponse.json({ error: "CSV must have header row and at least one data row" }, { status: 400 });

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const senderIdIdx = headers.indexOf("sender_id") !== -1 ? headers.indexOf("sender_id") : headers.indexOf("id");
  const platformIdx = headers.indexOf("platform");
  const nameIdx = headers.indexOf("name");

  if (senderIdIdx === -1) {
    return NextResponse.json({ error: "CSV must have a sender_id or id column" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const senderId = row[senderIdIdx]?.trim();
    const platform = (platformIdx !== -1 ? row[platformIdx]?.trim() : "instagram") || "instagram";
    if (!senderId) { skipped++; continue; }

    const validPlatforms = ["instagram", "messenger", "whatsapp", "telegram", "website"];
    if (!validPlatforms.includes(platform)) { skipped++; continue; }

    const existingName = nameIdx !== -1 ? row[nameIdx]?.trim() : undefined;
    const messages = existingName ? [{ role: "system", content: `Contact name: ${existingName}` }] : [];

    await sql`
      INSERT INTO conversation_threads (business_id, sender_id, platform, messages, last_message_at)
      VALUES (${businessId}, ${senderId}, ${platform}, ${JSON.stringify(messages)}, NOW())
      ON CONFLICT (business_id, sender_id, platform) DO NOTHING
    `;
    imported++;
  }

  return NextResponse.json({ ok: true, imported, skipped });
}
