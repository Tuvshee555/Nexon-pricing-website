"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  businessId: string;
  initialPrompt?: string;
  initialBotName?: string;
  initialWelcome?: string;
  initialTone?: string;
  onNext: () => void;
  onBack: () => void;
}

const TONE_OPTIONS = [
  { value: "friendly", label: "Найрсаг", desc: "Дулаахан, эелдэг" },
  { value: "professional", label: "Мэргэжлийн", desc: "Албан ёсны, нарийн" },
  { value: "formal", label: "Албан ёсны", desc: "Нухацтай, хүндэтгэлтэй" },
  { value: "casual", label: "Хэвийн", desc: "Ярианы хэлтэй" },
];

export default function Step4BotConfig({
  initialPrompt,
  initialBotName,
  initialWelcome,
  initialTone,
  onNext,
  onBack,
}: Props) {
  const [botName, setBotName] = useState(initialBotName || "Nexon Bot");
  const [botPrompt, setBotPrompt] = useState(
    initialPrompt ||
      "Та найрсаг, мэргэжлийн туслах AI байна. Хэрэглэгчдийн асуултад тодорхой, товч хариулна."
  );
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcome || "");
  const [botTone, setBotTone] = useState(initialTone || "friendly");
  const [loading, setLoading] = useState(false);

  // Test bot
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    if (!botPrompt.trim()) {
      toast.error("Bot-ийн тайлбар оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/business/update-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPrompt: botPrompt.trim(),
          botName: botName.trim() || "Nexon Bot",
          welcomeMessage: welcomeMessage.trim(),
          botTone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Алдаа гарлаа");
        return;
      }

      toast.success("Bot тохиргоо хадгалагдлаа");
      onNext();
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setTesting(true);
    setTestReply("");
    try {
      const res = await fetch("/api/business/test-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testMessage,
          botPrompt: botPrompt.trim(),
          botName: botName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestReply(data.reply);
      } else {
        toast.error(data.error || "Тест алдаатай дууссан");
      }
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Bot тохиргоо</h2>
        <p className="text-text-secondary text-sm">
          Таны bot хэрхэн хариулахыг тохируулна уу.
        </p>
      </div>

      <div className="space-y-4">
        {/* Bot name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Bot-ийн нэр</label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Nexon Bot"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        {/* Bot tone */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Хариулах маяг</label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => setBotTone(tone.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  botTone === tone.value
                    ? "bg-primary/10 border-primary/50"
                    : "bg-surface-2 border-border hover:border-primary/30"
                }`}
              >
                <p className={`text-sm font-medium ${botTone === tone.value ? "text-primary" : "text-text-primary"}`}>
                  {tone.label}
                </p>
                <p className="text-xs text-muted">{tone.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bot prompt */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Bot-ийн тайлбар <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted mb-2">
            Bot юу мэдэх вэ, хэрхэн хариулах вэ гэдгийг тайлбарлана уу.
          </p>
          <textarea
            value={botPrompt}
            onChange={(e) => setBotPrompt(e.target.value)}
            rows={5}
            placeholder="Жишээ: Та Nexon Coffee Shop-ийн туслах AI байна. Манай цэс, цагийн хуваарь, захиалгын тухай асуултад хариулна..."
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none"
          />
          <p className="text-xs text-muted text-right mt-1">{botPrompt.length}/2000</p>
        </div>

        {/* Welcome message */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Тавтай морил мессеж{" "}
            <span className="text-muted text-xs">(заавал биш)</span>
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Сайн байна уу! Би танд яаж туслах вэ?"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        {/* Test bot */}
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Bot туршиж үзэх</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Тест мессеж бичнэ үү..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-muted text-sm focus:outline-none focus:border-primary/60 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <button
              onClick={handleTest}
              disabled={!testMessage.trim() || testing}
              className="bg-primary/20 hover:bg-primary/30 disabled:opacity-50 text-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {testing ? "..." : "Туршах"}
            </button>
          </div>
          {testReply && (
            <div className="mt-3 bg-background border border-border rounded-xl p-3 text-sm text-text-primary">
              <span className="text-xs text-primary font-medium block mb-1">{botName}:</span>
              {testReply}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Буцах
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !botPrompt.trim()}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Хадгалж байна...
            </>
          ) : (
            <>
              Хадгалах
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
