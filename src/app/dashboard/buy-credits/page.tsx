import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuyCreditsClient from "@/components/dashboard/BuyCreditsClient";

export default async function BuyCreditsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client for data fetch to bypass RLS
  const adminClient = await createAdminClient();

  const { data: business } = await adminClient
    .from("businesses")
    .select("id, name, virtual_balance, subscription_price")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/dashboard");

  const { data: plan } = await adminClient
    .from("plans")
    .select("plan_type")
    .eq("business_id", business.id)
    .single();

  return (
    <BuyCreditsClient
      businessId={business.id}
      businessName={business.name}
      planType={plan?.plan_type || "credit"}
      virtualBalance={business.virtual_balance || 0}
      subscriptionPrice={business.subscription_price || 0}
    />
  );
}
