"use client";

import { useLanguage } from "@/contexts/LanguageContext";

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

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              {copy.eyebrow}
            </p>
            <h2 className="mt-4 text-4xl font-black text-text-primary sm:text-5xl">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {copy.subtitle}
            </p>

            <div className="mt-8 grid gap-4">
              {copy.cards.map((card, index) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-border bg-surface/80 p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-accent">
                      <span className="text-sm font-black">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{card.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface/90 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-text-primary">{copy.flowTitle}</p>
                  <p className="mt-2 text-sm text-text-secondary">{copy.flowSubtitle}</p>
                </div>
                <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Workflow
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {copy.stages.map((stage, index) => (
                  <div key={stage.step} className="relative rounded-3xl border border-border/80 bg-background/70 p-5">
                    {index < copy.stages.length - 1 && (
                      <div className="absolute left-8 top-full h-5 w-px bg-gradient-to-b from-primary/60 to-accent/20" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card-gradient text-sm font-black text-text-primary">
                        {stage.step}
                      </div>
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
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {copy.sideStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/80 bg-background/70 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">{stat.label}</div>
                    <div className="mt-3 text-lg font-black text-text-primary">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
