import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import BotConfigEditor from "@/components/dashboard/bot/BotConfigEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const businesses = await sql`
    SELECT id, name, bot_name, bot_prompt, knowledge_json, welcome_message, bot_tone, status, platforms
    FROM businesses WHERE user_id = ${userId} LIMIT 1
  `;
  const business = businesses[0] ?? null;
  if (!business) redirect("/dashboard");

  const platformAccounts = await sql`
    SELECT id, platform, page_name, page_id, instagram_account_id
    FROM platform_accounts WHERE business_id = ${business.id as string}
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Bot configuration, channels, and account settings</p>
        </div>

        <BotConfigEditor
          businessId={business.id as string}
          botName={(business.bot_name as string) || "Nexon Bot"}
          botPrompt={(business.bot_prompt as string) || ""}
          welcomeMessage={(business.welcome_message as string) || ""}
          botTone={(business.bot_tone as string) || "friendly"}
          status={business.status as string}
          knowledgeLoaded={!!business.knowledge_json}
          platformAccounts={
            platformAccounts as {
              id: string;
              platform: string;
              page_name?: string;
              page_id?: string;
              instagram_account_id?: string;
            }[]
          }
        />
      </div>
    </div>
  );
}
