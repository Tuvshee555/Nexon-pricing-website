"use client";

import { useEffect, useMemo, useState } from "react";

interface Contact {
  sender_id: string;
  platform: string;
  last_message_at: string;
  message_count: number;
  last_message: string;
  tags: string[];
}

interface SegmentFilter {
  field: "platform" | "last_message_at" | "has_tag";
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  filters: SegmentFilter[];
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

const emptyFilter = (): SegmentFilter => ({
  field: "platform",
  operator: "is",
  value: "instagram",
});

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [activeTab, setActiveTab] = useState<"contacts" | "segments">("contacts");
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [newTag, setNewTag] = useState("");
  const [segmentForm, setSegmentForm] = useState({
    name: "",
    filters: [emptyFilter()],
  });
  const [savingSegment, setSavingSegment] = useState(false);

  const activeSegment = segments.find((segment) => segment.id === activeSegmentId) ?? null;

  const loadContacts = async (segmentId: string | null = activeSegmentId) => {
    setLoadingContacts(true);
    const url = segmentId ? `/api/contacts?segmentId=${encodeURIComponent(segmentId)}` : "/api/contacts";
    const res = await fetch(url);
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoadingContacts(false);
    setSelected(null);
  };

  const loadSegments = async () => {
    setLoadingSegments(true);
    const res = await fetch("/api/contacts/segments");
    const data = await res.json();
    setSegments(data.segments || []);
    setLoadingSegments(false);
  };

  useEffect(() => {
    void loadSegments();
  }, []);

  useEffect(() => {
    void loadContacts(activeSegmentId);
  }, [activeSegmentId]);

