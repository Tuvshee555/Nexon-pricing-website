"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const proofPoints = [
  { value: "24/7", label: "Always-on replies" },
  { value: "2 channels", label: "Instagram + Messenger coverage" },
  { value: "Guided", label: "First setup flow" },
  { value: "Visible", label: "Inbox and handoff status" },
];

export default function SocialProofSection() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Яагаад багууд үүнийг сонгох вэ",
          title: "Хурдан хариу, цэвэр inbox, ойлгомжтой flow гэдэг нь маркетинг биш, өдөр тутмын ажил",
          subtitle:
            "Manychat-ээс сурах хамгийн чухал зүйл бол user confidence. Хүмүүс эхний 30 секундэд таны product юу хийдгийг ойлгох ёстой.",
          bullets: [
            "Давтагддаг асуултыг automation руу буулгадаг",
            "Human handoff-ыг зөв мөчид ил гаргадаг",
            "Нэг dashboard дээр ажилладаг ойлгомжтой бүтэц өгдөг",
          ],
        }
      : {
          eyebrow: "Why teams would pick this",
          title: "Fast replies, a clean inbox, and clear flows are day-to-day value, not just marketing copy",
          subtitle:
            "The biggest thing to learn from Manychat is user confidence. People should understand what your product does within the first 30 seconds.",
          bullets: [
            "Automates repeat questions instead of making your team retype them",
            "Makes human handoff feel obvious and controlled",
            "Keeps the experience organized in one readable dashboard",
          ],
        };

  return (
    <section ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="section-label justify-center">{copy.eyebrow}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{copy.subtitle}</p>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card rounded-[32px] p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {proofPoints.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="rounded-[26px] border border-slate-200 bg-white p-5"
                >
                  <p className="text-3xl font-black text-slate-900">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[32px] p-6 sm:p-8">
            <h3 className="text-2xl font-black text-slate-900">What teams usually value</h3>
            <div className="mt-5 space-y-4">
              {copy.bullets.map((bullet, index) => (
                <motion.div
                  key={bullet}
                  initial={{ opacity: 0, x: 12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.1 + index * 0.06 }}
                  className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-white p-4"
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{bullet}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
