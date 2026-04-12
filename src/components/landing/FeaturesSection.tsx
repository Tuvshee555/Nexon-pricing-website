"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeaturesSection() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Танай багт хэрэгтэй үндсэн давуу тал",
          title: "Мессежийг дан чат биш, ажиллах урсгал болгож харуулдаг интерфэйс",
          subtitle:
            "Manychat шиг ойлгомжтой байдал, гэхдээ Nexon-ы өөрийн өнгө төрхтэй. Танай баг эхний харагдацаас л юу болж байгааг ойлгоно.",
          cards: [
            {
              title: "Channel-first view",
              description: "Instagram, Messenger, lead qualification, handoff бүгд нэг логиктой харагдана.",
            },
            {
              title: "Action-friendly cards",
              description: "Нэг харцаар metrics, automation health, human takeover цэгүүд тод харагдана.",
            },
            {
              title: "Cleaner visual rhythm",
              description: "Неон, хэт futuristic эффект багасч, цэвэр card hierarchy болон spacing давамгайлна.",
            },
          ],
        }
      : {
          eyebrow: "The UI advantages your team actually feels",
          title: "An interface that treats conversations like an operating workflow, not just a chat log",
          subtitle:
            "It keeps the clarity people like about tools such as Manychat, but with a stronger Nexon identity and a calmer product rhythm.",
          cards: [
            {
              title: "Channel-first view",
              description: "Instagram, Messenger, lead qualification, and handoff points all sit inside one logic.",
            },
            {
              title: "Action-friendly cards",
              description: "Metrics, automation health, and human takeover moments are easier to scan.",
            },
            {
              title: "Cleaner visual rhythm",
              description: "Less neon and less sci-fi, more clear hierarchy, spacing, and purposeful product UI.",
            },
          ],
        };

  return (
    <section id="features" ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
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

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {copy.cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 26 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="surface-panel rounded-[28px] p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-2xl font-black text-slate-900">{card.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
