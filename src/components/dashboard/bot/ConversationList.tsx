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

export default function ConversationList({ threads }: Props) {
  if (threads.length === 0) {
    return (
      <div className="card p-8 text-center text-text-secondary text-sm">
        <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p>Одоогоор яриа байхгүй байна.</p>
        <p className="text-muted text-xs mt-1">Bot идэвхтэй болсны дараа яриануудыг энд харна.</p>
      </div>
    );
  }

  const getLastMessage = (messages: Message[]) => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return lastUser?.content || "";
  };

  const getLastReply = (messages: Message[]) => {
    const lastBot = [...messages].reverse().find((m) => m.role === "assistant");
    return lastBot?.content || "";
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-border">
        <h2 className="font-bold text-text-primary">Сүүлийн яриануд</h2>
        <p className="text-xs text-muted mt-0.5">{threads.length} яриа</p>
      </div>
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {threads.map((thread) => {
          const lastMsg = getLastMessage(thread.messages);
          const lastReply = getLastReply(thread.messages);
          const msgCount = thread.messages.length;

          return (
            <div key={thread.id} className="p-4 hover:bg-surface-2/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      thread.platform === "instagram"
                        ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                        : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    }`}
                  >
                    {thread.platform === "instagram" ? "Instagram" : "Messenger"}
                  </span>
                  <span className="text-xs text-muted">{msgCount} мессеж</span>
                </div>
                <span className="text-xs text-muted shrink-0">
                  {new Date(thread.last_message_at).toLocaleDateString("mn-MN")}
                </span>
              </div>

              {lastMsg && (
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted w-14 shrink-0">Хэрэглэгч:</span>
                    <p className="text-xs text-text-secondary line-clamp-2">{lastMsg}</p>
                  </div>
                  {lastReply && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-primary w-14 shrink-0">Bot:</span>
                      <p className="text-xs text-text-secondary line-clamp-2">{lastReply}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
