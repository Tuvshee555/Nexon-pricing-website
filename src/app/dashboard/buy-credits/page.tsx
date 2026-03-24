import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuyCreditsClient from "@/components/dashboard/BuyCreditsClient";

export default async function BuyCreditsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/dashboard");

  return <BuyCreditsClient businessId={business.id} businessName={business.name} />;
}
