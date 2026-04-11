"use client";

import { useEffect, useRef, useState } from "react";

interface KnowledgeEntry {
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

export default function AIPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/business/knowledge")
      .then((r) => r.json())
      .then((d) => setKnowledge(d.knowledge || null));
  }, []);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/business/upload-knowledge", { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      const kd = await fetch("/api/business/knowledge").then((r) => r.json());
      setKnowledge(kd.knowledge || null);
    } else {
      setUploadError(data.error || "Upload failed");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deleteKnowledge = async () => {
    if (!confirm("Delete all knowledge base data?")) return;
    setDeleting(true);
    await fetch("/api/business/delete-knowledge", { method: "DELETE" });
    setKnowledge(null);
    setDeleting(false);
  };

  const testBot = async () => {
    if (!testMsg.trim()) return;
    setTesting(true);
    setTestReply("");
    const res = await fetch("/api/business/test-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testMsg }),
    });
    const data = await res.json();
    setTestReply(data.reply || "No response");
    setTesting(false);
  };

  const entries = Array.isArray(knowledge) ? knowledge : knowledge ? [knowledge] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">AI</h1>
          <p className="text-gray-500 text-sm mt-1">Train your AI bot with custom knowledge and test its responses</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Knowledge Library */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Knowledge Library</h2>
                <p className="text-xs text-gray-400">Upload a JSON file with Q&amp;A data</p>
              </div>
            </div>

            {knowledge ? (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {entries.length} entries loaded
                  </span>
                  <button
                    onClick={deleteKnowledge}
                    disabled={deleting}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    {deleting ? "Deleting..." : "Delete all"}
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {entries.slice(0, 10).map((entry, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-xs">
                      {entry.question && (
                        <p className="font-semibold text-gray-700 mb-1">Q: {entry.question}</p>
                      )}
                      {entry.answer && (
                        <p className="text-gray-500">A: {String(entry.answer).slice(0, 100)}{String(entry.answer).length > 100 ? "..." : ""}</p>
                      )}
                      {!entry.question && !entry.answer && (
                        <p className="text-gray-500">{JSON.stringify(entry).slice(0, 120)}...</p>
                      )}
                    </div>
                  ))}
                  {entries.length > 10 && (
                    <p className="text-xs text-gray-400 text-center">+{entries.length - 10} more entries</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-5">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500 mb-1">No knowledge base yet</p>
                <p className="text-xs text-gray-400">Upload a JSON file to train your bot</p>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{uploadError}</p>
            )}

            <input ref={fileRef} type="file" accept=".json" onChange={uploadFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border-2 border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {knowledge ? "Replace knowledge base" : "Upload JSON file"}
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              JSON format: <code className="bg-gray-100 px-1 rounded">[{`{"question":"...", "answer":"..."}`}]</code>
            </p>
          </div>

          {/* AI Playground */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">AI Playground</h2>
                <p className="text-xs text-gray-400">Test how your bot responds</p>
              </div>
            </div>

            <div className="mb-4">
              <textarea
                rows={3}
                placeholder="Type a test message..."
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); testBot(); } }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
            <button
              onClick={testBot}
              disabled={testing || !testMsg.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-5"
            >
              {testing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing...
                </>
              ) : "Test bot response"}
            </button>

            {testReply && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">Bot reply:</p>
                <p className="text-sm text-gray-800 leading-relaxed">{testReply}</p>
              </div>
            )}

            {!testReply && (
              <div className="text-center text-gray-300 py-8">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-400">Send a message to see how your bot responds</p>
              </div>
            )}
          </div>
        </div>

        {/* AI features info */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {[
            { title: "AI Replies", desc: "Bot automatically answers DMs using your knowledge base and system prompt.", icon: "💬", active: true },
            { title: "Keyword Triggers", desc: "Set exact keywords to bypass AI and send a fixed reply instantly.", icon: "⚡", active: true },
            { title: "AI Comments", desc: "Auto-reply to Instagram comments. Coming soon.", icon: "💭", active: false },
          ].map((f) => (
            <div key={f.title} className={`bg-white border rounded-2xl p-5 ${f.active ? "border-gray-200" : "border-dashed border-gray-200 opacity-60"}`}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-gray-800">{f.title}</h3>
                {f.active ? (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Soon</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
