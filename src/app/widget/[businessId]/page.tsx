"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface Message {
  role: "user" | "bot";
  content: string;
}

function getSessionId(): string {
  const key = "nexon_widget_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function WidgetPage() {
  const { businessId } = useParams() as { businessId: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [botName, setBotName] = useState("Assistant");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    const sessionId = getSessionId();
    const res = await fetch("/api/widget/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, sessionId, message: text }),
    });
    const data = await res.json() as { reply?: string; botName?: string };
    if (data.botName) setBotName(data.botName);
    setMessages((prev) => [...prev, { role: "bot", content: data.reply ?? "..." }]);
    setSending(false);
  };

  return (
    <div className="flex h-screen flex-col bg-white font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-900 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
          N
        </div>
        <div>
          <p className="text-sm font-bold text-white">{botName}</p>
          <p className="text-xs text-gray-400">Powered by Nexon</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <p>Send a message to get started</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-sm bg-gray-900 text-white"
                  : "rounded-bl-sm border border-gray-200 bg-gray-50 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-gray-50 px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
