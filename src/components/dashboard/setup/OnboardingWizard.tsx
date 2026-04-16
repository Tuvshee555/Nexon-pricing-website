"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Step1Business from "./steps/Step1Business";
import Step2Facebook from "./steps/Step2Facebook";
import Step3Instagram from "./steps/Step3Instagram";
import Step4BotConfig from "./steps/Step4BotConfig";
import Step5Plan from "./steps/Step5Plan";
import { useLanguage } from "@/contexts/LanguageContext";

interface BusinessData {
  id?: string;
  onboarding_step?: number;
  name?: string;
  bot_name?: string;
  bot_prompt?: string;
  welcome_message?: string;
  bot_tone?: string;
  business_type?: string;
}

interface Props {
  business: BusinessData | null;
  initialStep?: number;
  fbConnected?: boolean;
  urlBusinessId?: string;
  fbError?: string;
  initialMonthlyTier?: string;
}

const STEP_KEYS = [
  { titleKey: "setup_step1_title", descKey: "setup_step1_desc" },
  { titleKey: "setup_step2_title", descKey: "setup_step2_desc" },
  { titleKey: "setup_step3_title", descKey: "setup_step3_desc" },
  { titleKey: "setup_step4_title", descKey: "setup_step4_desc" },
  { titleKey: "setup_step5_title", descKey: "setup_step5_desc" },
] as const;

const STEPS = [
  {
    title: "Tell us about the business",
    desc: "We use this to shape the bot voice, prompt, and default setup.",
    illustration: (
      <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-white/20">
        <svg className="h-16 w-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    ),
  },
  {
    title: "Connect Facebook",
    desc: "This unlocks Messenger automation and lets us load your pages.",
    illustration: (
      <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#1877F2]/30">
        <svg className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    ),
  },
  {
    title: "Connect Instagram",
    desc: "Let Instagram DMs flow into the same experience as Messenger.",
    illustration: (
      <div
        className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl"
        style={{ background: "linear-gradient(135deg, #F9CE34, #EE2A7B, #6228D7)" }}
      >
        <svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
    ),
  },
  {
    title: "Tune the bot",
    desc: "Set the tone, welcome message, and prompt structure before launch.",
    illustration: (
      <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-white/20">
        <svg className="h-16 w-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
    ),
  },
  {
    title: "Pick a plan",
    desc: "Choose the tier that matches your volume and team size.",
    illustration: (
      <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-white/20">
        <svg className="h-16 w-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
    ),
  },
];

export default function OnboardingWizard({
  business,
  initialStep,
  fbConnected,
  urlBusinessId,
  fbError,
  initialMonthlyTier,
}: Props) {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const getStartStep = () => {
    if (fbConnected && initialStep) return initialStep;
    if (initialStep) return initialStep;
    if (business?.onboarding_step && business.onboarding_step > 0) return business.onboarding_step;
    return 1;
  };

  const [step, setStep] = useState(getStartStep);
  const [businessId, setBusinessId] = useState<string>(urlBusinessId || business?.id || "");
  const [businessType, setBusinessType] = useState<string>(business?.business_type || "");
  const [pageName, setPageName] = useState("");
  const [pageId, setPageId] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);

  useEffect(() => {
    if (fbConnected && step === 2) setStep(2);
  }, [fbConnected, step]);

  const current = STEPS[step - 1];
  const currentKeys = STEP_KEYS[step - 1];

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0F4FE8] to-[#4F46E5] p-10 lg:flex lg:w-[42%] flex-col">
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <span className="text-sm font-black text-white">N</span>
          </div>
          <span className="text-lg font-black tracking-tight text-white">Nexon</span>
        </Link>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          {current.illustration}
          <h2 className="mb-3 text-2xl font-black leading-tight text-white">{t(currentKeys.titleKey)}</h2>
          <p className="max-w-xs text-sm leading-relaxed text-white/65">{t(currentKeys.descKey)}</p>
        </div>

        <div className="relative z-10">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("setup_back")}
            </button>
          ) : (
            <p className="text-xs text-white/30">
              {lang === "mn" ? "Алхам" : "Step"} {step} / {STEPS.length}
            </p>
          )}
        </div>

        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-48 w-48 translate-y-1/2 -translate-x-1/2 rounded-full bg-white/5" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
              <span className="text-xs font-black text-white">N</span>
            </div>
            <span className="font-black text-gray-900">Nexon</span>
          </Link>
          <span className="text-xs text-gray-400">
            {step} / {STEPS.length}
          </span>
        </div>

        <div className="flex gap-1.5 px-8 pt-8 lg:px-12">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i + 1 === step ? "w-8 bg-slate-900" : i + 1 < step ? "w-4 bg-slate-400" : "w-4 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-8 py-8 lg:px-16">
          <div className="mb-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="section-label">{t("setup_guide")}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {t("setup_guide_desc")}
            </p>
          </div>

          {step === 1 && (
            <Step1Business
              initialName={business?.name}
              initialType={business?.business_type}
              onNext={(bizId, bizType) => {
                setBusinessId(bizId);
                setBusinessType(bizType);
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <Step2Facebook
              businessId={businessId}
              fbConnected={!!fbConnected}
              fbError={fbError}
              onNext={(pName, pId) => {
                setPageName(pName);
                setPageId(pId);
                setStep(3);
              }}
              onSkip={() => setStep(4)}
            />
          )}
          {step === 3 && (
            <Step3Instagram
              businessId={businessId}
              pageId={pageId}
              onNext={(igConnected) => {
                setInstagramConnected(igConnected);
                setStep(4);
              }}
              onSkip={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4BotConfig
              businessId={businessId}
              businessType={businessType}
              initialPrompt={business?.bot_prompt}
              initialBotName={business?.bot_name}
              initialWelcome={business?.welcome_message}
              initialTone={business?.bot_tone}
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <Step5Plan
              businessId={businessId}
              pageName={pageName}
              instagramConnected={instagramConnected}
              initialMonthlyTier={initialMonthlyTier}
              onComplete={() => router.push("/dashboard?welcome=1")}
              onBack={() => setStep(4)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
