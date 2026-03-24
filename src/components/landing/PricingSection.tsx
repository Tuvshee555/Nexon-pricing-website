"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, CREDIT_PACKS } from "@/types";

export default function PricingSection() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"monthly" | "credits">("monthly");

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            {t("pricing_title")}
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8">
            {t("pricing_subtitle")}
          </p>

          {/* Tab toggle */}
          <div className="inline-flex bg-surface border border-border rounded-xl p-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MONTHLY_PLANS.map((plan) => (
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

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-text-primary">
                    {lang === "mn" ? plan.nameMn : plan.nameEn}
                  </h3>
                  <div className="mt-3">
                    {plan.tier === "enterprise" ? (
                      <span className="text-2xl font-black text-text-secondary">
                        {t("pricing_custom_price")}
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-gradient">
                          {plan.price.toLocaleString()}₮
                        </span>
                        <span className="text-text-secondary text-sm ml-1">
                          {t("pricing_per_month")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-text-secondary text-sm mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.messageLimit === Infinity
                    ? t("pricing_unlimited")
                    : `${plan.messageLimit.toLocaleString()} ${t("pricing_messages")}`}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {[
                    "24/7 хариулт",
                    "Instagram + Messenger",
                    "Хяналтын самбар",
                    plan.tier !== "basic" ? "Тэргүүлэх дэмжлэг" : null,
                  ]
                    .filter(Boolean)
                    .map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                        <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                </ul>

                <Link
                  href={plan.tier === "enterprise" ? "#contact" : "/register"}
                  className={`w-full text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
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
            ))}
          </div>
        )}

        {tab === "credits" && (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.amount}
                  className={`card p-6 flex flex-col relative ${
                    pack.popular ? "border-accent" : ""
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
                    {pack.amount.toLocaleString()}₮
                  </div>
                  <div className="text-text-secondary text-sm mb-4">
                    {pack.credits.toLocaleString()} {t("pricing_credits_label")}
                  </div>
                  <div className="text-xs text-success mb-4 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("pricing_never_expire")}
                  </div>
                  <div className="text-xs text-text-secondary">
                    ≈ {Math.round(pack.amount / pack.credits)}₮ / кредит
                  </div>
                  <Link
                    href="/register"
                    className="mt-4 w-full text-center border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary py-2.5 rounded-lg font-semibold text-sm transition-colors"
                  >
                    {t("pricing_cta")}
                  </Link>
                </div>
              ))}
            </div>

            <div className="card p-6 text-center">
              <p className="text-text-secondary text-sm">
                <span className="text-warning font-semibold">💡 </span>
                Кредит нь сарын төлөвлөгөөнөөс үнэ цэнийн хувьд бага байдаг тул сарын төлөвлөгөө сонгохыг зөвлөж байна.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
