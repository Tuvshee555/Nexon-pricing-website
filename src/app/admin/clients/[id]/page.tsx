import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminClientDetail from "@/components/admin/AdminClientDetail";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select(`
      *,
      users(id, email),
      plans(*),
      credits(*),
      platform_accounts(*)
    `)
    .eq("id", id)
    .single();

  if (!business) notFound();

  const { data: messageLogs } = await supabase
    .from("message_logs")
    .select("*")
    .eq("business_id", id)
    .order("logged_at", { ascending: false })
    .limit(20);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("business_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AdminClientDetail
      business={business}
      logs={messageLogs || []}
      transactions={transactions || []}
    />
  );
}
