"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EMPTY_GUIDED_SECTIONS,
  composePromptFromSections,
  estimateTokensFromChars,
  evaluatePromptHealth,
  parsePromptToSections,
  type GuidedBotSections,
} from "@/lib/bot-prompt";

export interface BotConfigSavePayload {
  botName: string;
  botPrompt: string;
  welcomeMessage: string;
  botTone: string;
}

interface SaveResult {
  ok: boolean;
  error?: string;
}

interface Props {
  initialBotName: string;
  initialBotPrompt: string;
  initialWelcomeMessage: string;
  initialBotTone: string;
  onSave: (payload: BotConfigSavePayload) => Promise<SaveResult>;
  onSaved?: () => void;
  onBack?: () => void;
  submitLabel?: string;
}

const TONE_OPTIONS = [
  { value: "friendly", label: "Найрсаг", desc: "Дулаахан, эелдэг" },
  { value: "professional", label: "Мэргэжлийн", desc: "Албан ёсны, нарийн" },
  { value: "formal", label: "Албан ёсны", desc: "Нухацтай, хүндэтгэлтэй" },
  { value: "casual", label: "Хэвийн", desc: "Ярианы хэлтэй" },
] as const;

const SECTION_META: Array<{
  key: keyof GuidedBotSections;
  label: string;
  helper: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
}> = [
  {
    key: "businessContext",
    label: "Бизнесийн нэр ба контекст",
    helper: "Танай бизнес юу хийдэг, хаана ажилладаг, ямар төрлийн хэрэглэгчдэд үйлчилдгийг бичнэ.",
    placeholder: "Ж: Nexon Coffee нь Улаанбаатарт байрлах specialty coffee shop...",
    required: true,
    rows: 3,
  },
  {
    key: "offerings",
    label: "Юу зардаг вэ",
    helper: "Гол бүтээгдэхүүн, үйлчилгээ, үнийн мэдээллийн хүрээ, захиалгын нөхцөл.",
    placeholder: "Ж: Espresso, latte, cold brew, dessert...",
    required: true,
    rows: 4,
  },
  {
    key: "faq",
    label: "Түгээмэл асуултууд (FAQ)",
    helper: "Хэрэглэгчдийн хамгийн их асуудаг 3-10 асуулт болон товч хариултыг оруулна.",
    placeholder: "Ж: Ажиллах цаг? Хүргэлт бий юу? Буцаалтын бодлого?",
    required: true,
    rows: 4,
  },
  {
    key: "outOfScope",
    label: "Хариулах ЁСГҮЙ зүйлс",
    helper: "Бот таамаглахгүй, өгөхгүй мэдээллүүд. Итгэлцлийг хамгаалах хамгийн чухал хэсэг.",
    placeholder: "Ж: Эмчилгээний зөвлөгөө, хууль эрх зүйн зөвлөгөө, баталгаагүй үнэ...",
    required: true,
    rows: 3,
  },
  {
    key: "extraNotes",
    label: "Нэмэлт заавар",
    helper: "Тусгай нөхцөл, brand voice, escalation заавар.",
    placeholder: "Ж: Хэрэглэгч уурласан бол эелдгээр уучлал хүсээд хүний оператор руу шилжүүлэх...",
    rows: 3,
  },
];

const DEFAULT_BOT_NAME = "Nexon Bot";

const HEALTH_META: Record<ReturnType<typeof evaluatePromptHealth>["level"], { color: string; label: string }> = {
  excellent: { color: "text-success", label: "Маш сайн" },
  good: { color: "text-primary", label: "Сайн" },
  fair: { color: "text-warning", label: "Дунд" },
  poor: { color: "text-danger", label: "Сайжруулах шаардлагатай" },
};

