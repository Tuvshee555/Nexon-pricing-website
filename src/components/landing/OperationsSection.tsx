"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const operations = {
  mn: {
    eyebrow: "Юу автоматжуулах вэ?",
    title: "Bot танай борлуулалтын урсгалын аль хэсэгт туслах вэ",
    subtitle:
      "Зөвхөн мессеж хариулах биш, хэрэглэгчийг чиглүүлэх, шүүх, мэдээлэл цуглуулах, танай багт чухал чатуудыг дамжуулахад ашиглана.",
    cards: [
      {
        title: "Бүтээгдэхүүн, үнэ, хүргэлтийн асуулт",
        description: "FAQ, бэлэн байгаа эсэх, үнэ, хүргэлтийн хугацааг тогтвортой хариулна.",
      },
      {
        title: "Захиалга ба хүсэлт ангилах",
        description: "Хэрэглэгчийн зорилгыг ойлгож захиалга, лавлагаа, хамтын ажиллагааг ялгана.",
      },
      {
        title: "Баг руу дамжуулах цэг",
        description: "Төлбөр, гомдол, нарийн тохиолдлыг хүний хяналт руу шилжүүлнэ.",
      },
      {
        title: "Хяналт ба гүйцэтгэлийн мэдээлэл",
        description: "Ямар асуулт их ирж байгааг, хэд нь шийдэгдэж байгааг самбараас харна.",
      },
    ],
    flowTitle: "Чатнаас борлуулалт руу",
    flowSubtitle: "Нэг мессежийг хэрэгтэй алхам руу шилжүүлэх бүтэц",
    stages: [
      {
        step: "01",
        title: "Мессеж орж ирнэ",
        detail: "Instagram эсвэл Messenger дээрх асуулт бот руу шууд орно.",
        tag: "New message",
      },
      {
        step: "02",
        title: "AI ойлгож ангилна",
        detail: "Үнэ асууж байна уу, захиалах гэж байна уу, эсвэл менежер хэрэгтэй юу гэдгийг танина.",
        tag: "Intent routing",
      },
      {
        step: "03",
        title: "Хариулт эсвэл дараагийн алхам",
        detail: "Шууд хариулна, мэдээлэл авна, эсвэл баг руу шилжүүлнэ.",
        tag: "Action",
      },
    ],
    sideStats: [
      { label: "Автомат хариулж болох давтагддаг асуулт", value: "High" },
      { label: "Хүний оролцоо шаарддаг чат", value: "Low" },
      { label: "Өдөр тутмын харагдац", value: "Live dashboard" },
    ],
  },
  en: {
    eyebrow: "What gets automated",
    title: "Where the bot helps in your sales workflow",
    subtitle:
      "It does more than answer messages. It can guide visitors, classify requests, collect information, and hand important chats to your team.",
    cards: [
      {
        title: "Product, price, and delivery questions",
        description: "Handle FAQs, availability, price checks, and delivery timing with consistent answers.",
      },
      {
        title: "Order and inquiry qualification",
        description: "Identify whether the visitor wants to buy, ask for support, or start a partnership conversation.",
      },
      {
        title: "Smart handoff to your team",
        description: "Send payment issues, complaints, or complex requests to a human at the right moment.",
      },
      {
        title: "Reporting and performance visibility",
        description: "See what customers ask most often and how many chats are being resolved automatically.",
      },
    ],
    flowTitle: "From incoming chat to next action",
    flowSubtitle: "A simple visual model for how one message gets handled",
    stages: [
      {
        step: "01",
        title: "Message arrives",
        detail: "A question comes in from Instagram or Messenger.",
        tag: "New message",
      },
      {
        step: "02",
        title: "AI understands intent",
        detail: "It detects whether the visitor needs pricing, ordering help, or a manager.",
        tag: "Intent routing",
      },
      {
        step: "03",
        title: "Reply or handoff",
        detail: "The bot answers directly, collects details, or escalates the chat.",
        tag: "Action",
      },
    ],
    sideStats: [
      { label: "Repeat questions suited for automation", value: "High" },
      { label: "Chats that need manual handling", value: "Low" },
      { label: "Daily visibility", value: "Live dashboard" },
    ],
  },
} as const;

export default function OperationsSection() {
  const { lang } = useLanguage();
  const copy = operations[lang];
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background aurora */}
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-[40rem] w-[40rem] rounded-full opacity-10"
        style={{
          background: "radial-gradient(ellipse, rgba(123,97,255,0.8) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "aurora3 16s ease-in-out infinite",
        }}
      />

      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">

          {/* Left — text + cards */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-sm font-semibold uppercase tracking-[0.22em] text-accent"
            >
              {copy.eyebrow}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-4xl font-black text-text-primary sm:text-5xl"
            >
              {copy.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary"
            >
              {copy.subtitle}
            </motion.p>

            <div className="mt-8 grid gap-4">
              {copy.cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.25 + index * 0.1 }}
                  className="group rounded-3xl border border-border bg-surface/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-accent transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/15"
                    >
                      <span className="text-sm font-black">{String(index + 1).padStart(2, "0")}</span>
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary group-hover:text-gradient transition-all duration-300">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — workflow card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface/90 p-6 backdrop-blur-sm">
              {/* Top glow line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-text-primary">{copy.flowTitle}</p>
                  <p className="mt-2 text-sm text-text-secondary">{copy.flowSubtitle}</p>
                </div>
                <motion.div
                  animate={{ borderColor: ["rgba(0,212,255,0.2)", "rgba(0,212,255,0.6)", "rgba(0,212,255,0.2)"] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="rounded-full border px-3 py-1 text-xs font-semibold text-accent bg-accent/10"
                >
                  Workflow
                </motion.div>
              </div>

              <div className="mt-8 space-y-5">
                {copy.stages.map((stage, index) => (
                  <motion.div
                    key={stage.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                    className="relative rounded-3xl border border-border/80 bg-background/70 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
                  >
                    {index < copy.stages.length - 1 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={isInView ? { height: 20 } : {}}
                        transition={{ duration: 0.4, delay: 0.8 + index * 0.15 }}
                        className="absolute left-8 top-full w-px overflow-hidden"
                        style={{ background: "linear-gradient(to bottom, rgba(15,79,232,0.6), rgba(0,212,255,0.2))" }}
                      />
                    )}
                    <div className="flex items-start gap-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={isInView ? { scale: 1, rotate: 0 } : {}}
                        transition={{ type: "spring", stiffness: 300, delay: 0.5 + index * 0.15 }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card-gradient text-sm font-black text-text-primary"
                        style={{ boxShadow: "0 0 20px rgba(15,79,232,0.2)" }}
                      >
                        {stage.step}
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-text-primary">{stage.title}</h3>
                          <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                            {stage.tag}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                          {stage.detail}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {copy.sideStats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
                    className="rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:border-accent/30"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{stat.label}</div>
                    <div className="mt-3 text-lg font-black text-gradient">{stat.value}</div>
                  </motion.div>
                ))}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
