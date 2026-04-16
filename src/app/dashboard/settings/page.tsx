import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import BotConfigEditor from "@/components/dashboard/bot/BotConfigEditor";
import { TelegramBotSection, NotificationSettingsSection } from "@/components/dashboard/settings/TelegramSettings";
import Link from "next/link";

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
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Settings</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Configure the bot, channels, and knowledge base
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              This is where the product gets its personality and guardrails. Keep the bot voice sharp, the knowledge base current, and the connected channels healthy.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/setup" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Revisit setup
            </Link>
            <Link href="/dashboard/inbox" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Open inbox
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <SummaryCard label="Bot status" value={String(business.status || "unknown")} />
          <SummaryCard label="Connected channels" value={String(platformAccounts.length)} />
          <SummaryCard label="Knowledge base" value={business.knowledge_json ? "Loaded" : "Empty"} />
        </div>
      </section>

      <div className="max-w-4xl space-y-6">
        <TelegramBotSection />
        <NotificationSettingsSection />
      </div>

      <div className="max-w-4xl">
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-black tracking-[-0.02em] text-slate-950">{value}</p>
    </div>
  );
}