export default function BotConfigForm({
  initialBotName,
  initialBotPrompt,
  initialWelcomeMessage,
  initialBotTone,
  onSave,
  onSaved,
  onBack,
  submitLabel = "Хадгалах",
}: Props) {
  const parsed = useMemo(() => parsePromptToSections(initialBotPrompt), [initialBotPrompt]);
  const [mode, setMode] = useState<"guided" | "advanced">(
    parsed.isTemplatePrompt || !initialBotPrompt.trim() ? "guided" : "advanced"
  );
  const [botName, setBotName] = useState(initialBotName || DEFAULT_BOT_NAME);
  const [botTone, setBotTone] = useState(initialBotTone || "friendly");
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage || "");
  const [guidedSections, setGuidedSections] = useState<GuidedBotSections>(
    parsed.isTemplatePrompt ? parsed.sections : { ...EMPTY_GUIDED_SECTIONS }
  );
  const [advancedPrompt, setAdvancedPrompt] = useState(
    initialBotPrompt || composePromptFromSections(EMPTY_GUIDED_SECTIONS, initialBotTone || "friendly")
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");

  const prompt = useMemo(() => {
    if (mode === "guided") {
      return composePromptFromSections(guidedSections, botTone);
    }
    return advancedPrompt;
  }, [advancedPrompt, botTone, guidedSections, mode]);

  const promptLength = prompt.length;
  const approxTokens = estimateTokensFromChars(prompt);
  const health = evaluatePromptHealth(prompt, mode === "guided" ? guidedSections : undefined);
  const requiredGuidedComplete = SECTION_META.filter((section) => section.required).every(
    (section) => guidedSections[section.key].trim().length > 0
  );
  const canSave =
    prompt.trim().length > 0 &&
    promptLength <= 2000 &&
    (mode === "advanced" || requiredGuidedComplete);

  const handleModeChange = (nextMode: "guided" | "advanced") => {
    if (nextMode === mode) return;
    if (nextMode === "advanced") {
      setAdvancedPrompt(prompt);
    }
    setMode(nextMode);
  };

  const updateSection = (key: keyof GuidedBotSections, value: string) => {
    setGuidedSections((prev) => ({ ...prev, [key]: value }));
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
          message: testMessage.trim(),
          botPrompt: prompt.trim(),
          botName: botName.trim() || DEFAULT_BOT_NAME,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Тест алдаатай боллоо");
        return;
      }
      setTestReply(data.reply || "");
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      if (promptLength > 2000) {
        toast.error("Prompt 2000 тэмдэгтээс хэтэрсэн байна.");
      } else if (mode === "guided" && !requiredGuidedComplete) {
        toast.error("Guided талбарын заавал хэсгүүдийг бүрэн бөглөнө үү.");
      } else {
        toast.error("Bot-ийн тайлбар хоосон байна.");
      }
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({
        botName: botName.trim() || DEFAULT_BOT_NAME,
        botPrompt: prompt.trim(),
        welcomeMessage: welcomeMessage.trim(),
        botTone,
      });
      if (!result.ok) {
        toast.error(result.error || "Хадгалах үед алдаа гарлаа");
        return;
      }
      toast.success("Bot тохиргоо хадгалагдлаа");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Bot-ийн нэр</label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder={DEFAULT_BOT_NAME}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">
              Bot-ийн тайлбар <span className="text-danger">*</span>
            </label>
            <div className="inline-flex bg-surface-2 border border-border rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleModeChange("guided")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === "guided" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Guided
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("advanced")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === "advanced" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          {mode === "guided" ? (
            <div className="space-y-3">
              {SECTION_META.map((section) => (
                <div key={section.key}>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {section.label}
                    {section.required ? <span className="text-danger ml-1">*</span> : null}
                  </label>
                  <p className="text-xs text-muted mb-1.5">{section.helper}</p>
                  <textarea
                    value={guidedSections[section.key]}
                    onChange={(e) => updateSection(section.key, e.target.value)}
                    rows={section.rows || 3}
                    placeholder={section.placeholder}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors resize-y"
                  />
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={advancedPrompt}
              onChange={(e) => setAdvancedPrompt(e.target.value)}
              rows={8}
              placeholder="System prompt-оо энд шууд засна уу..."
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none"
            />
          )}

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-secondary">
              Тэмдэгт:{" "}
              <span className={`font-semibold ${promptLength > 2000 ? "text-danger" : "text-text-primary"}`}>
                {promptLength}/2000
              </span>
            </div>
            <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-secondary">
              Ойролцоо токен: <span className="font-semibold text-text-primary">~{approxTokens}</span>
            </div>
            <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-secondary">
              Prompt health: <span className={`font-semibold ${HEALTH_META[health.level].color}`}>{HEALTH_META[health.level].label}</span>
            </div>
          </div>
          {approxTokens > 1200 ? (
            <p className="mt-2 text-xs text-warning">
              Анхаар: prompt хэт урт байна (~{approxTokens} token). Хэт урт prompt нь хариултыг удаашруулж, чанарт нөлөөлж болно.
            </p>
          ) : null}
          {health.warnings.length > 0 && (
            <div className="mt-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 text-xs text-warning space-y-1">
              {health.warnings.slice(0, 3).map((warning) => (
                <p key={warning}>• {warning}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Тавтай морил мессеж <span className="text-muted text-xs">(заавал биш)</span>
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Сайн байна уу! Би танд яаж туслах вэ?"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
      </div>

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
            {testing ? "..." : "Турш"}
          </button>
        </div>
        {testReply && (
          <div className="mt-3 bg-background border border-border rounded-xl p-3 text-sm text-text-primary">
            <span className="text-xs text-primary font-medium block mb-1">{botName}:</span>
            {testReply}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex-1 border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Буцах
          </button>
        ) : null}
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
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
            <>
              {submitLabel}
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
