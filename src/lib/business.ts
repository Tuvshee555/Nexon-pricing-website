import { sql } from "@/lib/db";

export async function getBusinessForUser(userId: string) {
  const rows = await sql`
    SELECT id, name, status, platforms, onboarding_done, onboarding_step
    FROM businesses
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getBusinessIdForUser(userId: string) {
  const business = await getBusinessForUser(userId);
  return (business?.id as string | undefined) ?? null;
}
