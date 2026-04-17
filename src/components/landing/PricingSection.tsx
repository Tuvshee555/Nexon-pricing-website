"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
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
      "15 contact хүртэл",
      "Keyword trigger автоматжуулалт",
      "Үндсэн dashboard",
      "Nexon брэндинг орно",
    ],
    featuresEn: [
      "1 channel (Instagram or Messenger)",
      "Up to 15 contacts",
      "Keyword trigger automation",
      "Basic dashboard",
      "Nexon branding included",
    ],
  },
  starter: {
    audienceMn: "Эхэлж байгаа жижиг бизнест",
    audienceEn: "For small businesses getting started",
    featuresMn: [
      "Free-ийн бүгд, нэмэлтээр:",
      "Instagram + Messenger + Telegram",
      "150 contact хүртэл",
      "AI автомат хариулт (24/7)",
      "Sequences",
      "Брэндинг байхгүй",
      "И-мэйл дэмжлэг",
    ],
    featuresEn: [
      "Everything in Free, plus:",
      "Instagram + Messenger + Telegram",
      "Up to 150 contacts",
      "AI auto-replies (24/7)",
      "Sequences",
      "No branding",
      "Email support",
    ],
  },
  growth: {
    audienceMn: "Тогтмол чат авдаг бизнест",
    audienceEn: "For businesses with steady daily messages",
    featuresMn: [
      "Starter-ийн бүгд, нэмэлтээр:",
      "1,500 contact хүртэл",
      "Broadcast илгээлт",
      "Flow builder",
      "Comment-to-DM автоматжуулалт",
      "2 хэрэглэгчийн эрх",
      "Гэнэтийн нэмэлт төлбөргүй",
    ],
    featuresEn: [
      "Everything in Starter, plus:",
      "Up to 1,500 contacts",
      "Broadcasts",
      "Flow builder",
      "Comment-to-DM automation",
      "2 user seats",
      "Fixed price, no surprise bills",
    ],
  },
  pro: {
    audienceMn: "Борлуулалтын идэвхтэй багт",
    audienceEn: "For active sales teams",
    featuresMn: [
      "Growth-ийн бүгд, нэмэлтээр:",
      "4,500 contact хүртэл",
      "5 хэрэглэгчийн эрх",
      "Дэлгэрэнгүй аналитик",
      "Дансны Telegram мэдэгдэл",
      "Шууд дэмжлэг (бодит хүн)",
    ],
    featuresEn: [
      "Everything in Growth, plus:",
      "Up to 4,500 contacts",
      "5 user seats",
      "Advanced analytics",
      "Account Telegram notifications",
      "Live support — real human",
    ],
  },
  enterprise: {
    audienceMn: "Custom rollout хэрэгтэй байгууллагад",
    audienceEn: "For organizations needing a custom rollout",
    featuresMn: [
      "Pro-ийн бүгд, нэмэлтээр:",
      "15,000 contact хүртэл",
      "Хязгааргүй хэрэглэгчийн эрх",
      "Custom workflow дизайн",
      "Тусгай onboarding & setup",
      "Хамгийн өндөр дэмжлэг (шууд)",
    ],
    featuresEn: [
      "Everything in Pro, plus:",
      "Up to 15,000 contacts",
      "Unlimited user seats",
      "Custom workflow design",
      "Dedicated onboarding & setup",
      "Highest priority live support",
    ],
  },
};

export default function PricingSection() {
  const { lang, t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const subtitle =
    lang === "mn"
      ? "Үнэгүй эхэлж, бизнесийн өсөлтөөрөө дагаад шинэчил."
      : "Start free, upgrade as your business grows.";

  return (
    <section ref={ref} id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="section-label justify-center">{t("pricing_title")}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {lang === "mn"
              ? "Таны бизнест тохирсон багцыг сонго"
              : "Pick the plan that fits your business"}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{subtitle}</p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {lang === "mn" ? "Сарын" : "Monthly"}
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                billing === "annual"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {lang === "mn" ? "Жилийн" : "Annual"}
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {lang === "mn" ? "-20%" : "Save 20%"}
              </span>
            </button>
          </div>

          <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            {lang === "mn"
              ? `Нэг удаагийн setup fee: ${SETUP_FEE.toLocaleString()}₮ (Starter болон дээш)`
              : `One-time setup fee: ${SETUP_FEE.toLocaleString()}₮ (Starter and above)`}
          </div>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {MONTHLY_PLANS.map((plan, index) => {
            const details = planDetails[plan.tier];
            const audience = lang === "mn" ? details.audienceMn : details.audienceEn;
            const features = lang === "mn" ? details.featuresMn : details.featuresEn;
            const planName = lang === "mn" ? plan.nameMn : plan.nameEn;
            const displayPrice = billing === "annual" ? plan.annualPrice : plan.price;
            const contactLabel =
              lang === "mn"
                ? `${plan.contactLimit.toLocaleString()} contact/сар`
                : `${plan.contactLimit.toLocaleString()} contacts/month`;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.12 + index * 0.07 }}
                className={`surface-panel flex rounded-[30px] p-1 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "ring-2 ring-slate-900 glow-primary-lg hover:glow-primary-lg"
                    : "hover:shadow-lg"
                }`}
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
                          <span className="text-3xl font-black text-slate-900">{displayPrice.toLocaleString()}</span>
                          <span className="pb-1 text-xs text-slate-400">
                            ₮/{t("pricing_per_month")}
                            {billing === "annual" && (
                              <span className="ml-1 text-slate-300">
                                {lang === "mn" ? "(жилд тооцно)" : "(billed annually)"}
                              </span>
                            )}
                          </span>
                        </div>
                        {billing === "annual" && plan.price > 0 && (
                          <p className="mt-0.5 text-xs text-slate-400 line-through">{plan.price.toLocaleString()}₮</p>
                        )}
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
                      href={`/register?plan=${plan.tier}&billing=${billing}&source=pricing`}
                      onClick={() =>
                        trackEvent("pricing_plan_cta_click", {
                          tier: plan.tier,
                          amount: displayPrice,
                          billing,
                          source: "pricing_section",
                        })
                      }
                      className={`block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                        plan.popular
                          ? "btn-shimmer bg-slate-900 text-white hover:bg-slate-800"
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
              </motion.div>
            );
          })}
        </div>

        {billing === "annual" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-sm text-slate-500"
          >
            {lang === "mn"
              ? "Жилийн төлбөрөөр нийт дүнг нэг удаа тооцно. 14 хоногийн туршилтын хугацаа орно."
              : "Annual plans are billed as one yearly payment. Includes a 14-day free trial."}
          </motion.p>
        )}
      </div>
    </section>
  );
}
