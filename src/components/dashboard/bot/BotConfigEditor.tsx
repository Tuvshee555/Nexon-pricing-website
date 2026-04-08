"use client";

import { useState } from "react";
import { toast } from "sonner";
import BotConfigForm from "@/components/dashboard/bot/BotConfigForm";

interface PlatformAccount {
  id: string;
  platform: string;
  page_name?: string;
  page_id?: string;
  instagram_account_id?: string;
}

interface Props {
  businessId: string;
  botName: string;
  botPrompt: string;
  welcomeMessage: string;
  botTone: string;
  status: string;
  platformAccounts: PlatformAccount[];
}

export default function BotConfigEditor({
  botName: initialBotName,
  botPrompt: initialBotPrompt,
  welcomeMessage: initialWelcomeMessage,
  botTone: initialTone,
  status: initialStatus,
  platformAccounts,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [toggling, setToggling] = useState(false);

  const handleToggleStatus = async () => {
    const nextStatus = status === "active" ? "paused" : "active";
    setToggling(true);
    try {
      const res = await fetch("/api/business/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Алдаа гарлаа");
        return;
      }
      setStatus(nextStatus);
      toast.success(nextStatus === "active" ? "Bot идэвхжлээ" : "Bot түр зогслоо");
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setToggling(false);
    }
  };

  const statusColor: Record<string, string> = {
    active: "text-success bg-success/10 border-success/30",
    paused: "text-warning bg-warning/10 border-warning/30",
    cancelled: "text-danger bg-danger/10 border-danger/30",
  };

  const statusLabel: Record<string, string> = {
    active: "Идэвхтэй",
    paused: "Түр зогссон",
    cancelled: "Цуцлагдсан",
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">Bot төлөв</p>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${statusColor[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
          {status !== "cancelled" ? (
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`flex items-center gap-2 font-medium px-4 py-2 rounded-xl text-sm transition-colors ${
                status === "active"
                  ? "bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30"
                  : "bg-success/10 hover:bg-success/20 text-success border border-success/30"
              } disabled:opacity-50`}
            >
              {toggling ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : status === "active" ? (
                "Зогсоох"
              ) : (
                "Эхлүүлэх"
              )}
            </button>
          ) : null}
        </div>

        {platformAccounts.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted mb-2">Холбосон платформ</p>
            <div className="flex flex-wrap gap-2">
              {platformAccounts.map((pa) => (
                <span
                  key={pa.id}
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    pa.platform === "instagram"
                      ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                      : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  {pa.page_name || (pa.platform === "instagram" ? "Instagram" : "Messenger")}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-text-primary mb-4">Bot тохиргоо</h2>
        <BotConfigForm
          initialBotName={initialBotName}
          initialBotPrompt={initialBotPrompt}
          initialWelcomeMessage={initialWelcomeMessage}
          initialBotTone={initialTone}
          submitLabel="Хадгалах"
          onSave={async ({ botName, botPrompt, welcomeMessage, botTone }) => {
            try {
              const res = await fetch("/api/business/update-bot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ botPrompt, botName, welcomeMessage, botTone }),
              });

              const data = await res.json();
              if (!res.ok) {
                return { ok: false, error: data.error || "Алдаа гарлаа" };
              }
              return { ok: true };
            } catch {
              return { ok: false, error: "Холболтын алдаа гарлаа" };
            }
          }}
        />
      </div>
    </div>
  );
}
