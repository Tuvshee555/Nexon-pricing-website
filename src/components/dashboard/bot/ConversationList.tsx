"use client";

import { useMemo, useState } from "react";

interface Message {
  role: string;
  content: string;
}

interface Thread {
  id: string;
  platform: string;
  sender_id: string;
  messages: Message[];
  last_message_at: string;
}

interface Props {
  threads: Thread[];
}

function previewText(messages: Message[], role: "user" | "assistant") {
  return messages.findLast((message) => message.role === role)?.content ?? "";
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return `${date.toLocaleDateString("mn-MN")} ${date.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function bubbleClass(role: string) {
  if (role === "assistant") return "bg-primary/10 border-primary/20 text-text-primary";
  if (role === "user") return "bg-surface-2 border-border text-text-primary";
  return "bg-surface border-border text-text-secondary";
}

export default function ConversationList({ threads }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || null,
    [selectedId, threads]
  );

  if (threads.length === 0) {
    return (
      <div className="card p-8 text-center text-text-secondary text-sm">
        <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p>Одоогоор яриа байхгүй байна.</p>
        <p className="text-muted text-xs mt-1">Bot идэвхтэй болсны дараа харилцан ярианууд энд гарч ирнэ.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-text-primary">Ярианы inbox</h2>
          <p className="text-xs text-muted mt-0.5">{threads.length} thread</p>
        </div>
        {selectedThread ? (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Сонголт цэвэрлэх
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[560px]">
        <div className="border-r border-border max-h-[560px] overflow-y-auto">
          {threads.map((thread) => {
            const isSelected = thread.id === selectedId;
            const lastUser = previewText(thread.messages, "user");
            const lastBot = previewText(thread.messages, "assistant");
            return (
              <button
                type="button"
                key={thread.id}
                onClick={() => setSelectedId(thread.id)}
                className={`w-full text-left p-3 border-b border-border/70 transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-surface-2/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      thread.platform === "instagram"
                        ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                        : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    }`}
                  >
                    {thread.platform === "instagram" ? "Instagram" : "Messenger"}
                  </span>
                  <span className="text-[10px] text-muted">
                    {new Date(thread.last_message_at).toLocaleDateString("mn-MN")}
                  </span>
                </div>
                <p className="text-xs text-muted truncate mb-0.5">ID: {thread.sender_id}</p>
                <p className="text-xs text-text-secondary line-clamp-2">{lastUser || "—"}</p>
                {lastBot ? <p className="text-xs text-primary/80 line-clamp-2 mt-1">Bot: {lastBot}</p> : null}
              </button>
            );
          })}
        </div>

        <div className="p-4 md:p-5 flex flex-col">
          {!selectedThread ? (
            <div className="h-full border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm text-text-primary font-medium">Thread сонгоно уу</p>
              <p className="text-xs text-muted mt-1">Зүүн талын жагсаалтаас нэг яриа сонгоход бүтэн timeline харагдана.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border pb-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      selectedThread.platform === "instagram"
                        ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                        : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    }`}
                  >
                    {selectedThread.platform === "instagram" ? "Instagram" : "Messenger"}
                  </span>
                  <span className="text-xs text-muted">{selectedThread.messages.length} мессеж</span>
                </div>
                <p className="text-xs text-muted">Хэрэглэгч: {selectedThread.sender_id}</p>
                <p className="text-xs text-muted mt-0.5">
                  Сүүлд шинэчлэгдсэн: {formatDateTime(selectedThread.last_message_at)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {selectedThread.messages.length === 0 ? (
                  <div className="text-xs text-muted text-center py-10">Энэ thread-д мессеж олдсонгүй.</div>
                ) : (
                  selectedThread.messages.map((message, index) => (
                    <div
                      key={`${selectedThread.id}-${index}`}
                      className={`rounded-xl border px-3 py-2 ${bubbleClass(message.role)}`}
                    >
                      <p className="text-[11px] uppercase tracking-wide opacity-70 mb-1">
                        {message.role === "assistant"
                          ? "Bot"
                          : message.role === "user"
                          ? "Хэрэглэгч"
                          : message.role}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
