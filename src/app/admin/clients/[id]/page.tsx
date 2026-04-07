import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import AdminClientDetail from "@/components/admin/AdminClientDetail";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const businesses = await sql`SELECT * FROM businesses WHERE id = ${id}`;
  const business = businesses[0] ?? null;
  if (!business) notFound();

  const [userRows, planRows, creditRows, platformRows, logsRows, txRows] = await Promise.all([
    sql`SELECT id, email FROM users WHERE id = ${business.user_id as string} LIMIT 1`,
    sql`SELECT * FROM plans WHERE business_id = ${id} LIMIT 1`,
    sql`SELECT * FROM credits WHERE business_id = ${id} LIMIT 1`,
    sql`SELECT * FROM platform_accounts WHERE business_id = ${id}`,
    sql`SELECT * FROM message_logs WHERE business_id = ${id} ORDER BY logged_at DESC LIMIT 20`,
    sql`SELECT * FROM transactions WHERE business_id = ${id} ORDER BY created_at DESC LIMIT 20`,
  ]);

  const businessData = {
    ...business,
    users: userRows[0] || null,
    plans: planRows[0] || null,
    credits: creditRows[0] || null,
    platform_accounts: platformRows,
  } as unknown as Parameters<typeof AdminClientDetail>[0]["business"];

  type DetailProps = Parameters<typeof AdminClientDetail>[0];
  return (
    <AdminClientDetail
      business={businessData}
      logs={logsRows as unknown as DetailProps["logs"]}
      transactions={txRows as unknown as DetailProps["transactions"]}
    />
  );
}
