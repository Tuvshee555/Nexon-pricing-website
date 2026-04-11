"use client";

import { useEffect, useState } from "react";

interface Broadcast {
  id: string;
  message: string;
  platform: string;
  status: string;
  sent_count: number;
  sent_at: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  sending: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-700",
};

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [contactCount, setContactCount] = useState(0);
  const [form, setForm] = useState({ message: "", platform: "all" });
  const [result, setResult] = useState<{ sentCount: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/broadcasts").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
    ]).then(([bd, cd]) => {
      setBroadcasts(bd.broadcasts || []);
      setContactCount((cd.contacts || []).length);
      setLoading(false);
    });
  }, []);

  const send = async () => {
    if (!form.message.trim()) return;
    setSending(true);
    setResult(null);
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: form.message, platform: form.platform }),
    });
    const data = await res.json();
    if (data.success) {
      setResult({ sentCount: data.sentCount });
      setForm({ message: "", platform: "all" });
      // Refresh list
      const bd = await fetch("/api/broadcasts").then((r) => r.json());
      setBroadcasts(bd.broadcasts || []);
      setShowCompose(false);
    }
    setSending(false);
  };

  const audienceCount = form.platform === "all" ? contactCount : Math.ceil(contactCount * 0.6);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Broadcasting</h1>
            <p className="text-gray-500 text-sm mt-1">Send a message to all your contacts at once</p>
          </div>
          <button
            onClick={() => { setShowCompose(true); setResult(null); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            New Broadcast
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">Total contacts</p>
            <p className="text-3xl font-black text-gray-900">{contactCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">Broadcasts sent</p>
            <p className="text-3xl font-black text-gray-900">{broadcasts.filter((b) => b.status === "sent").length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">Total messages sent</p>
            <p className="text-3xl font-black text-gray-900">
              {broadcasts.reduce((sum, b) => sum + (b.sent_count || 0), 0)}
            </p>
          </div>
        </div>

        {/* Success result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-800">
              Broadcast sent successfully to {result.sentCount} contacts!
            </p>
          </div>
        )}

        {/* Compose */}
        {showCompose && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-5">Compose broadcast</h2>

            {/* Channel selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Channel</label>
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

            {/* Message */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Message</label>
              <textarea
                rows={4}
                placeholder="Write your broadcast message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{form.message.length} characters</p>
            </div>

            {/* Audience preview */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-indigo-700">
                This will be sent to approximately <strong>{audienceCount} contacts</strong>
                {form.platform !== "all" ? ` on ${form.platform}` : " across all channels"}.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={send}
                disabled={sending || !form.message.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send broadcast
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* History */}
        <h2 className="text-base font-bold text-gray-800 mb-4">Broadcast history</h2>
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-8">Loading...</div>
        ) : broadcasts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p className="text-gray-500 font-medium">No broadcasts sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 mb-2 leading-relaxed">{b.message}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                        {b.status}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{b.platform === "all" ? "All channels" : b.platform}</span>
                      {b.sent_count > 0 && (
                        <span className="text-xs text-gray-500 font-medium">{b.sent_count} sent</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {b.sent_at ? new Date(b.sent_at).toLocaleDateString() : new Date(b.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
