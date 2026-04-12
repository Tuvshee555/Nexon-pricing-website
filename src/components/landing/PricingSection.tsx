"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, MonthlyTier, SETUP_FEE } from "@/types";
import { trackEvent } from "@/lib/analytics";

const planDetails: Record<
  MonthlyTier,
  { audienceMn: string; audienceEn: string; featuresMn: string[]; featuresEn: string[] }
> = {
  basic: {
    audienceMn: "Эхэлж байгаа жижиг бизнест",
    audienceEn: "For small businesses getting started",
    featuresMn: ["Instagram & Messenger холболт", "FAQ automation", "AI bot үндсэн тохиргоо", "Usage dashboard"],
    featuresEn: ["Instagram & Messenger connection", "FAQ automation", "Core AI setup", "Usage dashboard"],
  },
  standard: {
    audienceMn: "Өдөр бүр тогтмол chat авдаг бизнест",
    audienceEn: "For businesses with steady daily message volume",
    featuresMn: ["Higher message capacity", "Lead routing flow", "Telegram notifications", "Active monitoring"],
    featuresEn: ["Higher message capacity", "Lead routing flow", "Telegram notifications", "Active monitoring"],
  },
  premium: {
    audienceMn: "Илүү ачаалалтай борлуулалтын багт",
    audienceEn: "For teams handling heavier sales volume",
    featuresMn: ["Order & FAQ flows", "Priority support", "Extended use cases", "Standard-ийн бүх боломж"],
    featuresEn: ["Order & FAQ flows", "Priority support", "Extended use cases", "Everything in Standard"],
  },
  enterprise: {
    audienceMn: "Custom rollout хэрэгтэй байгууллагад",
    audienceEn: "For organizations that need a custom rollout",
    featuresMn: ["Unlimited messages", "Custom workflow design", "Advanced integrations", "Collaborative onboarding"],
    featuresEn: ["Unlimited messages", "Custom workflow design", "Advanced integrations", "Collaborative onboarding"],
  },
};

const creditPacks = [
  { id: "starter", credits: 5000, price: 49000, popular: false },
  { id: "growth", credits: 15000, price: 129000, popular: true },
  { id: "scale", credits: 30000, price: 239000, popular: false },
];

export default function PricingSection() {
  const { lang, t } = useLanguage();
  const [billingView, setBillingView] = useState<"monthly" | "credits">("monthly");

  const subtitle =
    lang === "mn"
      ? "Сарын багц сонгоод эхэл, дараа нь dashboard-оос credit нэмэх боломжтой."
      : "Start with a monthly plan, then top up credits anytime from your dashboard.";

  return (
    <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label justify-center">{t("pricing_title")}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {lang === "mn" ? "Таны inbox-ийн ачаалалд таарсан төлөвлөгөөг сонго" : "Pick the plan that matches your inbox volume"}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{subtitle}</p>

          <div className="mt-6 flex items-center justify-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
              <button
                onClick={() => {
                  setBillingView("monthly");
                  trackEvent("pricing_view_changed", { view: "monthly" });
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  billingView === "monthly" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("pricing_monthly")}
              </button>
              <button
                onClick={() => {
                  setBillingView("credits");
                  trackEvent("pricing_view_changed", { view: "credits" });
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  billingView === "credits" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("pricing_credits")}
              </button>
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            {lang === "mn" ? `Нэг удаагийн setup fee: ${SETUP_FEE.toLocaleString()}₮` : `One-time setup fee: ${SETUP_FEE.toLocaleString()}₮`}
          </div>
        </div>

        {billingView === "monthly" ? (
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {MONTHLY_PLANS.map((plan) => {
              const details = planDetails[plan.tier];
              const audience = lang === "mn" ? details.audienceMn : details.audienceEn;
              const features = lang === "mn" ? details.featuresMn : details.featuresEn;
              const planName = lang === "mn" ? plan.nameMn : plan.nameEn;

              return (
                <div key={plan.tier} className={`surface-panel flex rounded-[30px] p-1 ${plan.popular ? "ring-2 ring-slate-900" : ""}`}>
                  <div className="flex w-full flex-col rounded-[26px] bg-white p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{planName}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-500">{audience}</p>
                      </div>
                      {plan.popular && (
                        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {t("pricing_popular")}
                        </div>
                      )}
                    </div>

                    <div className="mt-8">
                      {plan.tier === "enterprise" ? (
                        <p className="text-3xl font-black text-slate-900">{t("pricing_custom_price")}</p>
                      ) : (
                        <div>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-slate-900">{plan.price.toLocaleString()}</span>
                            <span className="pb-1 text-sm text-slate-400">₮/{t("pricing_per_month")}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {plan.messageLimit.toLocaleString()} {t("pricing_messages")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 space-y-3">
                      {features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-primary">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="leading-6">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <Link
                        href={plan.tier === "enterprise" ? "#contact" : `/register?plan=${plan.tier}&source=pricing`}
                        onClick={
                          plan.tier === "enterprise"
                            ? (e) => {
                                e.preventDefault();
                                trackEvent("pricing_enterprise_contact_click", { source: "pricing_section" });
                                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                              }
                            : () =>
                                trackEvent("pricing_plan_cta_click", {
                                  tier: plan.tier,
                                  amount: plan.price,
                                  source: "pricing_section",
                                })
                        }
                        className={`block rounded-full px-4 py-3 text-center text-sm font-semibold transition-colors ${
                          plan.popular
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {plan.tier === "enterprise" ? t("pricing_contact") : t("pricing_cta")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-12">
            <div className="grid gap-5 md:grid-cols-3">
              {creditPacks.map((pack) => (
                <div key={pack.id} className={`surface-panel flex rounded-[30px] p-1 ${pack.popular ? "ring-2 ring-slate-900" : ""}`}>
                  <div className="flex w-full flex-col rounded-[26px] bg-white p-6">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {pack.id}
                      </p>
                      {pack.popular && (
                        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {t("pricing_popular")}
                        </div>
                      )}
                    </div>
                    <div className="mt-6">
                      <p className="text-4xl font-black text-slate-900">{pack.credits.toLocaleString()}</p>
                      <p className="mt-1 text-sm text-slate-500">{t("pricing_credits_label")}</p>
                    </div>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-900">{pack.price.toLocaleString()}</span>
                      <span className="pb-1 text-sm text-slate-400">₮</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{lang === "mn" ? "Dashboard-оос авах боломжтой" : "Available from dashboard top-up"}</p>
                    <Link
                      href="/register?plan=standard&source=pricing-credits"
                      onClick={() => trackEvent("pricing_credit_pack_click", { pack: pack.id, amount: pack.price })}
                      className="mt-8 block rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      {lang === "mn" ? "Эхлээд багц сонгоод нэвтрэх" : "Start with a monthly plan"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-sm text-slate-500">
              {lang === "mn"
                ? "Credit top-up нь workspace идэвхжсэний дараа dashboard дотор харагдана."
                : "Credit top-up appears inside the workspace after your monthly plan is active."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

