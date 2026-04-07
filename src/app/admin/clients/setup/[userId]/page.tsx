import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import SetupBusinessForm from "./SetupBusinessForm";

export default async function SetupBusinessPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const existing = await sql`SELECT id FROM businesses WHERE user_id = ${userId} LIMIT 1`;
  if (existing[0]) {
    redirect(`/admin/clients/${existing[0].id as string}`);
  }

  const userRows = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;

  return <SetupBusinessForm userId={userId} email={(userRows[0]?.email as string) || ""} />;
}
