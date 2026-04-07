import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import OnboardingWizard from "@/components/dashboard/setup/OnboardingWizard";
import { getOnboardingStartStep, needsOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; fb_connected?: string; businessId?: string; error?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = await createAdminClient();
  const { data: business } = await adminClient
    .from("businesses")
    .select("id, onboarding_done, onboarding_step, name, bot_name, bot_prompt, welcome_message, bot_tone, business_type, status, platforms")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: platformAccounts } = business
    ? await adminClient
        .from("platform_accounts")
        .select("page_id, external_id, page_access_token")
        .eq("business_id", business.id)
    : { data: [] };

  // If onboarding is complete, redirect to dashboard
  if (!needsOnboarding(business, platformAccounts || [])) {
    redirect("/dashboard");
  }

  const resumeStep = getOnboardingStartStep(business, platformAccounts || []);

  return (
    <OnboardingWizard
      business={business ? { ...business, onboarding_step: resumeStep } : null}
      initialStep={params.step ? parseInt(params.step) : resumeStep}
      fbConnected={params.fb_connected === "1"}
      urlBusinessId={params.businessId}
      fbError={params.error}
    />
  );
}
