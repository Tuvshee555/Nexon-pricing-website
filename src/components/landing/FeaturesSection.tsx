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
          eyebrow: "Яагаад Nexon Chat сонгох вэ",
          title: "Таны бизнес унтаж байхад ч хэрэглэгч хариулт авна",
          subtitle:
            "Instagram, Messenger, Telegram — бүх сувгаас ирсэн мессежэд автоматаар хариулна. Ажилтан хэрэггүй, шөнө ч, амралтын өдөр ч.",
          cards: [
            {
              title: "Шөнийн 2 цагт ч хариулна",
              description: "Хэрэглэгч мессеж бичихэд 3 секундэд автомат хариулт явна. Жижиг бизнес ч том компани шиг ажиллана.",
            },
            {
              title: "Instagram, Messenger, Telegram",
              description: "Гурван суваг нэг дороос удирдана. Ямар ч сувгаар ирсэн мессежийг нэг dashboard-оос харна.",
            },
            {
              title: "Тогтмол үнэ, гэнэтийн нэмэлт төлбөргүй",
              description: "Сарын тогтмол төлбөр. Хэрэглэгч олширвол нэмэлт төлбөр гардаггүй. Төлөвлөгөөгөө тайван барина.",
            },
          ],
        }
      : {
          eyebrow: "Why businesses choose Nexon Chat",
          title: "Your business replies instantly — even while you sleep",
          subtitle:
            "Instagram, Messenger, Telegram — every DM gets an instant reply. No staff needed, no missed leads at night or on weekends.",
          cards: [
            {
              title: "Reply in 3 seconds, 24/7",
              description: "Every message gets an instant AI response. Small businesses operate like a big company without hiring extra staff.",
            },
            {
              title: "Instagram, Messenger & Telegram",
              description: "All three channels in one dashboard. Manage every conversation from a single place, no switching between apps.",
            },
            {
              title: "Fixed price, no surprise bills",
              description: "One flat monthly fee. No overage charges if you go viral. You always know exactly what you pay.",
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
