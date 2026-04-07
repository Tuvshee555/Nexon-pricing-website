import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import BotConfigEditor from "@/components/dashboard/bot/BotConfigEditor";
import type ConversationListType from "@/components/dashboard/bot/ConversationList";
import ConversationList from "@/components/dashboard/bot/ConversationList";

export const dynamic = "force-dynamic";

export default async function BotPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const businesses = await sql`
    SELECT id, name, bot_name, bot_prompt, welcome_message, bot_tone, status, platforms
    FROM businesses WHERE user_id = ${userId} LIMIT 1
  `;
  const business = businesses[0] ?? null;
  if (!business) redirect("/dashboard");

  const [platformAccounts, threads] = await Promise.all([
    sql`SELECT id, platform, page_name, page_id, instagram_account_id FROM platform_accounts WHERE business_id = ${business.id as string}`,
    sql`SELECT id, platform, sender_id, messages, last_message_at FROM conversation_threads WHERE business_id = ${business.id as string} ORDER BY last_message_at DESC LIMIT 20`,
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Bot Тохиргоо</h1>
        <p className="text-text-secondary text-sm mt-1">{business.name as string}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotConfigEditor
          businessId={business.id as string}
          botName={(business.bot_name as string) || "Nexon Bot"}
          botPrompt={(business.bot_prompt as string) || ""}
          welcomeMessage={(business.welcome_message as string) || ""}
          botTone={(business.bot_tone as string) || "friendly"}
          status={business.status as string}
          platformAccounts={platformAccounts as { id: string; platform: string; page_name?: string; page_id?: string; instagram_account_id?: string }[]}
        />
        <ConversationList threads={threads as Parameters<typeof ConversationListType>[0]["threads"]} />
      </div>
    </div>
  );
}
