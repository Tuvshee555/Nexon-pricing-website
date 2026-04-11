import { sql } from "@/lib/db";

export async function addVirtualBalance(businessId: string, amount: number) {
  await sql`
    UPDATE businesses
    SET virtual_balance = virtual_balance + ${amount}
    WHERE id = ${businessId}
  `;
}
