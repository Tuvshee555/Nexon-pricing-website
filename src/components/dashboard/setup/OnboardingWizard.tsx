"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Step1Business from "./steps/Step1Business";
import Step2Facebook from "./steps/Step2Facebook";
import Step3Instagram from "./steps/Step3Instagram";
import Step4BotConfig from "./steps/Step4BotConfig";
import Step5Plan from "./steps/Step5Plan";

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
}

const STEP_LABELS = [
  "Бизнес",
  "Facebook холболт",
  "Instagram",
  "Bot тохиргоо",
  "Төлөвлөгөө",
];

export default function OnboardingWizard({
  business,
  initialStep,
  fbConnected,
  urlBusinessId,
  fbError,
}: Props) {
  const router = useRouter();

  // Determine starting step
  const getStartStep = () => {
    if (fbConnected && initialStep) return initialStep;
    if (initialStep) return initialStep;
    if (business?.onboarding_step && business.onboarding_step > 0) {
      return business.onboarding_step;
    }
    return 1;
  };

  const [step, setStep] = useState(getStartStep);
  const [businessId, setBusinessId] = useState<string>(
    urlBusinessId || business?.id || ""
  );
  const [pageName, setPageName] = useState("");
  const [pageId, setPageId] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);

  // Auto-advance if returning from Facebook OAuth
  useEffect(() => {
    if (fbConnected && step === 2) {
      setStep(2); // Stay on step 2 to show page picker
    }
  }, [fbConnected, step]);

  const progressPct = ((step - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Bot суурилуулах</h1>
        <p className="text-text-secondary text-sm mt-1">
          Алхам {step} / {STEP_LABELS.length}: {STEP_LABELS[step - 1]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted mb-2">
          {STEP_LABELS.map((label, i) => (
            <span
              key={i}
              className={`hidden sm:block ${i + 1 <= step ? "text-primary font-medium" : ""}`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* Mobile step indicators */}
        <div className="flex justify-between mt-2 sm:hidden">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i + 1 <= step ? "bg-primary" : "bg-surface-2"}`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card p-6 sm:p-8">
        {step === 1 && (
          <Step1Business
            initialName={business?.name}
            initialType={business?.business_type}
            onNext={(bizId) => {
              setBusinessId(bizId);
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
            onComplete={() => router.push("/dashboard?welcome=1")}
            onBack={() => setStep(4)}
          />
        )}
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i + 1 === step
                ? "bg-primary w-6"
                : i + 1 < step
                ? "bg-primary/50"
                : "bg-surface-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
