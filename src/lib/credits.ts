import { sql } from "@/lib/db";

export async function addCredits(businessId: string, credits: number) {
  await sql`
    INSERT INTO credits (business_id, balance, total_purchased)
    VALUES (${businessId}, ${credits}, ${credits})
    ON CONFLICT (business_id)
    DO UPDATE SET
      balance = credits.balance + ${credits},
      total_purchased = credits.total_purchased + ${credits},
      updated_at = NOW()
  `;
}

export async function addVirtualBalance(businessId: string, amount: number) {
  await sql`
    UPDATE businesses
    SET virtual_balance = virtual_balance + ${amount}
    WHERE id = ${businessId}
  `;
}
