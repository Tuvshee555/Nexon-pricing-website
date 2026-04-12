"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";

export default function HeroSection() {
  const { lang, t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Instagram, Messenger автоматжуулалт",
          title: "Олон дахин давтагддаг чатуудыг танай брэндэд тохирсон AI урсгал болгож хувирга",
          subtitle:
            "Nexon нь асуулт, үнэ, хүргэлт, захиалга, гар дамжуулах мөчүүдийг нэг хяналтын системд оруулж, танай inbox-ийг илүү цэвэрхэн ажиллуулна.",
          bullets: [
            "Давтагддаг асуултуудад тогтвортой хариулт өгнө",
            "Худалдан авах сонирхолтой хэрэглэгчийг ялгана",
            "Хүн рүү шилжүүлэх чатыг зөв мөчид гаргаж өгнө",
          ],
          primaryCta: t("hero_cta"),
          secondaryCta: "Хэрхэн ажилладгийг үзэх",
          cardTitle: "Conversation engine",
          cardSubtitle: "Channel visibility + automation + human handoff",
          metrics: [
            { label: "Automation coverage", value: "Repeat-ready" },
            { label: "Reply speed", value: "Always-on" },
            { label: "Human handoff", value: "Controlled" },
          ],
          journeyTitle: "Өнөөдрийн урсгал",
          journey: [
            { label: "Instagram comment to DM", state: "Live" },
            { label: "Delivery FAQ assistant", state: "Healthy" },
            { label: "Manager handoff rule", state: "Ready" },
          ],
          channels: ["Instagram DM", "Messenger", "Lead routing"],
          stats: [
            { label: "Идэвхтэй сувгууд", value: "Instagram + Messenger" },
            { label: "Flow бүтэц", value: "Guided setup" },
            { label: "Handoff policy", value: "Team-ready" },
          ],
        }
      : {
          eyebrow: "Instagram and Messenger automation",
          title: "Turn repeat conversations into an AI workflow that still feels like your team",
          subtitle:
            "Nexon brings questions, pricing, delivery, orders, and handoff moments into one operating system so your inbox stays fast and clear.",
          bullets: [
            "Answer repeat questions with consistent brand-safe replies",
            "Spot buyers earlier and organize warm leads faster",
            "Hand off the right chats to a real person at the right time",
          ],
          primaryCta: t("hero_cta"),
          secondaryCta: "See how it works",
          cardTitle: "Conversation engine",
          cardSubtitle: "Channel visibility + automation + human handoff",
          metrics: [
            { label: "Automation coverage", value: "Repeat-ready" },
            { label: "Reply speed", value: "Always-on" },
            { label: "Human handoff", value: "Controlled" },
          ],
          journeyTitle: "Today’s operating view",
          journey: [
            { label: "Instagram comment to DM", state: "Live" },
            { label: "Delivery FAQ assistant", state: "Healthy" },
            { label: "Manager handoff rule", state: "Ready" },
          ],
          channels: ["Instagram DM", "Messenger", "Lead routing"],
          stats: [
            { label: "Active channels", value: "Instagram + Messenger" },
            { label: "Flow structure", value: "Guided setup" },
            { label: "Handoff policy", value: "Team-ready" },
          ],
        };

  return (
    <section ref={ref} className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
      <div className="absolute inset-0 marketing-mesh opacity-70" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[1.03fr_0.97fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="section-label"
            >
              {copy.eyebrow}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl"
            >
              {copy.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl"
            >
              {copy.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/register?source=hero"
                onClick={() => trackEvent("hero_primary_cta_click", { source: "hero" })}
                className="rounded-full bg-slate-900 px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                {copy.primaryCta}
              </Link>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                {copy.secondaryCta}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.32 }}
              className="mt-10 grid gap-3 sm:max-w-2xl sm:grid-cols-3"
            >
              {copy.bullets.map((bullet) => (
                <div key={bullet} className="surface-panel rounded-[24px] px-4 py-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{bullet}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40, y: 18 }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-[linear-gradient(180deg,rgba(15,79,232,0.14),rgba(79,70,229,0.05))] blur-3xl" />

            <div className="surface-card relative rounded-[32px] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Nexon workspace</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">{copy.cardTitle}</h3>
                  <p className="mt-1 text-sm text-slate-500">{copy.cardSubtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {copy.channels.map((channel) => (
                    <span key={channel} className="accent-pill">
                      {channel}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {copy.metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.45, delay: 0.34 + index * 0.08 }}
                    className="rounded-[24px] border border-slate-200 bg-white p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
                    <p className="mt-3 text-2xl font-black text-slate-900">{metric.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/70">{copy.journeyTitle}</p>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Live inbox</div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {copy.journey.map((item, index) => (
                      <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-xs font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm font-medium text-white/92">{item.label}</p>
                          </div>
                          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                            {item.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {copy.stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: 12 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.45, delay: 0.46 + index * 0.08 }}
                      className="rounded-[26px] border border-slate-200 bg-white px-5 py-4"
                    >
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
