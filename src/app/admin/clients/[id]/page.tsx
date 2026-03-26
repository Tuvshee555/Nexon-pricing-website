import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminClientDetail from "@/components/admin/AdminClientDetail";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = await createAdminClient();

  // Fetch business separately to avoid FK join issues
  const { data: business } = await adminClient
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (!business) notFound();

  // Fetch related data separately
  const [userRes, planRes, creditRes, platformRes, logsRes, txRes] = await Promise.all([
    adminClient.from("users").select("id, email").eq("id", business.user_id).single(),
    adminClient.from("plans").select("*").eq("business_id", id).single(),
    adminClient.from("credits").select("*").eq("business_id", id).single(),
    adminClient.from("platform_accounts").select("*").eq("business_id", id),
    adminClient.from("message_logs").select("*").eq("business_id", id).order("logged_at", { ascending: false }).limit(20),
    adminClient.from("transactions").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const businessData = {
    ...business,
    users: userRes.data || null,
    plans: planRes.data || null,
    credits: creditRes.data || null,
    platform_accounts: platformRes.data || [],
  };

  return (
    <AdminClientDetail
      business={businessData}
      logs={logsRes.data || []}
      transactions={txRes.data || []}
    />
  );
}
