import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";

async function getBusinessId(userId: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  return (rows[0]?.id as string) ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ products: [] });

  const products = await sql`
    SELECT * FROM products WHERE business_id = ${businessId} ORDER BY created_at DESC
  `;
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { name, description, price, image_url, sku, currency } = await request.json() as {
    name: string; description?: string; price: number;
    image_url?: string; sku?: string; currency?: string;
  };

  if (!name || price == null) return NextResponse.json({ error: "name and price required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO products (business_id, name, description, price, image_url, sku, currency)
    VALUES (${businessId}, ${name}, ${description ?? null}, ${price}, ${image_url ?? null}, ${sku ?? null}, ${currency ?? "MNT"})
    RETURNING *
  `;
  return NextResponse.json({ product: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await sql`DELETE FROM products WHERE id = ${id} AND business_id = ${businessId}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = await getBusinessId(session.user.id);
  if (!businessId) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { id, ...updates } = await request.json() as { id: string; enabled?: boolean; name?: string; price?: number; description?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (updates.enabled !== undefined) {
    await sql`UPDATE products SET enabled = ${updates.enabled} WHERE id = ${id} AND business_id = ${businessId}`;
  }
  if (updates.name || updates.price != null || updates.description !== undefined) {
    await sql`
      UPDATE products SET
        name = COALESCE(${updates.name ?? null}, name),
        price = COALESCE(${updates.price ?? null}, price),
        description = COALESCE(${updates.description ?? null}, description)
      WHERE id = ${id} AND business_id = ${businessId}
    `;
  }
  return NextResponse.json({ ok: true });
}
