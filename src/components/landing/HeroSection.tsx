"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const { lang, t } = useLanguage();

  const copy = lang === "mn"
    ? {
        badge: "Instagram, Messenger-д зориулсан AI assistant",
        title: "Борлуулалтын асуултад хурдан хариулдаг AI багтай болоорой",
        subtitle:
          "Үнэ, хүргэлт, бүтээгдэхүүн, захиалгын түгээмэл асуултыг автоматжуулж, танай багийг илүү чухал харилцаа дээр төвлөрөхөд тусална.",
        primaryPoints: [
          "Үнэ болон бүтээгдэхүүний түгээмэл асуултад хариулна",
          "Захиалга, хүсэлт, сонирхсон хэрэглэгчийг ангилна",
          "Шаардлагатай үед танай баг руу шилжүүлнэ",
        ],
        visualTitle: "Нэг дороос хянах ажлын урсгал",
        visualSubtitle: "Instagram + Messenger + dashboard",
        autoResolved: "Автоматаар шийдсэн",
        responseTime: "Дундаж хариу",
        escalated: "Баг руу шилжүүлсэн",
        customer: "Хэрэглэгч",
        bot: "AI bot",
        team: "Танай баг",
        customerMessage: "Энэ бараа бэлэн байгаа юу, хүргэлт хэд хоног вэ?",
        botMessage: "Тийм ээ, бэлэн байна. Улаанбаатарт 24-48 цагт хүргэнэ. Хаягаа үлдээвэл захиалга эхлүүлье.",
        teamMessage: "Төлбөрийн асуулттай хэрэглэгчийг менежерт дамжууллаа.",
        liveLabel: "Өнөөдрийн товч зураг",
        liveItems: [
          { label: "Шинэ чат", value: "34" },
          { label: "Сонирхсон харилцагч", value: "12" },
          { label: "Идэвхтэй суваг", value: "2" },
        ],
        bottomStats: [
          { value: "24/7", label: "Тасралтгүй хариулт" },
          { value: "2", label: "Суваг нэг дор" },
          { value: "Live", label: "Хяналтын самбар" },
        ],
      }
    : {
        badge: "AI assistant for Instagram and Messenger",
        title: "Give your team an AI teammate that answers sales questions fast",
        subtitle:
          "Automate pricing, delivery, product, and order questions so your team can spend more time on high-value conversations.",
        primaryPoints: [
          "Answer common pricing and product questions automatically",
          "Qualify order requests and interested buyers",
          "Escalate important chats to your team when needed",
        ],
        visualTitle: "One view for the full workflow",
        visualSubtitle: "Instagram + Messenger + dashboard",
        autoResolved: "Auto-resolved",
        responseTime: "Avg. reply",
        escalated: "Escalated",
        customer: "Customer",
        bot: "AI bot",
        team: "Your team",
        customerMessage: "Is this item in stock and how long is delivery?",
        botMessage: "Yes, it is available. Delivery inside Ulaanbaatar takes 24-48 hours. I can start the order if you want.",
        teamMessage: "A payment-related chat was forwarded to your manager.",
        liveLabel: "Today at a glance",
        liveItems: [
          { label: "New chats", value: "34" },
          { label: "Qualified leads", value: "12" },
          { label: "Active channels", value: "2" },
        ],
        bottomStats: [
          { value: "24/7", label: "Always-on replies" },
          { value: "2", label: "Channels connected" },
          { value: "Live", label: "Usage visibility" },
        ],
      };

  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pb-20">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute top-0 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute inset-x-0 top-16 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {copy.badge}
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight text-text-primary sm:text-6xl lg:text-7xl">
              {copy.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:bg-primary/90 glow-primary"
              >
                {t("hero_cta")}
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <button
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-4 text-lg font-medium text-text-secondary transition-all hover:border-primary/50 hover:text-text-primary"
              >
                {t("nav_pricing")}
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:max-w-2xl sm:grid-cols-3">
              {copy.primaryPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-border/80 bg-surface/70 px-4 py-4 text-sm text-text-secondary">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-accent">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6">
              {copy.bottomStats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-black text-gradient">{stat.value}</div>
                  <div className="mt-1 text-sm text-text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-4 rounded-[2rem] bg-accent/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface/90 p-5 shadow-2xl shadow-background/40">
              <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{copy.visualTitle}</p>
                  <p className="mt-1 text-sm text-text-secondary">{copy.visualSubtitle}</p>
                </div>
                <div className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  Live
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: copy.autoResolved, value: "76%" },
                  { label: copy.responseTime, value: "4 sec" },
                  { label: copy.escalated, value: "8" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/80 bg-background/70 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</div>
                    <div className="mt-3 text-2xl font-black text-text-primary">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-border/80 bg-background/70 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">{copy.liveLabel}</p>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                      <span className="h-2 w-2 rounded-full bg-pink-500" />
                      Instagram
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Messenger
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <MessageBubble
                    role={copy.customer}
                    tone="border-border bg-surface"
                    message={copy.customerMessage}
                  />
                  <MessageBubble
                    role={copy.bot}
                    tone="border-primary/30 bg-primary/10"
                    message={copy.botMessage}
                  />
                  <MessageBubble
                    role={copy.team}
                    tone="border-accent/30 bg-accent/10"
                    message={copy.teamMessage}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {copy.liveItems.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/80 bg-background/70 p-4">
                    <div className="text-2xl font-black text-gradient">{item.value}</div>
                    <div className="mt-2 text-sm text-text-secondary">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-border/70 pt-8 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <PlatformIcon type="instagram" />
            Instagram DM
          </div>
          <div className="flex items-center gap-2">
            <PlatformIcon type="messenger" />
            Facebook Messenger
          </div>
          <div className="flex items-center gap-2">
            <PlatformIcon type="dashboard" />
            Admin dashboard
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({
  role,
  tone,
  message,
}: {
  role: string;
  tone: string;
  message: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {role}
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{message}</p>
    </div>
  );
}

function PlatformIcon({ type }: { type: "instagram" | "messenger" | "dashboard" }) {
  if (type === "instagram") {
    return (
      <svg className="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  if (type === "messenger") {
    return (
      <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.626 0 12-4.974 12-11.111C24 4.975 18.626 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 13v3m4-8v8m4-5v5M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
