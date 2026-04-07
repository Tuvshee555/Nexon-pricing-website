type BusinessOnboardingState = {
  id?: string | null;
  name?: string | null;
  onboarding_done?: boolean | null;
  onboarding_step?: number | null;
  bot_prompt?: string | null;
  status?: string | null;
  platforms?: string[] | null;
};

type PlatformAccountOnboardingState = {
  page_id?: string | null;
  external_id?: string | null;
  page_access_token?: string | null;
} | null;

export function hasPlatformConnection(
  business?: BusinessOnboardingState | null,
  platformAccounts: PlatformAccountOnboardingState[] = []
) {
  const hasSelfServiceAccount = platformAccounts.some(
    (account) =>
      !!account?.page_access_token?.trim() ||
      !!account?.page_id?.trim() ||
      !!account?.external_id?.trim()
  );

  return hasSelfServiceAccount || (business?.platforms?.length ?? 0) > 0;
}

export function isMigratedIncompleteBusiness(
  business?: BusinessOnboardingState | null,
  platformAccounts: PlatformAccountOnboardingState[] = []
) {
  if (!business?.onboarding_done) return false;

  const hasPrompt = !!business.bot_prompt?.trim();
  const hasConnectedPlatform = hasPlatformConnection(business, platformAccounts);

  // The self-service migration marked all old rows as complete. If a row is
  // still paused and missing the core bot/platform setup, treat it as a
  // placeholder so the client can finish onboarding without admin help.
  return business.status === "paused" && (!hasPrompt || !hasConnectedPlatform);
}

export function needsOnboarding(
  business?: BusinessOnboardingState | null,
  platformAccounts: PlatformAccountOnboardingState[] = []
) {
  return (
    !business ||
    !business.onboarding_done ||
    isMigratedIncompleteBusiness(business, platformAccounts)
  );
}

export function getOnboardingStartStep(
  business?: BusinessOnboardingState | null,
  platformAccounts: PlatformAccountOnboardingState[] = []
) {
  if (!business?.name?.trim() || isMigratedIncompleteBusiness(business, platformAccounts)) {
    return 1;
  }

  const savedStep = business.onboarding_step ?? 1;
  if (savedStep < 1 || savedStep > 5) return 1;

  return savedStep;
}
