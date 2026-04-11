"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, CREDIT_PACKS, SETUP_FEE, MonthlyTier } from "@/types";

const planDetails: Record<
  MonthlyTier,
  { audienceMn: string; audienceEn: string; featuresMn: string[]; featuresEn: string[] }
> = {
  basic: {
    audienceMn: "Эхлэж байгаа жижиг бизнест",
    audienceEn: "Perfect for small businesses just starting out",
    featuresMn: [
      "Instagram & Messenger холболт",
      "AI bot үндсэн тохиргоо",
      "FAQ автоматжуулалт",
      "Хэрэглээний dashboard",
    ],
    featuresEn: [
      "Instagram & Messenger connection",
      "Core AI bot setup",
      "FAQ automation",
      "Usage dashboard",
    ],
  },
  standard: {
    audienceMn: "Өдөр бүр тогтмол чат авдаг бизнест",
    audienceEn: "For businesses with steady daily inbox activity",
    featuresMn: [
      "Basic-ийн бүх боломж",
      "Илүү олон мессеж боловсруулах",
      "Хэрэглэгч ангилах урсгал",
      "Telegram мэдэгдэл",
      "Идэвхтэй хяналт",
    ],
    featuresEn: [
      "Everything in Basic",
      "Higher message capacity",
      "Lead qualification flow",
      "Telegram notifications",
      "Active monitoring",
    ],
  },
  premium: {
    audienceMn: "Борлуулалтын ачаалал өндөр багт",
    audienceEn: "For teams handling heavier sales volume",
    featuresMn: [
      "Standard-ийн бүх боломж",
      "Их хэмжээний мессеж боловсруулах",
      "Захиалга болон FAQ урсгал",
      "Ойр дэмжлэг",
      "Өргөн хэрэглээ",
    ],
    featuresEn: [
      "Everything in Standard",
      "Large message capacity",
      "Order & FAQ flows",
      "Priority support",
      "Extended use cases",
    ],
  },
  enterprise: {
    audienceMn: "Custom шийдэл хүссэн байгууллагад",
    audienceEn: "For organizations needing a custom rollout",
    featuresMn: [
      "Хязгааргүй мессеж",
      "Тусгай workflow зураглал",
      "Team handoff тохиргоо",
      "Нарийн интеграцийн боломж",
      "Тохиролцсон дэмжлэг",
    ],
    featuresEn: [
      "Unlimited messages",
      "Custom workflow design",
      "Team handoff configuration",
      "Advanced integration options",
      "Collaborative onboarding",
    ],
  },
};

const packUsesMn: Record<number, string> = {
  25000: "Жижиг туршилт, bot-ийн хариултыг шалгах эхлэл",
  50000: "Дунд ачаалалтай дэлгүүр, богино кампанит ажил",
  100000: "Идэвхтэй борлуулалттай хуудас, тогтмол сурталчилгаа",
};
const packUsesEn: Record<number, string> = {
  25000: "Small pilot to test bot quality and common questions",
  50000: "Moderate traffic store or short sales campaign",
  100000: "High-activity page with repeat promotions",
};

