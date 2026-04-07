import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import BuyCreditsClient from "@/components/dashboard/BuyCreditsClient";

export default async function BuyCreditsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const businesses = await sql`
    SELECT id, name, virtual_balance, subscription_price
    FROM businesses WHERE user_id = ${userId} LIMIT 1
  `;
  const business = businesses[0] ?? null;
  if (!business) redirect("/dashboard");

  const plans = await sql`
    SELECT plan_type FROM plans WHERE business_id = ${business.id as string} LIMIT 1
  `;
  const plan = plans[0] ?? null;

  return (
    <BuyCreditsClient
      businessId={business.id as string}
      businessName={business.name as string}
      planType={(plan?.plan_type as string) || "credit"}
      virtualBalance={(business.virtual_balance as number) || 0}
      subscriptionPrice={(business.subscription_price as number) || 0}
    />
  );
}
