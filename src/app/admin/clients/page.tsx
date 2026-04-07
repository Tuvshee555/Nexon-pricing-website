import AdminClientsList from "@/components/admin/AdminClientsList";
import { createAdminClient } from "@/lib/supabase/server";

export const revalidate = 0;

type ClientUser = {
  id: string;
  email: string;
  created_at: string;
};

type ClientBusiness = {
  id: string;
  user_id: string;
  name: string;
  status: string;
  virtual_balance: number;
  subscription_price: number;
};

type ClientCredit = {
  business_id: string;
  balance: number;
};

type ClientPlan = {
  business_id: string;
  plan_type: string;
  monthly_tier: string | null;
  monthly_price: number | null;
};

export default async function AdminClientsPage() {
  const adminClient = await createAdminClient();

  const { data: users, error: usersError } = await adminClient
    .from("users")
    .select("id, email, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (usersError) {
    throw new Error(`Failed to load clients: ${usersError.message}`);
  }

  const userIds = (users || []).map((user) => user.id);

  const businessesRes = userIds.length
    ? await adminClient
        .from("businesses")
        .select("id, user_id, name, status, virtual_balance, subscription_price")
        .in("user_id", userIds)
    : { data: [], error: null };

  if (businessesRes.error) {
    throw new Error(`Failed to load businesses: ${businessesRes.error.message}`);
  }

  const businessesByUserId = new Map<string, ClientBusiness>();
  for (const business of (businessesRes.data || []) as ClientBusiness[]) {
    if (!businessesByUserId.has(business.user_id)) {
      businessesByUserId.set(business.user_id, business);
    }
  }

  const businessIds = (businessesRes.data || []).map((business) => business.id);

  const [plansRes, creditsRes] = businessIds.length
    ? await Promise.all([
        adminClient
          .from("plans")
          .select("business_id, plan_type, monthly_tier, monthly_price")
          .in("business_id", businessIds),
        adminClient.from("credits").select("business_id, balance").in("business_id", businessIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (plansRes.error) {
    throw new Error(`Failed to load plans: ${plansRes.error.message}`);
  }

  if (creditsRes.error) {
    throw new Error(`Failed to load credits: ${creditsRes.error.message}`);
  }

  const plansByBusinessId = new Map<string, ClientPlan>();
  for (const plan of (plansRes.data || []) as ClientPlan[]) {
    if (!plansByBusinessId.has(plan.business_id)) {
      plansByBusinessId.set(plan.business_id, plan);
    }
  }

  const creditsByBusinessId = new Map<string, ClientCredit>();
  for (const credit of (creditsRes.data || []) as ClientCredit[]) {
    creditsByBusinessId.set(credit.business_id, credit);
  }

  const clients = ((users || []) as ClientUser[]).map((user) => {
    const business = businessesByUserId.get(user.id) || null;
    const plan = business ? plansByBusinessId.get(business.id) || null : null;
    const credit = business ? creditsByBusinessId.get(business.id) || null : null;

    return {
      userId: user.id,
      businessId: business?.id || null,
      name: business?.name || "",
      email: user.email,
      status: business?.status || "no_business",
      created_at: user.created_at,
      virtual_balance: business?.virtual_balance || 0,
      subscription_price: business?.subscription_price || 0,
      plans: plan
        ? {
            plan_type: plan.plan_type,
            monthly_tier: plan.monthly_tier ?? undefined,
            monthly_price: plan.monthly_price ?? undefined,
          }
        : null,
      credits: credit ? { balance: credit.balance } : null,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Клиентүүд</h1>
        <p className="text-text-secondary text-sm mt-1">{clients.length} клиент нийт</p>
      </div>

      <AdminClientsList clients={clients} />
    </div>
  );
}
