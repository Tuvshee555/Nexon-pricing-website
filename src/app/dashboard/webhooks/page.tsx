"use client";

import { useEffect, useState } from "react";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  created_at: string;
}

const ALL_EVENTS = [
  { value: "new_contact", label: "New contact" },
  { value: "message_received", label: "Message received" },
  { value: "payment_received", label: "Payment received" },
  { value: "conversation_escalated", label: "Conversation escalated" },
  { value: "broadcast_sent", label: "Broadcast sent" },
];

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: "", events: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/webhooks")
      .then((r) => r.json())
      .then((d) => { setEndpoints(d.endpoints || []); setLoading(false); });
  }, []);

  const toggleEvent = (ev: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(ev) ? prev.events.filter((e) => e !== ev) : [...prev.events, ev],
    }));
  };

  const save = async () => {
    if (!form.url || !form.events.length) return;
    setSaving(true);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { endpoint?: WebhookEndpoint & { secret?: string } };
    if (data.endpoint) {
      setNewSecret(data.endpoint.secret ?? null);
      setEndpoints((prev) => [data.endpoint!, ...prev]);
      setForm({ url: "", events: [] });
      setShowForm(false);
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleEnabled = async (ep: WebhookEndpoint) => {
    await fetch("/api/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ep.id, enabled: !ep.enabled }),
    });
    setEndpoints((prev) => prev.map((e) => e.id === ep.id ? { ...e, enabled: !e.enabled } : e));
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Webhooks</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Connect your app to anything
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Send real-time events to Zapier, Make, or your own server when things happen in Nexon.
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setNewSecret(null); }}
            className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
          >
            + Add webhook
          </button>
        </div>
      </section>

      {newSecret && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-800 mb-2">Save your signing secret — shown only once</p>
          <code className="block rounded-xl bg-white border border-amber-200 px-4 py-3 text-sm font-mono text-amber-900 break-all">
            {newSecret}
          </code>
          <p className="text-xs text-amber-700 mt-2">We sign every POST with <code>X-Nexon-Signature: sha256=...</code> using this secret.</p>
        </div>
      )}

      {showForm && (
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5">New webhook endpoint</h2>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Endpoint URL</label>
            <input
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-600 mb-3">Events to send</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((ev) => (
                <button
                  key={ev.value}
                  onClick={() => toggleEvent(ev.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    form.events.includes(ev.value)
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {ev.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving || !form.url || !form.events.length}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save endpoint"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-slate-400 py-10">Loading...</div>
      ) : endpoints.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500 font-medium">No webhooks configured</p>
          <p className="text-sm text-slate-400 mt-1">Add an endpoint to start sending events.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{ep.url}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ep.events.map((ev) => (
                      <span key={ev} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {ALL_EVENTS.find((e) => e.value === ev)?.label ?? ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => void toggleEnabled(ep)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      ep.enabled
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {ep.enabled ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => void remove(ep.id)}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
