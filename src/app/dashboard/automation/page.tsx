"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Trigger {
  id: string;
  keyword: string;
  match_type: string;
  response: string;
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

const matchTypeLabels: Record<string, string> = {
  contains: "Contains",
  exact: "Exact match",
  starts_with: "Starts with",
};

const starterIdeas = [
  { title: "Price check", description: "Answer pricing questions consistently." },
  { title: "Delivery ETA", description: "Explain delivery windows automatically." },
  { title: "Human handoff", description: "Send complex chats to the team." },
];

export default function AutomationPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    keyword: "",
    matchType: "contains",
    response: "",
    platform: "all",
    sequenceId: "",
  });

  const load = async () => {
    setLoading(true);
    const [triggersRes, sequencesRes] = await Promise.all([fetch("/api/automation"), fetch("/api/sequences")]);
    const triggersData = await triggersRes.json();
    const sequencesData = await sequencesRes.json();
    setTriggers(triggersData.triggers || []);
    setSequences(sequencesData.sequences || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!form.keyword.trim() || !form.response.trim()) return;
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
      }),
    });
    const data = await res.json();
    if (data.trigger) {
      setTriggers((prev) => [data.trigger, ...prev]);
      setForm({ keyword: "", matchType: "contains", response: "", platform: "all", sequenceId: "" });
      setShowForm(false);
    }
    setSaving(false);
  };

  const deleteTrigger = async (id: string) => {
    await fetch("/api/automation", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTriggers((prev) => prev.filter((trigger) => trigger.id !== id));
  };

  const toggleTrigger = async (id: string, enabled: boolean) => {
    await fetch("/api/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setTriggers((prev) => prev.map((trigger) => (trigger.id === id ? { ...trigger, enabled: !trigger.enabled } : trigger)));
  };

  const selectedSequence = sequences.find((sequence) => sequence.id === form.sequenceId) ?? null;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <div className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Automation</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Keyword triggers with clearer product logic
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Build replies and enrollments from obvious intent. Good automation starts with reusable patterns, not random rules.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/flows" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Open flows
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              New trigger
            </button>
          </div>
        </div>

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
      </div>

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
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Auto-reply message</label>
            <textarea
              rows={3}
              placeholder="Type the automatic reply message..."
              value={form.response}
              onChange={(e) => setForm({ ...form, response: e.target.value })}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Channel</label>
              <div className="flex flex-wrap gap-2">
                {["all", "messenger", "instagram"].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setForm({ ...form, platform })}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                      form.platform === platform
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {platform === "all" ? "All channels" : platform}
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
                {sequences.map((sequence) => (
                  <option key={sequence.id} value={sequence.id}>
                    {sequence.name}
                  </option>
                ))}
              </select>
              {selectedSequence ? (
                <p className="mt-1.5 text-xs text-slate-400">
                  Trigger fires will restart <span className="font-semibold text-slate-600">{selectedSequence.name}</span>
                </p>
              ) : null}
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
              onClick={() => setShowForm(false)}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
              className={`surface-card flex items-start gap-4 rounded-[26px] p-5 transition-opacity ${!trigger.enabled ? "opacity-60" : ""}`}
            >
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
                  {trigger.sequence_id ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      Enrolls sequence
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{trigger.response}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{trigger.trigger_fires_count || 0} fires</span>
                  <span>Created {new Date(trigger.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button onClick={() => deleteTrigger(trigger.id)} className="flex-shrink-0 text-slate-300 transition-colors hover:text-red-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[26px] border border-blue-100 bg-blue-50 p-5">
        <div className="flex gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="mb-0.5 text-sm font-semibold text-slate-900">How keyword triggers work</p>
            <p className="text-sm text-slate-600">
              When a user sends a message matching your keyword, the bot sends the reply you set and can optionally enroll that contact in a sequence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