export default function PricingSection() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"monthly" | "credits">("monthly");

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F3F4FF]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            {t("pricing_title")}
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            {t("pricing_subtitle")}
          </p>

          {/* Setup fee pill */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {lang === "mn"
              ? `Нэг удаагийн тохиргооны төлбөр: ${SETUP_FEE.toLocaleString()}₮`
              : `One-time setup fee: ${SETUP_FEE.toLocaleString()}₮`}
          </div>

          {/* Tab toggle */}
          <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setTab("monthly")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "monthly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("pricing_monthly")}
            </button>
            <button
              onClick={() => setTab("credits")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "credits"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("pricing_credits")}
            </button>
          </div>
        </div>

        {/* Monthly plans */}
        {tab === "monthly" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MONTHLY_PLANS.map((plan) => {
              const details = planDetails[plan.tier];
              const planName = lang === "mn" ? plan.nameMn : plan.nameEn;
              const audience = lang === "mn" ? details.audienceMn : details.audienceEn;
              const features = lang === "mn" ? details.featuresMn : details.featuresEn;

              return (
                <div
                  key={plan.tier}
                  className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-shadow hover:shadow-md ${
                    plan.popular
                      ? "ring-2 ring-indigo-500 shadow-lg"
                      : "border border-gray-200"
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      {t("pricing_popular")}
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Plan name */}
                    <div className="mb-4">
                      <h3 className={`text-lg font-bold mb-1 ${plan.popular ? "text-indigo-600" : "text-gray-900"}`}>
                        {planName}
                      </h3>
                      <p className="text-sm text-gray-500 leading-snug">{audience}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      {plan.tier === "enterprise" ? (
                        <div className="text-2xl font-black text-gray-400">
                          {t("pricing_custom_price")}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-gray-900">
                              {plan.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 pb-1">₮/{t("pricing_per_month")}</span>
                          </div>
                          <div className="mt-1.5 text-xs text-gray-400">
                            {plan.messageLimit.toLocaleString()} {t("pricing_messages")}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 mb-5" />

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={plan.tier === "enterprise" ? "#contact" : "/register"}
                      onClick={
                        plan.tier === "enterprise"
                          ? (e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }
                          : undefined
                      }
                      className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                        plan.popular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-600"
                      }`}
                    >
                      {plan.tier === "enterprise" ? t("pricing_contact") : t("pricing_cta")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Credit packs */}
        {tab === "credits" && (
          <div>
            {/* Benefits row */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {(lang === "mn"
                ? ["Сарын тогтмол төлбөргүй", "Кредит дуусахгүй", "Хэрэгтэй үедээ нэмэх"]
                : ["No monthly commitment", "Credits never expire", "Top up anytime"]
              ).map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.amount}
                  className={`relative bg-white rounded-2xl flex flex-col overflow-hidden transition-shadow hover:shadow-md ${
                    pack.popular
                      ? "ring-2 ring-indigo-500 shadow-lg"
                      : "border border-gray-200"
                  }`}
                >
                  {pack.popular && (
                    <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                      {t("pricing_popular")}
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-5">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-3xl font-black text-gray-900">
                          {pack.amount.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400 pb-1">₮</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {pack.credits.toLocaleString()} {t("pricing_messages")}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 mb-5" />

                    <div className="space-y-3 flex-1 mb-6">
                      {/* Per message */}
                      <div className="flex items-start gap-2.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {lang === "mn"
                          ? `1 мессежийн өртөг: ${Math.round(pack.amount / pack.credits).toLocaleString()}₮`
                          : `${Math.round(pack.amount / pack.credits).toLocaleString()}₮ per message`}
                      </div>
                      {/* Never expire */}
                      <div className="flex items-start gap-2.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {t("pricing_never_expire")}
                      </div>
                      {/* Use case */}
                      <p className="text-xs text-gray-400 leading-relaxed pl-6">
                        {lang === "mn"
                          ? packUsesMn[pack.amount]
                          : packUsesEn[pack.amount]}
                      </p>
                    </div>

                    <Link
                      href="/register"
                      className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                        pack.popular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-600"
                      }`}
                    >
                      {t("pricing_cta")}
                    </Link>
                  </div>
                </div>
              ))}

              {/* Custom pack */}
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl flex flex-col overflow-hidden hover:border-indigo-300 transition-colors">
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-5">
                    <div className="text-3xl font-black text-gray-400 mb-1">
                      {lang === "mn" ? "Custom" : "Custom"}
                    </div>
                    <p className="text-sm text-gray-500">
                      {lang === "mn" ? "Тохиролцсон хэмжээ" : "Negotiated volume"}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 mb-5" />

                  <div className="space-y-3 flex-1 mb-6">
                    <div className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {lang === "mn" ? "Том хэмжээний захиалга" : "Bulk order discounts"}
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {lang === "mn" ? "Хямдруулсан үнэ" : "Better rate per message"}
                    </div>
                  </div>

                  <Link
                    href="#contact"
                    onClick={(e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }}
                    className="block text-center py-3 rounded-xl font-semibold text-sm border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-600 transition-all"
                  >
                    {t("pricing_contact")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom included note */}
        <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            {lang === "mn" ? "Бүх багцад багтсан:" : "Included in every plan:"}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(lang === "mn"
              ? [
                  "Instagram болон Messenger холболт",
                  "AI bot-ийн үндсэн тохиргоо",
                  "Хэрэглээний хяналтын самбар",
                  "Хүнд дамжуулах урсгал",
                ]
              : [
                  "Instagram and Messenger connection",
                  "Core AI bot setup and prompt config",
                  "Usage and performance dashboard",
                  "Escalation flow for human handoff",
                ]
            ).map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-gray-500">
                <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
