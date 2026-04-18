import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import BotConfigEditor from "@/components/dashboard/bot/BotConfigEditor";
import { TelegramBotSection, NotificationSettingsSection, WhatsAppSection } from "@/components/dashboard/settings/TelegramSettings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const businesses = await sql`
    SELECT id, name, bot_name, bot_prompt, knowledge_json, welcome_message, bot_tone, status, platforms, ai_agent_mode, story_reply_auto_dm
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
        <WhatsAppSection />
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
          aiAgentMode={Boolean(business.ai_agent_mode)}
          storyReplyAutoDm={(business.story_reply_auto_dm as string) || ""}
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

      {/* Website Widget Embed Code */}
      <div className="max-w-4xl">
        <WidgetEmbedSection businessId={business.id as string} />
      </div>
    </div>
  );
}

function WidgetEmbedSection({ businessId }: { businessId: string }) {
  const appUrl = process.env.NEXTAUTH_URL || "https://your-nexon-domain.com";
  const snippet = `<script>
  window.NexonBusinessId = "${businessId}";
  window.NexonWidgetBase = "${appUrl}";
</script>
<script src="${appUrl}/widget.js" async></script>`;

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="section-label">Website Widget</p>
      <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
        Add a chat bubble to your website
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Paste this snippet before the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">&lt;/body&gt;</code> tag on any page.
        Visitors can chat and their messages are handled by your AI bot.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 px-5 py-4 text-xs text-emerald-300 leading-6 font-mono whitespace-pre-wrap">
        {snippet}
      </pre>
    </section>
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
