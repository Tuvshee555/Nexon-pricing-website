import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { sql } from "@/lib/db";
import OnboardingWizard from "@/components/dashboard/setup/OnboardingWizard";
import { getOnboardingStartStep, needsOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; fb_connected?: string; businessId?: string; error?: string; plan?: string }>;
}) {
  const params = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const businesses = await sql`
    SELECT id, onboarding_done, onboarding_step, name, bot_name, bot_prompt,
           welcome_message, bot_tone, business_type, status, platforms
    FROM businesses WHERE user_id = ${userId}
  `;
  const business = businesses[0] ?? null;

  const platformAccounts = business
    ? await sql`
        SELECT page_id, external_id, page_access_token
        FROM platform_accounts WHERE business_id = ${business.id as string}
      `
    : [];

  if (!needsOnboarding(business, platformAccounts)) {
    redirect("/dashboard");
  }

  const resumeStep = getOnboardingStartStep(business, platformAccounts);

  return (
    <OnboardingWizard
      business={business ? { ...business, onboarding_step: resumeStep } : null}
      initialStep={params.step ? parseInt(params.step) : resumeStep}
      fbConnected={params.fb_connected === "1"}
      urlBusinessId={params.businessId}
      fbError={params.error}
      initialMonthlyTier={params.plan}
    />
  );
}
