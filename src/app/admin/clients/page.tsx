import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AdminClientsList from "@/components/admin/AdminClientsList";

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("businesses")
    .select(`
      *,
      users(email),
      plans(plan_type, monthly_tier, monthly_price),
      credits(balance)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Клиентүүд</h1>
          <p className="text-text-secondary text-sm mt-1">
            {clients?.length || 0} клиент нийт
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

      <AdminClientsList clients={clients || []} />
    </div>
  );
}
