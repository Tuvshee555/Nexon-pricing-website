"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const templates = [
  {
    key: "faq",
    title: "FAQ responder",
    description: "Answers pricing, delivery, and availability questions with a clean handoff rule.",
  },
  {
    key: "lead",
    title: "Lead qualifier",
    description: "Collects intent, budget, and contact details before the team jumps in.",
  },
  {
    key: "welcome",
    title: "Welcome flow",
    description: "Greets new users and sets expectations for next steps automatically.",
  },
  {
    key: "order",
    title: "Order follow-up",
    description: "Guides the buyer from interest to action without losing the thread.",
  },
];

export default function TemplatesSection() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Starter templates",
          title: "Хамгийн сайн product-ууд шинэ хэрэглэгчдэд template өгдөг",
          subtitle:
            "Хүн бүр эхнээс нь flow зохиохыг хүсдэггүй. Бэлэн загвар нь value-г хурдан мэдрүүлдэг.",
          cta: "Flow templates руу орох",
        }
      : {
          eyebrow: "Starter templates",
          title: "The best products give new users a place to start",
          subtitle:
            "Not everyone wants to build from zero. Templates make the first success moment happen faster.",
          cta: "Open flow templates",
        };

  return (
    <section ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">{copy.eyebrow}</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
          </div>
          <Link href="/dashboard/flows" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
            {copy.cta}
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template, index) => (
            <motion.div
              key={template.key}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="surface-card rounded-[30px] p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-primary">
                0{index + 1}
              </div>
              <h3 className="text-xl font-black text-slate-900">{template.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{template.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
