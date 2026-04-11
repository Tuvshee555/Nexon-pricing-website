"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const STEPS = [
  {
    title: "Бизнесийнхээ мэдээллийг оруулна уу",
    desc: "Bot тань таны брэндийг төлөөлж, хэрэглэгчидтэй таны өнгөнөөр харилцана.",
    illustration: (
      <div className="w-32 h-32 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    ),
  },
  {
    title: "Facebook хуудас холбох",
    desc: "Мессенжер автоматжуулалт үүсгэхийн тулд Facebook бизнес хуудсаа холбоно уу.",
    illustration: (
      <div className="w-32 h-32 rounded-full bg-[#1877F2]/30 flex items-center justify-center mx-auto mb-6">
        <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    ),
  },
  {
    title: "Instagram холбох",
    desc: "Instagram Direct мессежийг автоматаар хариулах боломжтой болно.",
    illustration: (
      <div className="w-32 h-32 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #F9CE34, #EE2A7B, #6228D7)" }}>
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
    ),
  },
  {
    title: "Bot тохируулах",
    desc: "Bot тань хэрхэн ярих вэ? Хариултын өнгө, тохиргоог тодорхойлно уу.",
    illustration: (
      <div className="w-32 h-32 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
    ),
  },
  {
    title: "Төлөвлөгөө сонгоно уу",
    desc: "Танд хамгийн тохиромжтой сонголтыг хийгээд, бүрэн идэвхжүүлнэ үү.",
    illustration: (
      <div className="w-32 h-32 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
}: Props) {
  const router = useRouter();

  const getStartStep = () => {
    if (fbConnected && initialStep) return initialStep;
    if (initialStep) return initialStep;
    if (business?.onboarding_step && business.onboarding_step > 0) return business.onboarding_step;
    return 1;
  };

  const [step, setStep] = useState(getStartStep);
  const [businessId, setBusinessId] = useState<string>(urlBusinessId || business?.id || "");
  const [pageName, setPageName] = useState("");
  const [pageId, setPageId] = useState("");
  const [instagramConnected, setInstagramConnected] = useState(false);

  useEffect(() => {
    if (fbConnected && step === 2) setStep(2);
  }, [fbConnected, step]);

  const current = STEPS[step - 1];

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] flex-col bg-gradient-to-br from-[#0F4FE8] to-[#4F46E5] p-10 relative overflow-hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-black text-sm">N</span>
          </div>
          <span className="text-lg font-black text-white tracking-tight">Nexon</span>
        </Link>

        {/* Illustration + text */}
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
          {current.illustration}
          <h2 className="text-2xl font-black text-white leading-tight mb-3">
            {current.title}
          </h2>
          <p className="text-white/65 text-sm leading-relaxed max-w-xs">
            {current.desc}
          </p>
        </div>

        {/* Back */}
        <div className="relative z-10">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Буцах
            </button>
          ) : (
            <p className="text-white/30 text-xs">
              Алхам {step} / {STEPS.length}
            </p>
          )}
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">N</span>
            </div>
            <span className="font-black text-gray-900">Nexon</span>
          </Link>
          <span className="text-xs text-gray-400">{step} / {STEPS.length}</span>
        </div>

        {/* Step progress dots */}
        <div className="flex gap-1.5 px-8 lg:px-12 pt-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i + 1 === step ? "w-8 bg-primary" : i + 1 < step ? "w-4 bg-primary/40" : "w-4 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 px-8 lg:px-16 py-8 max-w-2xl w-full mx-auto">
          {step === 1 && (
            <Step1Business
              initialName={business?.name}
              initialType={business?.business_type}
              onNext={(bizId) => { setBusinessId(bizId); setStep(2); }}
            />
          )}
          {step === 2 && (
            <Step2Facebook
              businessId={businessId}
              fbConnected={!!fbConnected}
              fbError={fbError}
              onNext={(pName, pId) => { setPageName(pName); setPageId(pId); setStep(3); }}
              onSkip={() => setStep(4)}
            />
          )}
          {step === 3 && (
            <Step3Instagram
              businessId={businessId}
              pageId={pageId}
              onNext={(igConnected) => { setInstagramConnected(igConnected); setStep(4); }}
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
      </div>
    </div>
  );
}
