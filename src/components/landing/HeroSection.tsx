"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function HeroSection() {
  const { lang, t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

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

  // Helper: produce fade-up animation props for any delay
  const up = (delay: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0 as number, y: 28 as number },
    transition: { duration: 0.7, delay },
  });

  return (
    <section ref={ref} className="relative overflow-hidden pt-24 pb-16 sm:pb-20 grid-bg">
      {/* Aurora orbs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[50rem] w-[50rem] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse, rgba(15,79,232,0.8) 0%, transparent 70%)",
          animation: "aurora1 14s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />
      <div
        className="pointer-events-none absolute top-20 right-0 h-[35rem] w-[35rem] rounded-full opacity-15"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.7) 0%, transparent 70%)",
          animation: "aurora2 18s ease-in-out infinite",
          filter: "blur(80px)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[30rem] w-[30rem] rounded-full opacity-10"
        style={{
          background: "radial-gradient(ellipse, rgba(123,97,255,0.8) 0%, transparent 70%)",
          animation: "aurora3 20s ease-in-out infinite",
          filter: "blur(70px)",
        }}
      />

      {/* Scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.25) 50%, transparent 100%)",
            animation: "scanLine 7s linear infinite",
          }}
        />
      </div>

      {/* Divider */}
      <div className="absolute inset-x-0 top-16 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">

          {/* Left column */}
          <div>
            {/* Badge */}
            <motion.div {...up(0)}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                {copy.badge}
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...up(0.12)}
              className="mt-6 max-w-3xl text-5xl font-black leading-tight text-text-primary sm:text-6xl lg:text-7xl"
            >
              {copy.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...up(0.24)}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl"
            >
              {copy.subtitle}
            </motion.p>

            {/* CTA buttons */}
            <motion.div {...up(0.36)} className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="btn-shimmer inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-[1.04] hover:bg-primary/90 glow-primary-lg"
              >
                {t("hero_cta")}
                <motion.svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
                </motion.svg>
              </Link>
              <button
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-4 text-lg font-medium text-text-secondary transition-all duration-300 hover:border-primary/50 hover:text-text-primary hover:bg-primary/5"
              >
                {t("nav_pricing")}
              </button>
            </motion.div>

            {/* Feature points */}
            <motion.div {...up(0.48)} className="mt-8 grid gap-3 sm:max-w-2xl sm:grid-cols-3">
              {copy.primaryPoints.map((point, i) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
                  className="rounded-2xl border border-border/80 bg-surface/70 px-4 py-4 text-sm text-text-secondary backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-accent">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {point}
                </motion.div>
              ))}
            </motion.div>

            {/* Stats */}
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6">
              {copy.bottomStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }}
                >
                  <div className="text-3xl font-black text-gradient-animated stat-glow">{stat.value}</div>
                  <div className="mt-1 text-sm text-text-secondary">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right column — dashboard card */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="relative"
            style={{ animation: isInView ? "float 7s ease-in-out infinite" : "none" }}
          >
            <div className="absolute inset-4 rounded-[2rem] bg-accent/10 blur-3xl" />
            <div
              className="absolute inset-0 rounded-[2rem] opacity-60"
              style={{
                background: "radial-gradient(ellipse at 50% 0%, rgba(15,79,232,0.2) 0%, transparent 60%)",
                filter: "blur(20px)",
              }}
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface/90 p-5 shadow-2xl shadow-background/40 backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{copy.visualTitle}</p>
                  <p className="mt-1 text-sm text-text-secondary">{copy.visualSubtitle}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success"
                >
                  Live
                </motion.div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: copy.autoResolved, value: "76%" },
                  { label: copy.responseTime, value: "4 sec" },
                  { label: copy.escalated, value: "8" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                    className="rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:border-primary/30"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</div>
                    <div className="mt-3 text-2xl font-black text-text-primary">{item.value}</div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-border/80 bg-background/70 p-4 relative overflow-hidden">
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
                  {[
                    { role: copy.customer, tone: "border-border bg-surface", message: copy.customerMessage, delay: 0.9 },
                    { role: copy.bot, tone: "border-primary/30 bg-primary/10", message: copy.botMessage, delay: 1.05 },
                    { role: copy.team, tone: "border-accent/30 bg-accent/10", message: copy.teamMessage, delay: 1.2 },
                  ].map((bubble) => (
                    <motion.div
                      key={bubble.role}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: bubble.delay, duration: 0.5 }}
                    >
                      <MessageBubble role={bubble.role} tone={bubble.tone} message={bubble.message} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {copy.liveItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 1.1 + i * 0.1, duration: 0.4 }}
                    className="rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:border-accent/30"
                  >
                    <div className="text-2xl font-black text-gradient">{item.value}</div>
                    <div className="mt-2 text-sm text-text-secondary">{item.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Platform bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-border/70 pt-8 text-sm text-text-secondary"
        >
          <div className="flex items-center gap-2 transition-colors hover:text-text-primary">
            <PlatformIcon type="instagram" />
            Instagram DM
          </div>
          <div className="flex items-center gap-2 transition-colors hover:text-text-primary">
            <PlatformIcon type="messenger" />
            Facebook Messenger
          </div>
          <div className="flex items-center gap-2 transition-colors hover:text-text-primary">
            <PlatformIcon type="dashboard" />
            Admin dashboard
          </div>
        </motion.div>
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
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${tone}`}>
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