  const addTag = async (contact: Contact) => {
    if (!newTag.trim()) return;
    await fetch("/api/contacts/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: contact.sender_id,
        platform: contact.platform,
        tag: newTag.trim(),
        action: "add",
      }),
    });
    setContacts((prev) =>
      prev.map((c) =>
        c.sender_id === contact.sender_id && c.platform === contact.platform
          ? { ...c, tags: [...(c.tags || []), newTag.trim()] }
          : c
      )
    );
    if (selected?.sender_id === contact.sender_id && selected.platform === contact.platform) {
      setSelected((current) =>
        current ? { ...current, tags: [...(current.tags || []), newTag.trim()] } : current
      );
    }
    setNewTag("");
  };

  const removeTag = async (contact: Contact, tag: string) => {
    await fetch("/api/contacts/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: contact.sender_id,
        platform: contact.platform,
        tag,
        action: "remove",
      }),
    });
    setContacts((prev) =>
      prev.map((c) =>
        c.sender_id === contact.sender_id && c.platform === contact.platform
          ? { ...c, tags: c.tags.filter((value) => value !== tag) }
          : c
      )
    );
    if (selected?.sender_id === contact.sender_id && selected.platform === contact.platform) {
      setSelected((current) =>
        current ? { ...current, tags: current.tags.filter((value) => value !== tag) } : current
      );
    }
  };

  const saveSegment = async () => {
    if (!segmentForm.name.trim()) return;
    setSavingSegment(true);
    const res = await fetch("/api/contacts/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: segmentForm.name.trim(),
        filters: segmentForm.filters.filter((filter) => filter.value.trim()),
      }),
    });
    const data = await res.json();
    if (data.segment) {
      setSegments((prev) => [data.segment, ...prev]);
      setActiveSegmentId(data.segment.id);
      setActiveTab("contacts");
      setSegmentForm({ name: "", filters: [emptyFilter()] });
    }
    setSavingSegment(false);
  };

  const deleteSegment = async (id: string) => {
    await fetch("/api/contacts/segments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSegments((prev) => prev.filter((segment) => segment.id !== id));
    if (activeSegmentId === id) {
      setActiveSegmentId(null);
    }
    if (selected && activeSegmentId === id) {
      setSelected(null);
    }
  };

  const updateFilter = (index: number, patch: Partial<SegmentFilter>) => {
    setSegmentForm((current) => ({
      ...current,
      filters: current.filters.map((filter, filterIndex) =>
        filterIndex === index ? { ...filter, ...patch } : filter
      ),
    }));
  };

  const removeFilter = (index: number) => {
    setSegmentForm((current) => ({
      ...current,
      filters: current.filters.length === 1 ? [emptyFilter()] : current.filters.filter((_, i) => i !== index),
    }));
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const searchMatch = contact.sender_id.toLowerCase().includes(search.toLowerCase());
      const platformMatch = filterPlatform === "all" || contact.platform === filterPlatform;
      return searchMatch && platformMatch;
    });
  }, [contacts, search, filterPlatform]);

  const renderFilterValue = (filter: SegmentFilter, index: number) => {
    if (filter.field === "platform") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        >
          <option value="instagram">Instagram</option>
          <option value="messenger">Messenger</option>
        </select>
      );
    }

    if (filter.field === "last_message_at") {
      return (
        <input
          type="date"
          value={filter.value}
          onChange={(e) => updateFilter(index, { value: e.target.value })}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
      );
    }

    return (
      <input
        type="text"
        placeholder="Tag name"
        value={filter.value}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
      />
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex flex-col w-full max-w-sm border-r border-gray-200 bg-white flex-shrink-0">
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-gray-900">Contacts</h1>
            <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {loadingContacts ? "..." : filteredContacts.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "contacts"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All contacts
            </button>
            <button
              onClick={() => setActiveTab("segments")}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "segments"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              Segments
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "contacts" ? (
            <>
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all mb-3"
                />
                <div className="flex gap-2 flex-wrap">
                  {["all", "instagram", "messenger"].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setFilterPlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        filterPlatform === platform
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {platform === "all" ? "All" : platform}
                    </button>
                  ))}
                </div>
                {activeSegment ? (
                  <div className="mt-3 flex items-center justify-between gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-indigo-700">Active segment</p>
                      <p className="text-sm text-indigo-900 font-medium">{activeSegment.name}</p>
                    </div>
                    <button
                      onClick={() => setActiveSegmentId(null)}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="overflow-y-auto">
                {loadingContacts ? (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-sm">No contacts yet</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={`${contact.sender_id}-${contact.platform}`}
                      onClick={() => setSelected(contact)}
                      className={`w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selected?.sender_id === contact.sender_id && selected?.platform === contact.platform
                          ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                          {contact.sender_id.slice(-2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-800 truncate">{contact.sender_id}</span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                platformColors[contact.platform] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {platformIcon(contact.platform)}
                              {contact.platform}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {contact.last_message?.replace(/^"|"$/g, "") || "No messages"}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {contact.last_message_at ? new Date(contact.last_message_at).toLocaleDateString() : ""}
                        </div>
                      </div>
                      {contact.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pl-12">
                          {contact.tags.map((tag) => (
                            <span key={tag} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-5 space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <h2 className="text-sm font-bold text-gray-800 mb-3">Create segment</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Segment name"
                    value={segmentForm.name}
                    onChange={(e) => setSegmentForm((current) => ({ ...current, name: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />

                  {segmentForm.filters.map((filter, index) => (
                    <div key={`${filter.field}-${index}`} className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={filter.field}
                          onChange={(e) => {
                            const field = e.target.value as SegmentFilter["field"];
                            const defaults: SegmentFilter = {
                              field,
                              operator: field === "last_message_at" ? "after" : "is",
                              value: field === "platform" ? "instagram" : "",
                            };
                            updateFilter(index, defaults);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        >
                          <option value="platform">Platform</option>
                          <option value="last_message_at">Last message date</option>
                          <option value="has_tag">Has tag</option>
                        </select>

                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, { operator: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                        >
                          {filter.field === "last_message_at" ? (
                            <>
                              <option value="after">After</option>
                              <option value="before">Before</option>
                            </>
                          ) : filter.field === "has_tag" ? (
                            <>
                              <option value="is">Has tag</option>
                              <option value="does_not_have">Does not have</option>
                            </>
                          ) : (
                            <option value="is">Is</option>
                          )}
                        </select>
                      </div>

                      {renderFilterValue(filter, index)}

                      <div className="flex justify-end">
                        <button
                          onClick={() => removeFilter(index)}
                          className="text-xs font-semibold text-gray-400 hover:text-red-500"
                        >
                          Remove filter
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSegmentForm((current) => ({ ...current, filters: [...current.filters, emptyFilter()] }))}
                      className="flex-1 border border-gray-200 text-gray-600 hover:bg-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Add filter
                    </button>
                    <button
                      onClick={saveSegment}
                      disabled={savingSegment}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      {savingSegment ? "Saving..." : "Save segment"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-800">Saved segments</h2>
                  <span className="text-xs text-gray-400">{loadingSegments ? "Loading..." : `${segments.length} total`}</span>
                </div>
                <div className="space-y-2">
                  {segments.length === 0 && !loadingSegments ? (
                    <div className="text-sm text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                      No segments saved yet.
                    </div>
                  ) : (
                    segments.map((segment) => (
                      <div
                        key={segment.id}
                        className={`border rounded-2xl p-4 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                          activeSegmentId === segment.id
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setActiveSegmentId(segment.id);
                          setActiveTab("contacts");
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{segment.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{segment.filters.length} filters</p>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteSegment(segment.id);
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                {selected.sender_id.slice(-2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{selected.sender_id}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium ${
                    platformColors[selected.platform] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {platformIcon(selected.platform)}
                  {selected.platform}
                </span>
              </div>
            </div>

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

            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {(selected.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium"
                  >
                    {tag}
                    <button onClick={() => void removeTag(selected, tag)} className="hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {(!selected.tags || selected.tags.length === 0) && <span className="text-sm text-gray-400">No tags yet</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void addTag(selected)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={() => void addTag(selected)}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <p className="text-sm font-medium">Select a contact to view details</p>
        </div>
      )}
    </div>
  );
}
