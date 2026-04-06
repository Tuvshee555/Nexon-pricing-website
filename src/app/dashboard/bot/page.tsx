import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import BotConfigEditor from "@/components/dashboard/bot/BotConfigEditor";
import ConversationList from "@/components/dashboard/bot/ConversationList";

export const dynamic = "force-dynamic";

export default async function BotPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = await createAdminClient();

  const { data: business } = await adminClient
    .from("businesses")
    .select("id, name, bot_name, bot_prompt, welcome_message, bot_tone, status, platforms")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/dashboard");

  // Fetch platform accounts
  const { data: platformAccounts } = await adminClient
    .from("platform_accounts")
    .select("id, platform, page_name, page_id, instagram_account_id")
    .eq("business_id", business.id);

  // Fetch recent conversation threads
  const { data: threads } = await adminClient
    .from("conversation_threads")
    .select("id, platform, sender_id, messages, last_message_at")
    .eq("business_id", business.id)
    .order("last_message_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Bot Тохиргоо</h1>
        <p className="text-text-secondary text-sm mt-1">{business.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotConfigEditor
          businessId={business.id}
          botName={business.bot_name || "Nexon Bot"}
          botPrompt={business.bot_prompt || ""}
          welcomeMessage={business.welcome_message || ""}
          botTone={business.bot_tone || "friendly"}
          status={business.status}
          platformAccounts={platformAccounts || []}
        />
        <ConversationList threads={threads || []} />
      </div>
    </div>
  );
}
