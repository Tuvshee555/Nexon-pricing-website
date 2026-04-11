"use client";

import { useEffect, useState } from "react";

interface Trigger {
  id: string;
  keyword: string;
  match_type: string;
  response: string;
  platform: string;
  enabled: boolean;
  created_at: string;
}

const matchTypeLabels: Record<string, string> = {
  contains: "Contains",
  exact: "Exact match",
  starts_with: "Starts with",
};

export default function AutomationPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    keyword: "",
    matchType: "contains",
    response: "",
    platform: "all",
  });

  useEffect(() => {
    fetch("/api/automation")
      .then((r) => r.json())
      .then((d) => { setTriggers(d.triggers || []); setLoading(false); });
  }, []);

  const save = async () => {
    if (!form.keyword.trim() || !form.response.trim()) return;
    setSaving(true);
    const res = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: form.keyword, matchType: form.matchType, response: form.response, platform: form.platform }),
    });
    const data = await res.json();
    if (data.trigger) {
      setTriggers((prev) => [data.trigger, ...prev]);
      setForm({ keyword: "", matchType: "contains", response: "", platform: "all" });
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
    setTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTrigger = async (id: string, enabled: boolean) => {
    await fetch("/api/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setTriggers((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Automation</h1>
            <p className="text-gray-500 text-sm mt-1">Keyword triggers — auto-reply when users send matching messages</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Trigger
          </button>
        </div>

        {/* New trigger form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-5">Create keyword trigger</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. hello, price, hours"
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Match type</label>
                <select
                  value={form.matchType}
                  onChange={(e) => setForm({ ...form, matchType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact match</option>
                  <option value="starts_with">Starts with</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Auto-reply message</label>
              <textarea
                rows={3}
                placeholder="Type the automatic reply message..."
                value={form.response}
                onChange={(e) => setForm({ ...form, response: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Channel</label>
              <div className="flex gap-2">
                {["all", "messenger", "instagram"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setForm({ ...form, platform: p })}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                      form.platform === p
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {p === "all" ? "All channels" : p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? "Saving..." : "Save trigger"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Trigger list */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading...</div>
        ) : triggers.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">No triggers yet</p>
            <p className="text-gray-400 text-sm">Create your first keyword trigger to auto-reply to messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {triggers.map((t) => (
              <div key={t.id} className={`bg-white border rounded-2xl p-5 flex items-start gap-4 transition-opacity ${!t.enabled ? "opacity-60" : ""} border-gray-200`}>
                {/* Toggle */}
                <button
                  onClick={() => toggleTrigger(t.id, t.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${t.enabled ? "bg-indigo-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${t.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      &quot;{t.keyword}&quot;
                    </span>
                    <span className="text-xs text-gray-400">{matchTypeLabels[t.match_type] || t.match_type}</span>
                    {t.platform !== "all" && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{t.platform}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{t.response}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTrigger(t.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info banner */}
        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-3">
          <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-indigo-800 mb-0.5">How keyword triggers work</p>
            <p className="text-sm text-indigo-600">When a user sends a message matching your keyword, the bot sends the exact reply you set — bypassing AI. Useful for pricing, hours, location, and FAQ replies.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
