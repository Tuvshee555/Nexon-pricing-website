"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, SETUP_FEE, MonthlyTier } from "@/types";

const planDetails: Record<
  MonthlyTier,
  { audienceMn: string; audienceEn: string; featuresMn: string[]; featuresEn: string[] }
> = {
  basic: {
    audienceMn: "Эхэлж байгаа жижиг бизнест",
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
      "Тусгай workflow зурах",
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

export default function PricingSection() {
  const { t, lang } = useLanguage();

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F3F4FF]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            {t("pricing_title")}
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
            {t("pricing_subtitle")}
          </p>

          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {lang === "mn"
              ? `Нэг удаагийн тохиргооны төлбөр: ${SETUP_FEE.toLocaleString()}₮`
              : `One-time setup fee: ${SETUP_FEE.toLocaleString()}₮`}
          </div>
        </div>

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
                  plan.popular ? "ring-2 ring-indigo-500 shadow-lg" : "border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2 tracking-wide uppercase">
                    {t("pricing_popular")}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className={`text-lg font-bold mb-1 ${plan.popular ? "text-indigo-600" : "text-gray-900"}`}>
                      {planName}
                    </h3>
                    <p className="text-sm text-gray-500 leading-snug">{audience}</p>
                  </div>

                  <div className="mb-5">
                    {plan.tier === "enterprise" ? (
                      <div className="text-2xl font-black text-gray-400">
                        {t("pricing_custom_price")}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-black text-gray-900">{plan.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-400 pb-1">₮/{t("pricing_per_month")}</span>
                        </div>
                        <div className="mt-1.5 text-xs text-gray-400">
                          {plan.messageLimit.toLocaleString()} {t("pricing_messages")}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-gray-100 mb-5" />

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

                  <Link
                    href={plan.tier === "enterprise" ? "#contact" : "/register"}
                    onClick={
                      plan.tier === "enterprise"
                        ? (e) => {
                            e.preventDefault();
                            document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                          }
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
