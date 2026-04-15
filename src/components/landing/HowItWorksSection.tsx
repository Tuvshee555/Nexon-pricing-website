"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorksSection() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Хэрхэн ажиллах вэ",
          title: "Эхний setup-аас эхлээд live inbox хүртэл гурван ойлгомжтой алхам",
          steps: [
            {
              number: "01",
              title: "Сувгаа холбоно",
              description: "Instagram, Messenger, Telegram account-уудаа холбож, ямар төрлийн чат ирдгийг Nexon-д ойлгуулна.",
            },
            {
              number: "02",
              title: "AI урсгалаа тохируулна",
              description: "Үнэ, хүргэлт, захиалга, manager handoff зэрэг мөчүүдэд ямар logic ажиллахыг сонгоно.",
            },
            {
              number: "03",
              title: "Live visibility авна",
              description: "Dashboard дээрээ automation health, lead activity, inbox handoff-уудаа өдөр бүр хянана.",
            },
          ],
        }
      : {
          eyebrow: "How it works",
          title: "Three clear steps from first setup to a live operating inbox",
          steps: [
            {
              number: "01",
              title: "Connect your channels",
              description: "Link Instagram, Messenger, and Telegram so Nexon can understand where conversations arrive from.",
            },
            {
              number: "02",
              title: "Shape the AI flow",
              description: "Define how pricing, delivery, order, and human handoff moments should behave.",
            },
            {
              number: "03",
              title: "Run with live visibility",
              description: "Track automation health, lead activity, and handoff behavior from one dashboard every day.",
            },
          ],
        };

  return (
    <section id="how-it-works" ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="section-label justify-center">{copy.eyebrow}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {copy.title}
          </h2>
        </motion.div>

        <div className="relative mt-12 grid gap-5 lg:grid-cols-3">
          {copy.steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="surface-card relative rounded-[30px] p-6"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black tracking-[0.16em] text-primary">
                  {step.number}
                </div>
                {index < copy.steps.length - 1 && (
                  <div className="hidden text-slate-300 lg:block">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14m-5-5 5 5-5 5" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-900">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
