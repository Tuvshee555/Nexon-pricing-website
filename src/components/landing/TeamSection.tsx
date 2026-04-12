"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const teamCards = [
  { title: "Shared inbox", desc: "See what the team is handling without losing context." },
  { title: "Roles and notes", desc: "Make ownership and follow-up responsibilities clear." },
  { title: "Saved replies", desc: "Keep the brand voice stable across people and channels." },
];

export default function TeamSection() {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Team collaboration",
          title: "Хэрэв багтайгаа ажиллаж байгаа бол product чинь багийн дотоод хэлээр ярьдаг байх ёстой",
          subtitle:
            "Manychat-ийн давуу талын нэг нь team workflow. Чатаа хэн эзэмших, хэнд шилжих, ямар note үлдэхийг тодорхой болгох нь маш чухал.",
        }
      : {
          eyebrow: "Team collaboration",
          title: "If you work with a team, the product should speak the language of the team",
          subtitle:
            "One of Manychat’s strengths is team workflow. Ownership, handoff, and notes need to be obvious.",
        };

  return (
    <section ref={ref} className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="section-label">{copy.eyebrow}</p>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{copy.subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {teamCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="surface-panel rounded-[28px] p-5"
            >
              <h3 className="text-lg font-black text-slate-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
