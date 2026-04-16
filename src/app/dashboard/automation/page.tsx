"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BotButton {
  title: string;
  type: "postback" | "url";
  reply?: string;
  url?: string;
}

interface Trigger {
  id: string;
  keyword: string;
  match_type: string;
  response: string;
  buttons: BotButton[];
  platform: string;
  enabled: boolean;
  sequence_id?: string | null;
  trigger_fires_count?: number;
  created_at: string;
}

interface Sequence {
  id: string;
  name: string;
  enabled: boolean;
}

interface CommentTrigger {
  id: string;
  keyword: string;
  match_type: string;
  public_reply_text: string;
  dm_message: string;
  like_comment: boolean;
  platform: string;
  enabled: boolean;
  trigger_fires_count?: number;
  created_at: string;
}

const matchTypeLabels: Record<string, string> = {
  contains: "Contains",
  exact: "Exact match",
  starts_with: "Starts with",
};

const emptyButton = (): BotButton => ({ title: "", type: "postback", reply: "" });

const starterIdeas = [
  { title: "Price check", description: "Answer pricing questions consistently." },
  { title: "Delivery ETA", description: "Explain delivery windows automatically." },
  { title: "Human handoff", description: "Send complex chats to the team." },
];

export default function AutomationPage() {
  // ── Message triggers ──────────────────────────────────────────────
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedButtons, setExpandedButtons] = useState<string | null>(null);

  const [form, setForm] = useState({
    keyword: "",
    matchType: "contains",
    response: "",
    platform: "all",
    sequenceId: "",
    buttons: [] as BotButton[],
  });

  // ── Comment triggers ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"messages" | "comments">("messages");
  const [commentTriggers, setCommentTriggers] = useState<CommentTrigger[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentTriggersLoaded, setCommentTriggersLoaded] = useState(false);

  const [commentForm, setCommentForm] = useState({
    keyword: "",
    matchType: "contains",
    publicReplyText: "✅ Sent! Check your DM",
    dmMessage: "",
    likeComment: true,
    platform: "all",
  });

  const load = async () => {
    setLoading(true);
    const [triggersRes, sequencesRes] = await Promise.all([fetch("/api/automation"), fetch("/api/sequences")]);
    const triggersData = await triggersRes.json();
    const sequencesData = await sequencesRes.json();
    setTriggers(
      (triggersData.triggers || []).map((t: Omit<Trigger, "buttons"> & { buttons?: BotButton[] }) => ({
        ...t,
        buttons: t.buttons || [],
      }))
    );
    setSequences(sequencesData.sequences || []);
    setLoading(false);
  };

  const loadCommentTriggers = async () => {
    setCommentLoading(true);
    const res = await fetch("/api/comment-triggers");
    const data = await res.json();
    setCommentTriggers(data.triggers || []);
    setCommentLoading(false);
    setCommentTriggersLoaded(true);
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (activeTab === "comments" && !commentTriggersLoaded) {
      void loadCommentTriggers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, commentTriggersLoaded]);

  const resetForm = () => {
    setForm({ keyword: "", matchType: "contains", response: "", platform: "all", sequenceId: "", buttons: [] });
  };

  const resetCommentForm = () => {
    setCommentForm({
      keyword: "",
      matchType: "contains",
      publicReplyText: "✅ Sent! Check your DM",
      dmMessage: "",
      likeComment: true,
      platform: "all",
    });
  };

  const save = async () => {
    if (!form.keyword.trim() || !form.response.trim()) return;
    const validButtons = form.buttons.filter((b) => {
      if (!b.title.trim()) return false;
      if (b.type === "postback" && !b.reply?.trim()) return false;
      if (b.type === "url" && !b.url?.trim()) return false;
      return true;
    });

    setSaving(true);
    const res = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: form.keyword,
        matchType: form.matchType,
        response: form.response,
        platform: form.platform,
        sequenceId: form.sequenceId || null,
        buttons: validButtons,
      }),
    });
    const data = await res.json();
    if (data.trigger) {
      setTriggers((prev) => [{ ...data.trigger, buttons: data.trigger.buttons || [] }, ...prev]);
      resetForm();
      setShowForm(false);
    }
    setSaving(false);
  };

  const saveCommentTrigger = async () => {
    if (!commentForm.keyword.trim() || !commentForm.dmMessage.trim()) return;
    setSavingComment(true);
    const res = await fetch("/api/comment-triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: commentForm.keyword,
        matchType: commentForm.matchType,
        publicReplyText: commentForm.publicReplyText,
        dmMessage: commentForm.dmMessage,
        likeComment: commentForm.likeComment,
        platform: commentForm.platform,
      }),
    });
    const data = await res.json();
    if (data.trigger) {
      setCommentTriggers((prev) => [data.trigger, ...prev]);
      resetCommentForm();
      setShowCommentForm(false);
    }
    setSavingComment(false);
  };

  const deleteTrigger = async (id: string) => {
    await fetch("/api/automation", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteCommentTrigger = async (id: string) => {
    await fetch("/api/comment-triggers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCommentTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTrigger = async (id: string, enabled: boolean) => {
    await fetch("/api/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  const toggleCommentTrigger = async (id: string, enabled: boolean) => {
    await fetch("/api/comment-triggers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setCommentTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  const addButton = () => {
    if (form.buttons.length >= 3) return;
    setForm((f) => ({ ...f, buttons: [...f.buttons, emptyButton()] }));
  };

  const updateButton = (i: number, patch: Partial<BotButton>) => {
    setForm((f) => {
      const next = [...f.buttons];
      next[i] = { ...next[i], ...patch };
      return { ...f, buttons: next };
    });
  };

  const removeButton = (i: number) => {
    setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));
  };

  const selectedSequence = sequences.find((s) => s.id === form.sequenceId) ?? null;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      {/* Header */}
      <div className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Automation</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Keyword triggers with button replies
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Build smart replies with up to 3 tap-able buttons — just like ManyChat. Buttons send follow-up replies or open URLs.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/flows" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Open flows
            </Link>
            {activeTab === "messages" ? (
              <button
                onClick={() => { setShowForm(true); resetForm(); }}
                className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                New trigger
              </button>
            ) : (
              <button
                onClick={() => { setShowCommentForm(true); resetCommentForm(); }}
                className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                New comment trigger
              </button>
            )}
          </div>
        </div>

        {activeTab === "messages" && (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {starterIdeas.map((item, index) => (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-primary">
                  0{index + 1}
                </div>
                <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("messages")}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "messages"
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Message Triggers
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "comments"
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Comment Triggers
        </button>
      </div>

      {/* ── Message Triggers tab ──────────────────────────────────────── */}
      {activeTab === "messages" && (
        <>
          {/* Create form */}
          {showForm && (
            <div className="surface-panel rounded-[30px] p-6">
              <h2 className="mb-5 text-xl font-black text-slate-900">Create keyword trigger</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. hello, price, hours"
                    value={form.keyword}
                    onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Match type</label>
                  <select
                    value={form.matchType}
                    onChange={(e) => setForm({ ...form, matchType: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                  >
                    <option value="contains">Contains</option>
                    <option value="exact">Exact match</option>
                    <option value="starts_with">Starts with</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Message text</label>
                <textarea
                  rows={3}
                  placeholder="Type the automatic reply message..."
                  value={form.response}
                  onChange={(e) => setForm({ ...form, response: e.target.value })}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* ── Button Builder ── */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Buttons</span>
                    <span className="ml-2 text-xs text-slate-400">(up to 3)</span>
                  </div>
                  {form.buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={addButton}
                      className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Add button
                    </button>
                  )}
                </div>

                {form.buttons.length === 0 ? (
                  <button
                    type="button"
                    onClick={addButton}
                    className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-5 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                  >
                    + Add up to 3 buttons to your message
                  </button>
                ) : (
                  <div className="space-y-3">
                    {form.buttons.map((btn, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                            {i + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">Button {i + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeButton(i)}
                            className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="mb-1 block text-xs text-slate-500">Button label</label>
                            <input
                              type="text"
                              placeholder="e.g. View Pricing"
                              maxLength={20}
                              value={btn.title}
                              onChange={(e) => updateButton(i, { title: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                            />
                            <p className="mt-0.5 text-right text-xs text-slate-400">{btn.title.length}/20</p>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-slate-500">Action</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updateButton(i, { type: "postback" })}
                                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                                  btn.type === "postback"
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Text reply
                              </button>
                              <button
                                type="button"
                                onClick={() => updateButton(i, { type: "url" })}
                                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                                  btn.type === "url"
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Open URL
                              </button>
                            </div>
                          </div>
                        </div>

                        {btn.type === "postback" ? (
                          <div>
                            <label className="mb-1 block text-xs text-slate-500">Reply when tapped</label>
                            <textarea
                              rows={2}
                              placeholder="Message the bot sends when this button is tapped..."
                              value={btn.reply || ""}
                              onChange={(e) => updateButton(i, { reply: e.target.value })}
                              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="mb-1 block text-xs text-slate-500">URL to open</label>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={btn.url || ""}
                              onChange={(e) => updateButton(i, { url: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                            />
                            <p className="mt-1 text-xs text-slate-400">URL buttons only work on Messenger. Instagram shows the button but can&apos;t open URLs.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Channel</label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "messenger", "instagram"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, platform: p })}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                          form.platform === p
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p === "all" ? "All channels" : p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Enroll in sequence</label>
                  <select
                    value={form.sequenceId}
                    onChange={(e) => setForm({ ...form, sequenceId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                  >
                    <option value="">No sequence</option>
                    {sequences.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {selectedSequence && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Trigger fires will restart <span className="font-semibold text-slate-600">{selectedSequence.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save trigger"}
                </button>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Trigger list */}
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">Loading...</div>
          ) : triggers.length === 0 ? (
            <div className="surface-panel rounded-[30px] p-12 text-center">
              <svg className="mx-auto mb-3 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="mb-1 font-medium text-slate-600">No triggers yet</p>
              <p className="text-sm text-slate-400">
                Create your first keyword trigger to auto-reply and enroll contacts in a sequence.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {triggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className={`surface-card rounded-[26px] p-5 transition-opacity ${!trigger.enabled ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleTrigger(trigger.id, trigger.enabled)}
                      className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                        trigger.enabled ? "bg-slate-900" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          trigger.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Keyword + meta */}
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary">
                          &quot;{trigger.keyword}&quot;
                        </span>
                        <span className="text-xs text-slate-400">{matchTypeLabels[trigger.match_type] || trigger.match_type}</span>
                        {trigger.platform !== "all" && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-500">
                            {trigger.platform}
                          </span>
                        )}
                        {trigger.sequence_id && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            Enrolls sequence
                          </span>
                        )}
                        {trigger.buttons.length > 0 && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                            {trigger.buttons.length} button{trigger.buttons.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Message text */}
                      <p className="text-sm leading-relaxed text-slate-600">{trigger.response}</p>

                      {/* Buttons preview */}
                      {trigger.buttons.length > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setExpandedButtons(expandedButtons === trigger.id ? null : trigger.id)}
                            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            {expandedButtons === trigger.id ? "▲ Hide buttons" : "▼ Show buttons"}
                          </button>

                          {expandedButtons === trigger.id && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {trigger.buttons.map((btn, bi) => (
                                <div
                                  key={bi}
                                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
                                >
                                  {btn.type === "url" ? (
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  )}
                                  <span className="text-xs font-semibold text-slate-700">{btn.title}</span>
                                  <span className="text-xs text-slate-400">
                                    {btn.type === "url" ? btn.url?.slice(0, 30) : `→ "${btn.reply?.slice(0, 30)}${(btn.reply?.length ?? 0) > 30 ? "…" : ""}"`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{trigger.trigger_fires_count || 0} fires</span>
                        <span>Created {new Date(trigger.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button onClick={() => deleteTrigger(trigger.id)} className="flex-shrink-0 text-slate-300 transition-colors hover:text-red-500">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-5">
            <div className="flex gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-slate-900">How buttons work</p>
                <p className="text-sm text-slate-600">
                  Buttons appear below your message as tappable chips. <strong>Text reply</strong> buttons send a follow-up message when tapped. <strong>Open URL</strong> buttons open a link (Messenger only). Buttons work on Messenger and Instagram.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Comment Triggers tab ──────────────────────────────────────── */}
      {activeTab === "comments" && (
        <>
          {/* Create form */}
          {showCommentForm && (
            <div className="surface-panel rounded-[30px] p-6">
              <h2 className="mb-5 text-xl font-black text-slate-900">New comment trigger</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. info, price, interested"
                    value={commentForm.keyword}
                    onChange={(e) => setCommentForm({ ...commentForm, keyword: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Match type</label>
                  <select
                    value={commentForm.matchType}
                    onChange={(e) => setCommentForm({ ...commentForm, matchType: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                  >
                    <option value="contains">Contains</option>
                    <option value="exact">Exact match</option>
                    <option value="starts_with">Starts with</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">Public reply text</label>
                <input
                  type="text"
                  placeholder="✅ Sent! Check your DM"
                  value={commentForm.publicReplyText}
                  onChange={(e) => setCommentForm({ ...commentForm, publicReplyText: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                />
                <p className="mt-1 text-xs text-slate-400">Posted as a public reply to the comment.</p>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">DM message</label>
                <textarea
                  rows={3}
                  placeholder="The private message sent to the commenter..."
                  value={commentForm.dmMessage}
                  onChange={(e) => setCommentForm({ ...commentForm, dmMessage: e.target.value })}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "messenger", "instagram"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCommentForm({ ...commentForm, platform: p })}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                          commentForm.platform === p
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p === "all" ? "All" : p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <button
                    type="button"
                    onClick={() => setCommentForm({ ...commentForm, likeComment: !commentForm.likeComment })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                      commentForm.likeComment ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        commentForm.likeComment ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-slate-600">Like the comment</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveCommentTrigger}
                  disabled={savingComment}
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingComment ? "Saving..." : "Save trigger"}
                </button>
                <button
                  onClick={() => { setShowCommentForm(false); resetCommentForm(); }}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Comment trigger list */}
          {commentLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">Loading...</div>
          ) : commentTriggers.length === 0 ? (
            <div className="surface-panel rounded-[30px] p-12 text-center">
              <svg className="mx-auto mb-3 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mb-1 font-medium text-slate-600">No comment triggers yet</p>
              <p className="text-sm text-slate-400">
                When someone comments with your keyword, the bot likes, replies publicly, and sends a DM automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {commentTriggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className={`surface-card rounded-[26px] p-5 transition-opacity ${!trigger.enabled ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleCommentTrigger(trigger.id, trigger.enabled)}
                      className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                        trigger.enabled ? "bg-slate-900" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          trigger.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary">
                          &quot;{trigger.keyword}&quot;
                        </span>
                        <span className="text-xs text-slate-400">{matchTypeLabels[trigger.match_type] || trigger.match_type}</span>
                        {trigger.platform !== "all" && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-500">
                            {trigger.platform}
                          </span>
                        )}
                        {trigger.like_comment && (
                          <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-600">
                            Likes comment
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">Public</span>
                          <p className="text-sm text-slate-600">{trigger.public_reply_text}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex-shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-primary">DM</span>
                          <p className="text-sm text-slate-600 line-clamp-2">{trigger.dm_message}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{trigger.trigger_fires_count || 0} fires</span>
                        <span>Created {new Date(trigger.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button onClick={() => deleteCommentTrigger(trigger.id)} className="flex-shrink-0 text-slate-300 transition-colors hover:text-red-500">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-5">
            <div className="flex gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="mb-0.5 text-sm font-semibold text-slate-900">How comment triggers work</p>
                <p className="text-sm text-slate-600">
                  When someone comments on your post with the keyword, the bot automatically likes their comment, replies publicly, and sends them a private DM with your message. Requires <strong>instagram_manage_comments</strong> permission (currently in Meta review).
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
