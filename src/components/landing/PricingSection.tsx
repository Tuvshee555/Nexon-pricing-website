"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, CREDIT_PACKS, MonthlyTier } from "@/types";

const pricingContent = {
  mn: {
    includedTitle: "Бүх багцад багтсан үндсэн боломжууд",
    included: [
      "Instagram болон Messenger холболт",
      "AI bot-ийн үндсэн тохиргоо",
      "Хэрэглээний хяналтын самбар",
      "Шаардлагатай үед баг руу дамжуулах урсгал",
    ],
    chooserCards: [
      {
        title: "Сарын төлөвлөгөө",
        description: "Өдөр бүр тогтмол мессеж ирдэг бизнест хамгийн тохиромжтой.",
      },
      {
        title: "Кредит багц",
        description: "Сурталчилгаа, улирлын ачаалал, туршилтын эхлэлд уян хатан.",
      },
      {
        title: "Enterprise",
        description: "Илүү олон чат, тусгай урсгал, илүү ойр хамтын ажиллагаа хүсвэл.",
      },
    ],
    monthlyFootnote:
      "Тогтмол борлуулалтын урсгалтай бол сарын төлөвлөгөө нь нэг мессежийн өртөг болон төлөвлөлтийн хувьд илүү ашигтай байдаг.",
    creditsTitle: "Кредит багц ямар үед тохирох вэ",
    creditsBenefits: [
      "Сарын тогтмол төлбөргүй",
      "Кредит дуусахгүй, хэрэгтэй үедээ ашиглана",
      "Шинэ бизнес эсвэл кампанит ажилд эрсдэл багатай эхлэл",
    ],
    packLabel: "Ойролцоогоор",
    packPerMessage: "1 мессежийн өртөг",
    packUseTitle: "Илүү тохиромжтой хэрэглээ",
    packUses: {
      10000: "Жижиг туршилт, bot-ийн хариултыг шалгах эхлэл",
      25000: "Дунд ачаалалтай дэлгүүр, богино кампанит ажил",
      50000: "Идэвхтэй борлуулалттай хуудас, тогтмол сурталчилгаа",
    },
    planDetails: {
      basic: {
        audience: "Эхэлж байгаа жижиг бизнес",
        features: [
          "FAQ болон түгээмэл асуултын automation",
          "Нэг брэндийн энгийн хариултын урсгал",
          "Dashboard дээр үндсэн хэрэглээний тайлан",
        ],
      },
      standard: {
        audience: "Өдөр бүр тогтмол чат авдаг бизнес",
        features: [
          "Илүү олон мессеж, илүү тогтвортой өдөр тутмын ашиглалт",
          "Сонирхсон хэрэглэгчийг ангилах илүү сайн урсгал",
          "Telegram мэдэгдэл болон илүү идэвхтэй хяналт",
        ],
      },
      premium: {
        audience: "Борлуулалтын ачаалал өндөр баг",
        features: [
          "Их хэмжээний мессеж боловсруулах боломж",
          "Олон төрлийн асуулт, захиалгын урсгалд тохиромжтой",
          "Илүү ойр дэмжлэг ба илүү өргөн хэрэглээ",
        ],
      },
      enterprise: {
        audience: "Custom шийдэл хүссэн байгууллага",
        features: [
          "Тусгай хязгаар, илүү өргөн интеграцийн боломж",
          "Нарийн workflow болон team handoff зураглал",
          "Тохиролцсон дэмжлэг, нэвтрүүлэлтийн хамтрал",
        ],
      },
    } satisfies Record<MonthlyTier, { audience: string; features: string[] }>,
  },
  en: {
    includedTitle: "What every setup already includes",
    included: [
      "Instagram and Messenger connection",
      "Core AI bot setup and prompt configuration",
      "Usage and performance dashboard",
      "Escalation flow for chats that need a human",
    ],
    chooserCards: [
      {
        title: "Monthly plans",
        description: "Best for businesses with steady daily conversations and predictable demand.",
      },
      {
        title: "Credit packs",
        description: "Flexible for campaigns, seasonal spikes, or testing the service first.",
      },
      {
        title: "Enterprise",
        description: "For higher volume teams that want custom workflow design and support.",
      },
    ],
    monthlyFootnote:
      "If your inbox gets regular customer messages, monthly plans usually give you better message economics and easier planning.",
    creditsTitle: "When credit packs make sense",
    creditsBenefits: [
      "No fixed monthly commitment",
      "Credits do not expire, so usage stays flexible",
      "Lower-risk way to start for new or seasonal businesses",
    ],
    packLabel: "Approx.",
    packPerMessage: "cost per message",
    packUseTitle: "Best use case",
    packUses: {
      10000: "Small pilot to test bot quality and common customer questions",
      25000: "Moderate traffic store or short sales campaign",
      50000: "High-activity page with repeat promotions or frequent inquiries",
    },
    planDetails: {
      basic: {
        audience: "Small business just getting started",
        features: [
          "FAQ automation for your most common questions",
          "Simple branded reply flow for one core sales funnel",
          "Basic usage visibility inside the dashboard",
        ],
      },
      standard: {
        audience: "Business with steady daily inbox activity",
        features: [
          "Higher message capacity for reliable everyday use",
          "Stronger flow for qualifying interested buyers",
          "Telegram alerts and more active monitoring",
        ],
      },
      premium: {
        audience: "Team handling heavier sales volume",
        features: [
          "Supports much larger message demand",
          "Better fit for broader FAQ and order scenarios",
          "Closer support and room for more advanced usage",
        ],
      },
      enterprise: {
        audience: "Organization that needs a custom rollout",
        features: [
          "Custom limits and broader integration options",
          "Workflow design for complex team handoffs",
          "Collaborative onboarding and tailored support",
        ],
      },
    } satisfies Record<MonthlyTier, { audience: string; features: string[] }>,
  },
} as const;

