"use client";

import { useEffect, useRef, useState } from "react";

interface KnowledgeEntry {
  question?: string;
  answer?: string;
  type?: string;
  content?: string;
  [key: string]: unknown;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry | KnowledgeEntry[] | null>(null);
  const [aiCommentsEnabled, setAiCommentsEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Multi-turn chat playground
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savingComments, setSavingComments] = useState(false);

  useEffect(() => {
    fetch("/api/business/knowledge")
      .then((r) => r.json())
      .then((d) => {
        setKnowledge(d.knowledge ?? null);
        setAiCommentsEnabled(d.aiCommentsEnabled ?? false);
      });
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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
      setKnowledge(kd.knowledge ?? null);
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

  const sendMessage = async () => {
    const msg = inputMsg.trim();
    if (!msg || sending) return;
    setInputMsg("");
    setSending(true);

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);

    const res = await fetch("/api/business/test-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        history: chatHistory, // send previous turns
      }),
    });
    const data = await res.json();
    const reply = data.reply || "No response";
    setChatHistory([...newHistory, { role: "assistant", content: reply }]);
    setSending(false);
  };

  const toggleAiComments = async () => {
    const next = !aiCommentsEnabled;
    setSavingComments(true);
    setAiCommentsEnabled(next);
    await fetch("/api/business/update-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiCommentsEnabled: next }),
    });
    setSavingComments(false);
  };

  const isPlaintext =
    knowledge !== null &&
    typeof knowledge === "object" &&
    !Array.isArray(knowledge) &&
    (knowledge as KnowledgeEntry).type === "plaintext";

  const entries = isPlaintext
    ? []
    : Array.isArray(knowledge)
    ? (knowledge as KnowledgeEntry[])
    : knowledge
    ? [knowledge as KnowledgeEntry]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
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
                <p className="text-xs text-gray-400">Upload a JSON or plain-text .txt file</p>
              </div>
            </div>

            {knowledge ? (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isPlaintext ? "Plain text loaded" : `${entries.length} entries loaded`}
                  </span>
                  <button
                    onClick={deleteKnowledge}
                    disabled={deleting}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    {deleting ? "Deleting..." : "Delete all"}
                  </button>
                </div>

                {isPlaintext ? (
                  <div className="bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {String((knowledge as KnowledgeEntry).content || "").slice(0, 500)}
                      {String((knowledge as KnowledgeEntry).content || "").length > 500 ? "…" : ""}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {entries.slice(0, 10).map((entry, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 text-xs">
                        {entry.question && <p className="font-semibold text-gray-700 mb-1">Q: {entry.question}</p>}
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
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-5">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500 mb-1">No knowledge base yet</p>
                <p className="text-xs text-gray-400">Upload a JSON or .txt file to train your bot</p>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{uploadError}</p>
            )}

            <input ref={fileRef} type="file" accept=".json,.txt,.md" onChange={uploadFile} className="hidden" />
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
                  {knowledge ? "Replace knowledge base" : "Upload JSON or TXT file"}
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              JSON: <code className="bg-gray-100 px-1 rounded">[{`{"question":"...", "answer":"..."}`}]</code> or plain text .txt
            </p>
          </div>

          {/* AI Chat Playground */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">AI Playground</h2>
                  <p className="text-xs text-gray-400">Multi-turn conversation test</p>
                </div>
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => setChatHistory([])}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear chat
                </button>
              )}
            </div>

            {/* Chat messages */}
            <div className="flex-1 min-h-[200px] max-h-[260px] overflow-y-auto space-y-3 mb-4 bg-gray-50 rounded-xl p-3">
              {chatHistory.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">Send a message to test your bot</p>
                    <p className="text-xs mt-1">Conversation history is maintained</p>
                  </div>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                disabled={sending}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !inputMsg.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* AI Feature Cards */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {/* AI Replies */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-2xl mb-3">💬</div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-gray-800">AI Replies</h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bot automatically answers DMs using your knowledge base, system prompt, and full conversation history.
            </p>
          </div>

          {/* Intent Recognition */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-2xl mb-3">🧠</div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-gray-800">Intent Recognition</h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              AI understands intent behind messages — typos, slang, and different phrasings all match the right trigger.
            </p>
          </div>

          {/* AI Comment Replies */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-2xl mb-3">💭</div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold text-gray-800">AI Comment Replies</h3>
              <button
                onClick={toggleAiComments}
                disabled={savingComments}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  aiCommentsEnabled ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    aiCommentsEnabled ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                  style={{ transform: aiCommentsEnabled ? "translateX(18px)" : "translateX(2px)" }}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Auto-reply to Instagram comments using AI. Toggle on to activate for your connected page.
            </p>
          </div>
        </div>

        {/* Human Escalation info */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="text-xl">🙋</div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">Human Escalation</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                When the bot can&apos;t answer a question, it flags the conversation in your Inbox under &quot;Needs Human&quot; so your team can follow up. No setup needed — it works automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
