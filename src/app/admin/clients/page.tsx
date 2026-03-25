import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import AdminClientsList from "@/components/admin/AdminClientsList";

export default async function AdminClientsPage() {
  const adminClient = await createAdminClient();

  // Fetch ALL client users — including those without a business
  const { data: clientUsers } = await adminClient
    .from("users")
    .select("id, email, role, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  // Fetch all businesses with plans and credits
  const { data: businesses } = await adminClient
    .from("businesses")
    .select(`
      id, name, status, created_at, user_id,
      virtual_balance, subscription_price,
      plans(plan_type, monthly_tier, monthly_price),
      credits(balance)
    `)
    .order("created_at", { ascending: false });

  // Merge: map each client user to their business (if any)
  // Supabase returns joined tables as arrays — extract first element
  const merged = (clientUsers || []).map((user) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const biz = (businesses || []).find((b: any) => b.user_id === user.id) as any;
    const plans = biz?.plans;
    const credits = biz?.credits;
    return {
      userId: user.id,
      businessId: biz?.id || null,
      name: biz?.name || "",
      email: user.email,
      status: biz?.status || "no_business",
      created_at: biz?.created_at || user.created_at,
      virtual_balance: biz?.virtual_balance || 0,
      subscription_price: biz?.subscription_price || 0,
      plans: Array.isArray(plans) ? plans[0] || null : plans || null,
      credits: Array.isArray(credits) ? credits[0] || null : credits || null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Клиентүүд</h1>
          <p className="text-text-secondary text-sm mt-1">
            {merged.length} клиент нийт
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Клиент нэмэх
        </Link>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AdminClientsList clients={merged as any} />
    </div>
  );
}
