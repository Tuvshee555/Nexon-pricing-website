"use client";

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Thread list */}
      <div className="flex flex-col w-80 border-r border-gray-200 bg-white flex-shrink-0">
        <div className="px-4 pt-6 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-black text-gray-900 mb-3">Live Chat</h1>
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-3"
          />
          <div className="flex gap-2">
            {["all", "instagram", "messenger"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterPlatform === p ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={`${t.sender_id}-${t.platform}`}
                onClick={() => loadThread(t)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.sender_id === t.sender_id && selected?.platform === t.platform
                    ? "bg-indigo-50 border-l-2 border-l-indigo-500"
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
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {selected.sender_id.slice(-2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{selected.sender_id}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platformColors[selected.platform] || "bg-gray-100 text-gray-600"}`}>
                {selected.platform}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {(selected.messages || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                      : "bg-indigo-600 text-white rounded-tr-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Read-only note */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This is the AI conversation history. Replies are sent automatically by the bot.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-base font-medium text-gray-500">Select a conversation</p>
          <p className="text-sm text-gray-400 mt-1">View AI conversation history</p>
        </div>
      )}
    </div>
  );
}
