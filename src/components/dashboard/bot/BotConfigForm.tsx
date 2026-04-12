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
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, helpful" },
  { value: "professional", label: "Professional", desc: "Clear, polished, precise" },
  { value: "formal", label: "Formal", desc: "Measured and respectful" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
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
    label: "Business context",
    helper: "Tell the bot what the business does, where it operates, and who it serves.",
    placeholder: "Example: Nexon Coffee is a specialty coffee shop in Ulaanbaatar...",
    required: true,
    rows: 3,
  },
  {
    key: "offerings",
    label: "What you sell",
    helper: "List products, services, price ranges, and ordering rules.",
    placeholder: "Example: Espresso, latte, cold brew, desserts...",
    required: true,
    rows: 4,
  },
  {
    key: "faq",
    label: "Frequently asked questions",
    helper: "Add the common questions users ask most often.",
    placeholder: "Example: Hours? Delivery? Refund policy?",
    required: true,
    rows: 4,
  },
  {
    key: "outOfScope",
    label: "What not to answer",
    helper: "Prevent the bot from guessing on sensitive or unsupported topics.",
    placeholder: "Example: Medical advice, legal advice, unconfirmed pricing...",
    required: true,
    rows: 3,
  },
  {
    key: "extraNotes",
    label: "Extra notes",
    helper: "Add special rules, brand voice notes, or escalation instructions.",
    placeholder: "Example: If the user is upset, apologize first and hand off to a human...",
    rows: 3,
  },
];

const DEFAULT_BOT_NAME = "Nexon Bot";

const HEALTH_META: Record<ReturnType<typeof evaluatePromptHealth>["level"], { color: string; label: string }> = {
  excellent: { color: "text-emerald-600", label: "Excellent" },
  good: { color: "text-slate-900", label: "Good" },
  fair: { color: "text-amber-600", label: "Needs a little work" },
  poor: { color: "text-red-600", label: "Needs improvement" },
};

export default function BotConfigForm({
  initialBotName,
  initialBotPrompt,
  initialWelcomeMessage,
  initialBotTone,
  onSave,
  onSaved,
  onBack,
  submitLabel = "Save",
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
  const canSave = prompt.trim().length > 0 && promptLength <= 2000 && (mode === "advanced" || requiredGuidedComplete);

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
        toast.error(data.error || "Test failed");
        return;
      }
      setTestReply(data.reply || "");
    } catch {
      toast.error("Connection error");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      if (promptLength > 2000) {
        toast.error("Prompt is over the 2000 character limit.");
      } else if (mode === "guided" && !requiredGuidedComplete) {
        toast.error("Please complete the required guided fields.");
      } else {
        toast.error("Bot prompt cannot be empty.");
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
        toast.error(result.error || "Could not save bot settings");
        return;
      }
      toast.success("Bot settings saved");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">Bot name</label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder={DEFAULT_BOT_NAME}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">Response tone</label>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => setBotTone(tone.value)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  botTone === tone.value ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className={`text-sm font-medium ${botTone === tone.value ? "text-slate-900" : "text-slate-900"}`}>
                  {tone.label}
                </p>
                <p className="text-xs text-slate-500">{tone.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-900">
              Bot prompt <span className="text-red-500">*</span>
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => handleModeChange("guided")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === "guided" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Guided
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("advanced")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === "advanced" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
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
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {section.label}
                    {section.required ? <span className="ml-1 text-red-500">*</span> : null}
                  </label>
                  <p className="mb-1.5 text-xs text-slate-500">{section.helper}</p>
                  <textarea
                    value={guidedSections[section.key]}
                    onChange={(e) => updateSection(section.key, e.target.value)}
                    rows={section.rows || 3}
                    placeholder={section.placeholder}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={advancedPrompt}
              onChange={(e) => setAdvancedPrompt(e.target.value)}
              rows={8}
              placeholder="Write the system prompt here..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
            />
          )}

          <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
              Characters:{" "}
              <span className={`font-semibold ${promptLength > 2000 ? "text-red-600" : "text-slate-900"}`}>
                {promptLength}/2000
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
              Approx tokens: <span className="font-semibold text-slate-900">~{approxTokens}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
              Prompt health: <span className={`font-semibold ${HEALTH_META[health.level].color}`}>{HEALTH_META[health.level].label}</span>
            </div>
          </div>
          {approxTokens > 1200 ? (
            <p className="mt-2 text-xs text-amber-600">
              Heads up: the prompt is getting long. Shorter prompts usually perform better.
            </p>
          ) : null}
          {health.warnings.length > 0 && (
            <div className="mt-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {health.warnings.slice(0, 3).map((warning) => (
                <p key={warning}>- {warning}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Welcome message <span className="text-xs text-slate-500">(optional)</span>
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hi! How can I help today?"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-900">Test the bot</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleTest()}
          />
          <button
            onClick={handleTest}
            disabled={!testMessage.trim() || testing}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {testing ? "..." : "Test"}
          </button>
        </div>
        {testReply && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900">
            <span className="mb-1 block text-xs font-medium text-slate-500">{botName}:</span>
            {testReply}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
          >
            Back
          </button>
        ) : null}
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              {submitLabel}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
