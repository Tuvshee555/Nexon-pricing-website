"use client";

import { useState } from "react";
import { toast } from "sonner";

interface PlatformAccount {
  id: string;
  platform: string;
  page_name?: string;
  page_id?: string;
  instagram_account_id?: string;
}

interface Props {
  businessId: string;
  botName: string;
  botPrompt: string;
  welcomeMessage: string;
  botTone: string;
  status: string;
  platformAccounts: PlatformAccount[];
}

const TONE_OPTIONS = [
  { value: "friendly", label: "Найрсаг" },
  { value: "professional", label: "Мэргэжлийн" },
  { value: "formal", label: "Албан ёсны" },
  { value: "casual", label: "Хэвийн" },
];

export default function BotConfigEditor({
  botName: initialBotName,
  botPrompt: initialBotPrompt,
  welcomeMessage: initialWelcome,
  botTone: initialTone,
  status: initialStatus,
  platformAccounts,
}: Props) {
  const [botName, setBotName] = useState(initialBotName);
  const [botPrompt, setBotPrompt] = useState(initialBotPrompt);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcome);
  const [botTone, setBotTone] = useState(initialTone);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Test bot
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business/update-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPrompt,
          botName,
          welcomeMessage,
          botTone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Алдаа гарлаа");
        return;
      }
      toast.success("Bot тохиргоо хадгалагдлаа");
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = status === "active" ? "paused" : "active";
    setToggling(true);
    try {
      const res = await fetch("/api/business/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Алдаа гарлаа");
        return;
      }
      setStatus(newStatus);
      toast.success(newStatus === "active" ? "Bot идэвхжлээ" : "Bot түр зогслоо");
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setToggling(false);
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
        body: JSON.stringify({ message: testMessage, botPrompt, botName }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestReply(data.reply);
      } else {
        toast.error(data.error || "Тест алдаатай");
      }
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setTesting(false);
    }
  };

  const statusColor: Record<string, string> = {
    active: "text-success bg-success/10 border-success/30",
    paused: "text-warning bg-warning/10 border-warning/30",
    cancelled: "text-danger bg-danger/10 border-danger/30",
  };

  const statusLabel: Record<string, string> = {
    active: "Идэвхтэй",
    paused: "Түр зогссон",
    cancelled: "Цуцлагдсан",
  };

  return (
    <div className="space-y-5">
      {/* Status + toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">Bot төлөв</p>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusColor[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
          {status !== "cancelled" && (
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`flex items-center gap-2 font-medium px-4 py-2 rounded-xl text-sm transition-colors ${
                status === "active"
                  ? "bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30"
                  : "bg-success/10 hover:bg-success/20 text-success border border-success/30"
              } disabled:opacity-50`}
            >
              {toggling ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : status === "active" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Зогсоох
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Эхлүүлэх
                </>
              )}
            </button>
          )}
        </div>

        {/* Connected platforms */}
        {platformAccounts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted mb-2">Холбосон платформ</p>
            <div className="flex flex-wrap gap-2">
              {platformAccounts.map((pa) => (
                <span
                  key={pa.id}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    pa.platform === "instagram"
                      ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                      : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    {pa.platform === "instagram" ? (
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    ) : (
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    )}
                  </svg>
                  {pa.page_name || (pa.platform === "instagram" ? "Instagram" : "Messenger")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bot config form */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-text-primary">Bot тохиргоо</h2>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Bot-ийн нэр</label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Хариулах маяг</label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setBotTone(t.value)}
                className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                  botTone === t.value
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-surface-2 border-border text-text-secondary hover:border-primary/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Bot-ийн тайлбар</label>
          <textarea
            value={botPrompt}
            onChange={(e) => setBotPrompt(e.target.value)}
            rows={5}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-primary/60 transition-colors resize-none"
          />
          <p className="text-xs text-muted text-right mt-1">{botPrompt.length}/2000</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Тавтай морил мессеж <span className="text-muted text-xs">(заавал биш)</span>
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Сайн байна уу! Би танд яаж туслах вэ?"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </button>
      </div>

      {/* Test bot */}
      <div className="card p-5">
        <h2 className="font-bold text-text-primary mb-4">Bot туршиж үзэх</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Мессеж бичнэ үү..."
            className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/60 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
          />
          <button
            onClick={handleTest}
            disabled={!testMessage.trim() || testing}
            className="bg-primary/20 hover:bg-primary/30 disabled:opacity-50 text-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
          >
            {testing ? "..." : "Туршах"}
          </button>
        </div>
        {testReply && (
          <div className="mt-3 bg-surface-2 border border-border rounded-xl p-4 text-sm">
            <span className="text-xs text-primary font-medium block mb-2">{botName}:</span>
            <p className="text-text-primary leading-relaxed">{testReply}</p>
          </div>
        )}
      </div>
    </div>
  );
}
