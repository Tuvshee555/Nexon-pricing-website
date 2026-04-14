"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, MonthlyTier, SETUP_FEE } from "@/types";
import { trackEvent } from "@/lib/analytics";

const planDetails: Record<
  MonthlyTier,
  {
    audienceMn: string;
    audienceEn: string;
    featuresMn: string[];
    featuresEn: string[];
  }
> = {
  free: {
    audienceMn: "Туршиж үзэхэд",
    audienceEn: "Just getting started",
    featuresMn: [
      "1 суваг (Instagram эсвэл Messenger)",
      "Keyword trigger автоматжуулалт",
      "Үндсэн dashboard",
      "Nexon Chat брэндинг орно",
    ],
    featuresEn: [
      "1 channel (Instagram or Messenger)",
      "Keyword trigger automation",
      "Basic dashboard",
      "Nexon Chat branding included",
    ],
  },
  starter: {
    audienceMn: "Эхлэж байгаа жижиг бизнест",
    audienceEn: "For small businesses getting started",
    featuresMn: [
      "2 суваг (Instagram + Messenger)",
      "AI автомат хариулт",
      "Үндсэн sequence дусаах",
      "Keyword triggers",
      "Nexon Chat брэндинг байхгүй",
    ],
    featuresEn: [
      "2 channels (Instagram + Messenger)",
      "AI auto-replies",
      "Basic drip sequences",
      "Keyword triggers",
      "No Nexon Chat branding",
    ],
  },
  growth: {
    audienceMn: "Тогтмол чат авдаг бизнест",
    audienceEn: "For businesses with steady daily messages",
    featuresMn: [
      "2 суваг (Instagram + Messenger)",
      "Broadcast илгээлт",
      "Дэвшилтэт автоматжуулалт",
      "2 хэрэглэгчийн эрх",
      "AI + keyword triggers",
      "Nexon Chat брэндинг байхгүй",
    ],
    featuresEn: [
      "2 channels (Instagram + Messenger)",
      "Broadcasts",
      "Advanced automations",
      "2 user seats",
      "AI + keyword triggers",
      "No Nexon Chat branding",
    ],
  },
  pro: {
    audienceMn: "Борлуулалтын идэвхтэй багт",
    audienceEn: "For active sales teams",
    featuresMn: [
      "Хязгааргүй суваг",
      "Бүх зүйл + Priority дэмжлэг",
      "5 хэрэглэгчийн эрх",
      "Дэлгэрэнгүй аналитик",
      "Sequence + Flow builder",
      "Nexon Chat брэндинг байхгүй",
    ],
    featuresEn: [
      "Unlimited channels",
      "Everything + priority support",
      "5 user seats",
      "Advanced analytics",
      "Sequences + Flow builder",
      "No Nexon Chat branding",
    ],
  },
  enterprise: {
    audienceMn: "Томоохон байгууллагад",
    audienceEn: "For large organizations",
    featuresMn: [
      "Хязгааргүй суваг",
      "Custom workflow дизайн",
      "Тусгай onboarding",
      "Хамгийн өндөр дэмжлэг",
      "Nexon Chat брэндинг байхгүй",
    ],
    featuresEn: [
      "Unlimited channels",
      "Custom workflow design",
      "Dedicated onboarding",
      "Highest priority support",
      "No Nexon Chat branding",
    ],
  },
};

export default function PricingSection() {
  const { lang, t } = useLanguage();

  const subtitle =
    lang === "mn"
      ? "Үнэгүй эхэлж, бизнесийн өсөлтөөрөө дагаад шинэчил."
      : "Start free, upgrade as your business grows.";

  return (
    <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label justify-center">{t("pricing_title")}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {lang === "mn"
              ? "Таны бизнест тохирсон багцыг сонго"
              : "Pick the plan that fits your business"}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{subtitle}</p>

          <div className="mt-6 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            {lang === "mn"
              ? `Нэг удаагийн setup fee: ${SETUP_FEE.toLocaleString()}₮ (Starter болон дээш)`
              : `One-time setup fee: ${SETUP_FEE.toLocaleString()}₮ (Starter and above)`}
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {MONTHLY_PLANS.map((plan) => {
            const details = planDetails[plan.tier];
            const audience = lang === "mn" ? details.audienceMn : details.audienceEn;
            const features = lang === "mn" ? details.featuresMn : details.featuresEn;
            const planName = lang === "mn" ? plan.nameMn : plan.nameEn;
            const contactLabel =
              lang === "mn"
                ? `${plan.contactLimit.toLocaleString()} contact/сар`
                : `${plan.contactLimit.toLocaleString()} contacts/month`;

            return (
              <div
                key={plan.tier}
                className={`surface-panel flex rounded-[30px] p-1 ${plan.popular ? "ring-2 ring-slate-900" : ""}`}
              >
                <div className="flex w-full flex-col rounded-[26px] bg-white p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{planName}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{audience}</p>
                    </div>
                    {plan.popular && (
                      <div className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap">
                        {t("pricing_popular")}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {plan.tier === "free" ? (
                      <div>
                        <p className="text-3xl font-black text-slate-900">0₮</p>
                        <p className="mt-1.5 text-xs text-slate-500">{contactLabel}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-end gap-1.5">
                          <span className="text-3xl font-black text-slate-900">{plan.price.toLocaleString()}</span>
                          <span className="pb-1 text-xs text-slate-400">₮/{t("pricing_per_month")}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">{contactLabel}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-2.5 flex-1">
                    {features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary">
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="leading-5">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/register?plan=${plan.tier}&source=pricing`}
                      onClick={() =>
                        trackEvent("pricing_plan_cta_click", {
                          tier: plan.tier,
                          amount: plan.price,
                          source: "pricing_section",
                        })
                      }
                      className={`block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                        plan.popular
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : plan.tier === "free"
                          ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {plan.tier === "free"
                        ? lang === "mn" ? "Үнэгүй эхлэх" : "Get started free"
                        : t("pricing_cta")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
