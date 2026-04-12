"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function OperationsSection() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Танай workflow дээр яг юу сайжрах вэ",
          title: "Чат орж ирснээс эхлээд action авагдах хүртэл бүх урсгалыг илүү ойлгомжтой болгосон",
          subtitle:
            "Энэ шинэ direction нь marketing page дээрээс dashboard shell хүртэл нэг логиктой. Юу болсон, дараа нь юу хийх вэ гэдэг нь илүү хурдан ойлгогдоно.",
          cards: [
            {
              title: "Lead routing",
              description: "Худалдан авах сонирхолтой хүмүүсийг ердийн FAQ chat-аас хурдан ялгана.",
            },
            {
              title: "Reply consistency",
              description: "Үнэ, хүргэлт, бэлэн байдал зэрэг нийтлэг асуултад нэг хэлбэрийн хариулт өгнө.",
            },
            {
              title: "Human handoff",
              description: "Төлбөр, гомдол, эсвэл өндөр үнэ цэнтэй chat-уудыг баг руу дамжуулна.",
            },
          ],
          workflowTitle: "Conversation workflow",
          workflowSteps: [
            { step: "01", title: "Message arrives", detail: "Instagram эсвэл Messenger-ээс шинэ chat орж ирнэ." },
            { step: "02", title: "Intent is classified", detail: "AI нь pricing, order, support, эсвэл human-needed эсэхийг ялгана." },
            { step: "03", title: "Action is triggered", detail: "Reply, lead capture, эсвэл handoff rule ажиллана." },
          ],
          sideNote: "Энэ бүтэц нь home page дээрх preview болон dashboard shell хоёрыг хооронд нь илүү уялдуулж өгнө.",
        }
      : {
          eyebrow: "What improves inside the workflow",
          title: "The path from first message to next action is now easier to read across the whole product",
          subtitle:
            "The new direction keeps the landing page and dashboard shell aligned, so people understand what happened and what needs attention faster.",
          cards: [
            {
              title: "Lead routing",
              description: "Separate likely buyers from routine FAQ traffic earlier.",
            },
            {
              title: "Reply consistency",
              description: "Keep pricing, delivery, and availability answers more stable across channels.",
            },
            {
              title: "Human handoff",
              description: "Move payment issues, complaints, and high-value chats to your team at the right time.",
            },
          ],
          workflowTitle: "Conversation workflow",
          workflowSteps: [
            { step: "01", title: "Message arrives", detail: "A new conversation comes in from Instagram or Messenger." },
            { step: "02", title: "Intent is classified", detail: "AI sorts whether it is pricing, order help, support, or human-needed." },
            { step: "03", title: "Action is triggered", detail: "A reply, lead capture, or handoff rule takes over." },
          ],
          sideNote: "This structure also makes the home preview and dashboard shell feel like parts of one product story.",
        };

  return (
    <section ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
        >
          <p className="section-label">{copy.eyebrow}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{copy.subtitle}</p>

          <div className="mt-8 space-y-4">
            {copy.cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: -18 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 + index * 0.06 }}
                className="surface-panel rounded-[28px] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-primary">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="surface-card rounded-[32px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">System view</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{copy.workflowTitle}</h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Running</div>
          </div>

          <div className="mt-6 space-y-4">
            {copy.workflowSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
                className="rounded-[26px] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{step.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
            {copy.sideNote}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
