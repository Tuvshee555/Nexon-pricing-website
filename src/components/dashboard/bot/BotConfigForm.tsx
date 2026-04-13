"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BUSINESS_TYPE_TEMPLATES,
  EMPTY_GUIDED_SECTIONS,
  FAQPair,
  compileFAQPairs,
  composePromptFromSections,
  estimateTokensFromChars,
  evaluatePromptHealth,
  parseFAQPairs,
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
  businessType?: string;
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
  isFaq?: boolean;
}> = [
  {
    key: "businessContext",
    label: "About your business",
    helper: "Describe what your business does, where it is, and who it serves. Include your opening hours here too.",
    placeholder: "e.g. Nexon Coffee is a specialty coffee shop in Ulaanbaatar. We serve espresso drinks, cold brew, and light meals. Open Mon–Sat 8am–8pm.",
    required: true,
    rows: 4,
  },
  {
    key: "offerings",
    label: "Products & services",
    helper: "List what you sell or offer, with prices if possible. This helps the bot answer questions like 'What do you have?' or 'How much is it?'",
    placeholder: "e.g.\n- Espresso: 5,000₮\n- Latte: 7,000₮\n- Cold brew: 8,000₮\n- Delivery available, min order 20,000₮",
    required: true,
    rows: 5,
  },
  {
    key: "faq",
    label: "Common questions & answers",
    helper: "Add the questions customers ask most often. The more you add, the better the bot will handle real conversations.",
    placeholder: "",
    required: true,
    isFaq: true,
  },
  {
    key: "outOfScope",
    label: "Topics the bot should avoid",
    helper: "Tell the bot what it should NOT answer or promise. This prevents wrong or risky responses.",
    placeholder: "e.g. Do not confirm prices not listed above. Do not give medical or legal advice. For refunds, direct customers to call us.",
    required: true,
    rows: 3,
  },
  {
    key: "extraNotes",
    label: "Extra instructions",
    helper: "Any special rules, brand voice notes, or escalation steps — like when to hand off to a human.",
    placeholder: "e.g. If a customer is upset, apologize first and offer to connect them with the manager. Always sign off with 'Have a great day!'",
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

function initFAQPairs(faqText: string): FAQPair[] {
  if (!faqText.trim()) return [{ q: "", a: "" }];
  const parsed = parseFAQPairs(faqText);
  return parsed && parsed.length > 0 ? parsed : [{ q: "", a: "" }];
}

export default function BotConfigForm({
  initialBotName,
  initialBotPrompt,
  initialWelcomeMessage,
  initialBotTone,
  businessType,
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
  const [faqPairs, setFaqPairs] = useState<FAQPair[]>(() =>
    initFAQPairs(parsed.isTemplatePrompt ? parsed.sections.faq : "")
  );
  const [advancedPrompt, setAdvancedPrompt] = useState(
    initialBotPrompt || composePromptFromSections(EMPTY_GUIDED_SECTIONS, initialBotTone || "friendly")
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);

  const effectiveSections = useMemo((): GuidedBotSections => ({
    ...guidedSections,
    faq: compileFAQPairs(faqPairs) || guidedSections.faq,
  }), [guidedSections, faqPairs]);

  const prompt = useMemo(() => {
    if (mode === "guided") {
      return composePromptFromSections(effectiveSections, botTone);
    }
    return advancedPrompt;
  }, [advancedPrompt, botTone, effectiveSections, mode]);

  const promptLength = prompt.length;
  const approxTokens = estimateTokensFromChars(prompt);
  const health = evaluatePromptHealth(prompt, mode === "guided" ? effectiveSections : undefined);
  const requiredGuidedComplete = SECTION_META.filter((s) => s.required).every((s) => {
    if (s.isFaq) return faqPairs.some((p) => p.q.trim() || p.a.trim());
    return guidedSections[s.key].trim().length > 0;
  });
  const canSave = prompt.trim().length > 0 && promptLength <= 2000 && (mode === "advanced" || requiredGuidedComplete);

  const handleModeChange = (nextMode: "guided" | "advanced") => {
    if (nextMode === mode) return;
    if (nextMode === "advanced") setAdvancedPrompt(prompt);
    setMode(nextMode);
  };

  const updateSection = (key: keyof GuidedBotSections, value: string) => {
    setGuidedSections((prev) => ({ ...prev, [key]: value }));
  };

  const loadTemplate = () => {
    const template = BUSINESS_TYPE_TEMPLATES[businessType || "other"] ?? BUSINESS_TYPE_TEMPLATES["other"];
    setGuidedSections({
      businessContext: template.businessContext,
      offerings: template.offerings,
      faq: template.faq,
      outOfScope: template.outOfScope,
      extraNotes: template.extraNotes,
    });
    const pairs = parseFAQPairs(template.faq);
    setFaqPairs(pairs && pairs.length > 0 ? pairs : [{ q: "", a: "" }]);
    setShowTemplateConfirm(false);
    toast.success("Template loaded — fill in the bracketed [placeholders] with your real info");
  };

  // FAQ pair helpers
  const updateFAQPair = (index: number, field: "q" | "a", value: string) => {
    setFaqPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };
  const addFAQPair = () => setFaqPairs((prev) => [...prev, { q: "", a: "" }]);
  const removeFAQPair = (index: number) => {
    setFaqPairs((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ q: "", a: "" }];
    });
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
        toast.error("Please fill in the required fields.");
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

  const templateLabel =
    businessType && BUSINESS_TYPE_TEMPLATES[businessType]
      ? businessType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "General";

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">

        {/* Bot name */}
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

        {/* Tone */}
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
                <p className="text-sm font-medium text-slate-900">{tone.label}</p>
                <p className="text-xs text-slate-500">{tone.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt builder */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-900">
              Bot knowledge <span className="text-red-500">*</span>
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
            <div className="space-y-4">
              {/* Template loader */}
              {!showTemplateConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowTemplateConfirm(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-400 hover:bg-slate-100"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Load a {templateLabel} template</p>
                    <p className="text-xs text-slate-500">Pre-fill all sections with example content you can edit</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-1 text-sm font-medium text-amber-900">Load template?</p>
                  <p className="mb-3 text-xs text-amber-700">
                    This will replace what you&apos;ve written so far with example content. You can edit everything after.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={loadTemplate}
                      className="rounded-lg bg-amber-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800"
                    >
                      Yes, load template
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTemplateConfirm(false)}
                      className="rounded-lg border border-amber-300 px-4 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Guided sections */}
              {SECTION_META.map((section) => (
                <div key={section.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-800">
                      {section.label}
                      {section.required ? <span className="ml-1 text-red-500">*</span> : null}
                    </label>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-slate-500">{section.helper}</p>

                  {section.isFaq ? (
                    /* Structured FAQ builder */
                    <div className="space-y-3">
                      {faqPairs.map((pair, idx) => (
                        <div key={idx} className="relative rounded-xl border border-slate-200 bg-white p-3">
                          {faqPairs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFAQPair(idx)}
                              className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              aria-label="Remove question"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          <div className="space-y-2 pr-6">
                            <div>
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Question</span>
                              <input
                                type="text"
                                value={pair.q}
                                onChange={(e) => updateFAQPair(idx, "q", e.target.value)}
                                placeholder="e.g. What are your opening hours?"
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="mb-1 block text-xs font-semibold text-slate-500">Answer</span>
                              <textarea
                                value={pair.a}
                                onChange={(e) => updateFAQPair(idx, "a", e.target.value)}
                                rows={2}
                                placeholder="e.g. We are open Mon–Sat from 9am to 8pm."
                                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addFAQPair}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add another question
                      </button>
                    </div>
                  ) : (
                    <textarea
                      value={guidedSections[section.key]}
                      onChange={(e) => updateSection(section.key, e.target.value)}
                      rows={section.rows || 3}
                      placeholder={section.placeholder}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
                    />
                  )}
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

          {/* Prompt stats */}
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
              Prompt health:{" "}
              <span className={`font-semibold ${HEALTH_META[health.level].color}`}>{HEALTH_META[health.level].label}</span>
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

        {/* Welcome message */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">
            Welcome message <span className="text-xs text-slate-500">(optional)</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">The first message the bot sends when someone opens the chat.</p>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hi! How can I help today?"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Test panel */}
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <p className="mb-1 text-sm font-medium text-slate-900">Test the bot</p>
        <p className="mb-3 text-xs text-slate-500">Try a question a real customer might send.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="e.g. What are your opening hours?"
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

      {/* Actions */}
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
