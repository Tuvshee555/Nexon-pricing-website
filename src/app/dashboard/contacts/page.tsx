"use client";

import { useEffect, useState } from "react";

interface Contact {
  sender_id: string;
  platform: string;
  last_message_at: string;
  message_count: number;
  last_message: string;
  tags: string[];
}

const platformColors: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-700",
  messenger: "bg-blue-100 text-blue-700",
};

const platformIcon = (p: string) =>
  p === "instagram" ? (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 6.016 4.432 10.984 10.206 11.852V15.18H7.237v-3.154h2.969V9.928c0-3.475 1.693-5 4.581-5 1.383 0 2.115.103 2.461.149v2.753h-1.97c-1.226 0-1.654 1.163-1.654 2.473v1.724h3.593l-.487 3.154h-3.106v8.697C19.481 23.083 24 18.075 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [newTag, setNewTag] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => {
        setContacts(d.contacts || []);
        setLoading(false);
      });
  }, []);

  const addTag = async (contact: Contact) => {
    if (!newTag.trim()) return;
    await fetch("/api/contacts/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: contact.sender_id, platform: contact.platform, tag: newTag.trim(), action: "add" }),
    });
    setContacts((prev) =>
      prev.map((c) =>
        c.sender_id === contact.sender_id && c.platform === contact.platform
          ? { ...c, tags: [...(c.tags || []), newTag.trim()] }
          : c
      )
    );
    if (selected?.sender_id === contact.sender_id) {
      setSelected((s) => s ? { ...s, tags: [...(s.tags || []), newTag.trim()] } : s);
    }
    setNewTag("");
  };

  const removeTag = async (contact: Contact, tag: string) => {
    await fetch("/api/contacts/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: contact.sender_id, platform: contact.platform, tag, action: "remove" }),
    });
    setContacts((prev) =>
      prev.map((c) =>
        c.sender_id === contact.sender_id && c.platform === contact.platform
          ? { ...c, tags: c.tags.filter((t) => t !== tag) }
          : c
      )
    );
    if (selected?.sender_id === contact.sender_id) {
      setSelected((s) => s ? { ...s, tags: s.tags.filter((t) => t !== tag) } : s);
    }
  };

  const filtered = contacts.filter((c) => {
    const matchSearch = c.sender_id.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filterPlatform === "all" || c.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left panel */}
      <div className="flex flex-col w-full max-w-sm border-r border-gray-200 bg-white flex-shrink-0">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-gray-900">Contacts</h1>
            <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {contacts.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all mb-3"
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

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">No contacts yet</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={`${c.sender_id}-${c.platform}`}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.sender_id === c.sender_id && selected?.platform === c.platform ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {c.sender_id.slice(-2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-800 truncate">{c.sender_id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${platformColors[c.platform] || "bg-gray-100 text-gray-600"}`}>
                        {platformIcon(c.platform)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {c.last_message?.replace(/^"|"$/g, "") || "No messages"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : ""}
                  </div>
                </div>
                {c.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pl-12">
                    {c.tags.map((t) => (
                      <span key={t} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel — contact detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-lg">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                {selected.sender_id.slice(-2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{selected.sender_id}</h2>
                <span className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium ${platformColors[selected.platform] || "bg-gray-100 text-gray-600"}`}>
                  {platformIcon(selected.platform)}
                  {selected.platform}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total messages</p>
                <p className="text-2xl font-black text-gray-900">{selected.message_count || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Last active</p>
                <p className="text-sm font-bold text-gray-900">
                  {selected.last_message_at ? new Date(selected.last_message_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {(selected.tags || []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">
                    {tag}
                    <button onClick={() => removeTag(selected, tag)} className="hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {(!selected.tags || selected.tags.length === 0) && (
                  <span className="text-sm text-gray-400">No tags yet</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag(selected)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={() => addTag(selected)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-sm font-medium">Select a contact to view details</p>
        </div>
      )}
    </div>
  );
}