export default function PricingSection() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"monthly" | "credits">("monthly");
  const copy = pricingContent[lang];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            {t("pricing_title")}
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
            {t("pricing_subtitle")}
          </p>

          <div className="grid gap-4 md:grid-cols-3 text-left mb-8">
            {copy.chooserCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-border bg-background/60 p-5">
                <div className="text-lg font-bold text-text-primary">{card.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-border bg-background/50 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              {copy.includedTitle}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {copy.included.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface/70 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-accent">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 inline-flex rounded-xl border border-border bg-surface p-1">
            <button
              onClick={() => setTab("monthly")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "monthly"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t("pricing_monthly")}
            </button>
            <button
              onClick={() => setTab("credits")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "credits"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t("pricing_credits")}
            </button>
          </div>
        </div>

        {tab === "monthly" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MONTHLY_PLANS.map((plan) => {
                const details = copy.planDetails[plan.tier];

                return (
                  <div
                    key={plan.tier}
                    className={`relative card p-6 flex flex-col ${
                      plan.popular ? "border-primary glow-primary" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                          {t("pricing_popular")}
                        </span>
                      </div>
                    )}

                    <div className="mb-5">
                      <h3 className="text-xl font-bold text-text-primary">
                        {lang === "mn" ? plan.nameMn : plan.nameEn}
                      </h3>
                      <p className="mt-2 text-sm text-text-secondary">{details.audience}</p>
                      <div className="mt-4">
                        {plan.tier === "enterprise" ? (
                          <span className="text-2xl font-black text-text-secondary">
                            {t("pricing_custom_price")}
                          </span>
                        ) : (
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-gradient">
                              {plan.price.toLocaleString()} MNT
                            </span>
                            <span className="pb-1 text-text-secondary text-sm">
                              {t("pricing_per_month")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-5 rounded-2xl border border-border/80 bg-background/60 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted">
                        {plan.tier === "enterprise" ? t("pricing_unlimited") : t("pricing_messages")}
                      </div>
                      <div className="mt-2 text-2xl font-black text-text-primary">
                        {plan.messageLimit === Infinity
                          ? t("pricing_unlimited")
                          : `${plan.messageLimit.toLocaleString()} ${t("pricing_messages")}`}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {details.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                          <svg className="w-4 h-4 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.tier === "enterprise" ? "#contact" : "/register"}
                      className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                        plan.popular
                          ? "bg-primary hover:bg-primary/90 text-white"
                          : "border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary"
                      }`}
                      onClick={
                        plan.tier === "enterprise"
                          ? (e) => {
                              e.preventDefault();
                              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                            }
                          : undefined
                      }
                    >
                      {plan.tier === "enterprise" ? t("pricing_contact") : t("pricing_cta")}
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[2rem] border border-border bg-background/50 p-6">
              <p className="text-sm leading-relaxed text-text-secondary">{copy.monthlyFootnote}</p>
            </div>
          </div>
        )}

        {tab === "credits" && (
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] mb-8">
              <div className="rounded-[2rem] border border-border bg-background/50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  {copy.creditsTitle}
                </p>
                <div className="mt-5 space-y-4">
                  {copy.creditsBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-sm leading-relaxed text-text-secondary">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-background/50 p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: t("pricing_never_expire"), value: "100%" },
                    { label: t("pricing_credits"), value: "Flexible" },
                    { label: t("pricing_cta"), value: "Top up anytime" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/80 bg-surface/70 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</div>
                      <div className="mt-3 text-xl font-black text-text-primary">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.amount}
                  className={`card p-6 flex flex-col relative ${
                    pack.popular ? "border-accent glow-accent" : ""
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-accent text-background text-xs font-bold px-3 py-1 rounded-full">
                        {t("qpay_popular")}
                      </span>
                    </div>
                  )}

                  <div className="text-3xl font-black text-gradient mb-2">
                    {pack.amount.toLocaleString()} MNT
                  </div>
                  <div className="text-text-secondary text-sm mb-4">
                    {pack.credits.toLocaleString()} {t("pricing_messages")}
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-background/60 p-4 mb-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{copy.packLabel}</div>
                    <div className="mt-2 text-lg font-black text-text-primary">
                      {Math.round(pack.amount / pack.credits).toLocaleString()} MNT
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">{copy.packPerMessage}</div>
                  </div>

                  <div className="text-xs text-success mb-4 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("pricing_never_expire")}
                  </div>

                  <div className="mb-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{copy.packUseTitle}</div>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {copy.packUses[pack.amount as keyof typeof copy.packUses]}
                    </p>
                  </div>

                  <Link
                    href="/register"
                    className="mt-auto w-full text-center border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary py-3 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {t("pricing_cta")}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
