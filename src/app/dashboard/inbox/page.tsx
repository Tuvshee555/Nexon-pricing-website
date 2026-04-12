"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Thread {
  sender_id: string;
  platform: string;
  last_message_at: string;
  messages: Array<{ role: string; content: string }>;
}

const platformColors: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700",
  messenger: "bg-blue-100 text-blue-700",
};

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then(async (d) => {
        // Fetch full thread for each contact
        const contacts = d.contacts || [];
        setThreads(contacts);
        setLoading(false);
      });
  }, []);

  const loadThread = async (contact: { sender_id: string; platform: string }) => {
    const res = await fetch(`/api/inbox/thread?senderId=${contact.sender_id}&platform=${contact.platform}`);
    const data = await res.json();
    setSelected(data.thread || null);
  };

  const filtered = threads.filter((t) => {
    const matchSearch = t.sender_id.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filterPlatform === "all" || t.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] overflow-hidden">
      <div className="mb-5 surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Inbox</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Live conversations, organized for action</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              See what needs a human, what can be automated, and what the team should follow up on next.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/automation" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Open automation
            </Link>
            <Link href="/dashboard/contacts" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              View contacts
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Incoming chats are visible here</div>
          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-primary">Handoffs stay readable</div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">Search by sender ID</div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-18rem)] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        {/* Thread list */}
        <div className="flex w-80 flex-shrink-0 flex-col border-r border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="mb-3 text-lg font-black text-slate-900">Threads</h2>
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
            <div className="flex flex-wrap gap-2">
            {["all", "instagram", "messenger"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterPlatform === p ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
          </div>

          <div className="flex-1 overflow-y-auto">
          {loading ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                <svg className="mb-2 h-10 w-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="mt-1 text-center text-xs text-slate-400">When chats arrive, they will appear here with platform and time context.</p>
              </div>
          ) : (
            filtered.map((t) => (
              <button
                key={`${t.sender_id}-${t.platform}`}
                onClick={() => loadThread(t)}
                  className={`w-full border-b border-slate-100 px-4 py-3.5 text-left transition-colors hover:bg-white ${
                  selected?.sender_id === t.sender_id && selected?.platform === t.platform
                    ? "bg-blue-50 border-l-2 border-l-primary"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {t.sender_id.slice(-2).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${platformColors[t.platform] ? "bg-current" : "bg-gray-400"}`}
                      style={{ backgroundColor: t.platform === "instagram" ? "#ec4899" : "#3b82f6" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-800 truncate">{t.sender_id}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {t.last_message_at ? timeAgo(t.last_message_at) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate capitalize">{t.platform}</p>
                    </div>
                  </div>
                </button>
            ))
          )}
        </div>
      </div>

      {/* Chat view */}
      {selected ? (
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-primary">
              {selected.sender_id.slice(-2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{selected.sender_id}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${platformColors[selected.platform] || "bg-slate-100 text-slate-600"}`}>
                {selected.platform}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-6 py-6">
            {(selected.messages || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                      : "rounded-tr-sm bg-slate-900 text-white"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Read-only note */}
          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This is the AI conversation history. Replies are sent automatically by the bot.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center bg-slate-50 text-slate-400">
          <svg className="mb-4 h-20 w-20 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-base font-medium text-slate-600">Select a conversation</p>
          <p className="mt-1 text-sm text-slate-400">View AI conversation history</p>
        </div>
      )}
      </div>
    </div>
  );
}
