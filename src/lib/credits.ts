import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Add credits (messages) to a business via direct SQL update.
 */
export async function addCredits(
  supabase: SupabaseClient,
  businessId: string,
  credits: number
) {
  const { data: cur } = await supabase
    .from("credits")
    .select("balance, total_purchased")
    .eq("business_id", businessId)
    .single();

  if (cur) {
    await supabase
      .from("credits")
      .update({
        balance: cur.balance + credits,
        total_purchased: cur.total_purchased + credits,
      })
      .eq("business_id", businessId);
  } else {
    await supabase.from("credits").insert({
      business_id: businessId,
      balance: credits,
      total_purchased: credits,
    });
  }
}

/**
 * Add to virtual balance via direct SQL update.
 */
export async function addVirtualBalance(
  supabase: SupabaseClient,
  businessId: string,
  amount: number
) {
  const { data: biz } = await supabase
    .from("businesses")
    .select("virtual_balance")
    .eq("id", businessId)
    .single();

  await supabase
    .from("businesses")
    .update({ virtual_balance: (biz?.virtual_balance || 0) + amount })
    .eq("id", businessId);
}
