import AdminClientsList from "@/components/admin/AdminClientsList";
import { sql } from "@/lib/db";
import { MONTHLY_PLANS } from "@/types";

export const revalidate = 0;

export default async function AdminClientsPage() {
  const users = (await sql`
    SELECT id, email, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC
  `) as Array<{ id: string; email: string; created_at: string }>;

  if (!users.length) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Клиентүүд</h1>
          <p className="text-text-secondary text-sm mt-1">0 клиент нийт</p>
        </div>
        <AdminClientsList clients={[]} />
      </div>
    );
  }

  const userIds = users.map((u) => u.id as string);

  const businesses = userIds.length
    ? ((await sql`
        SELECT id, user_id, name, status, virtual_balance, subscription_price
        FROM businesses WHERE user_id = ANY(${userIds}::uuid[])
      `) as Array<{
        id: string;
        user_id: string;
        name: string;
        status: string;
        virtual_balance: number;
        subscription_price: number;
      }>)
    : [];

  const businessesByUserId = new Map<string, typeof businesses[0]>();
  for (const b of businesses) {
    if (!businessesByUserId.has(b.user_id as string)) {
      businessesByUserId.set(b.user_id as string, b);
    }
  }

  const businessIds = businesses.map((b) => b.id as string);

  const plans = businessIds.length
    ? ((await sql`SELECT business_id, plan_type, monthly_tier, monthly_price FROM plans WHERE business_id = ANY(${businessIds}::uuid[])`) as Array<{
        business_id: string;
        plan_type: string;
        monthly_tier?: string;
        monthly_price?: number;
      }>)
    : [];

  const plansByBusinessId = new Map<string, typeof plans[0]>();
  for (const p of plans) {
    if (!plansByBusinessId.has(p.business_id as string)) {
      plansByBusinessId.set(p.business_id as string, p);
    }
  }

  const clients = users.map((user) => {
    const business = businessesByUserId.get(user.id as string) ?? null;
    const plan = business ? plansByBusinessId.get(business.id as string) ?? null : null;

    const monthlyPlan = plan?.monthly_tier
      ? MONTHLY_PLANS.find((p) => p.tier === plan.monthly_tier) ?? null
      : null;

    return {
      userId: user.id as string,
      businessId: (business?.id as string) || null,
      name: (business?.name as string) || "",
      email: user.email as string,
      status: (business?.status as string) || "no_business",
      created_at: user.created_at as string,
      virtual_balance: (business?.virtual_balance as number) || 0,
      subscription_price: (business?.subscription_price as number) || 0,
      plans: plan
        ? {
            plan_type: plan.plan_type as string,
            monthly_tier: (plan.monthly_tier as string | undefined) ?? undefined,
            monthly_price: (plan.monthly_price as number | undefined) ?? undefined,
            nameMn: monthlyPlan?.nameMn,
          }
        : null,
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
