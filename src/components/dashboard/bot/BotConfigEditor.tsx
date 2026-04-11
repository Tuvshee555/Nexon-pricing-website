"use client";

import { ChangeEvent, useRef, useState } from "react";
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
  knowledgeLoaded: boolean;
  platformAccounts: PlatformAccount[];
}

export default function BotConfigEditor({
  businessId,
  botName: initialBotName,
  botPrompt: initialBotPrompt,
  welcomeMessage: initialWelcomeMessage,
  botTone: initialTone,
  status: initialStatus,
  knowledgeLoaded: initialKnowledgeLoaded,
  platformAccounts: initialPlatformAccounts,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(initialKnowledgeLoaded);
  const [platformAccounts, setPlatformAccounts] = useState(initialPlatformAccounts);
  const [toggling, setToggling] = useState(false);
  const [uploadingKnowledge, setUploadingKnowledge] = useState(false);
  const [removingKnowledge, setRemovingKnowledge] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      if (!res.ok) { toast.error(data.error || "Алдаа гарлаа"); return; }
      setStatus(nextStatus);
      toast.success(nextStatus === "active" ? "Bot идэвхжлаа" : "Bot түр зогслоо");
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setToggling(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    const label = platform === "all" ? "Бүх платформ" : platform;
    if (!confirm(`${label}-г салгах уу?`)) return;
    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/business/disconnect-platform?platform=${platform}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Алдаа гарлаа"); return; }
      setPlatformAccounts(platform === "all" ? [] : platformAccounts.filter((p) => p.platform !== platform));
      toast.success("Салгалаа");
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleChooseKnowledgeFile = () => fileInputRef.current?.click();

  const handleKnowledgeFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) { toast.error("Please upload a .json file"); return; }
    if (file.size > 100 * 1024) { toast.error("File must be 100KB or smaller"); return; }

    const formData = new FormData();
    formData.append("file", file);
    setUploadingKnowledge(true);
    try {
      const res = await fetch("/api/business/upload-knowledge", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to upload knowledge base"); return; }
      setKnowledgeLoaded(true);
      toast.success("Knowledge base uploaded");
    } catch {
      toast.error("Connection error");
    } finally {
      setUploadingKnowledge(false);
    }
  };

  const handleRemoveKnowledge = async () => {
    setRemovingKnowledge(true);
    try {
      const res = await fetch("/api/business/delete-knowledge", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to remove knowledge base"); return; }
      setKnowledgeLoaded(false);
      toast.success("Knowledge base removed");
    } catch {
      toast.error("Connection error");
    } finally {
      setRemovingKnowledge(false);
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
              ) : status === "active" ? "Зогсоох" : "Эхлүүлэх"}
            </button>
          ) : null}
        </div>

        {/* Platform accounts */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted mb-2">Холбосон платформ</p>
          {platformAccounts.length > 0 ? (
            <div className="space-y-2">
              {platformAccounts.map((pa) => (
                <div key={pa.id} className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    pa.platform === "instagram"
                      ? "text-pink-400 bg-pink-500/10 border-pink-500/20"
                      : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                  }`}>
                    {pa.page_name || (pa.platform === "instagram" ? "Instagram" : "Messenger")}
                  </span>
                  <button
                    onClick={() => handleDisconnect(pa.platform)}
                    disabled={disconnecting === pa.platform}
                    className="text-xs text-danger/70 hover:text-danger transition-colors disabled:opacity-50"
                  >
                    {disconnecting === pa.platform ? "..." : "Салгах"}
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2 flex-wrap">
                <a
                  href={`/api/facebook/auth?businessId=${businessId}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:border-primary/40 hover:text-text-primary transition-colors"
                >
                  Дахин холбох / Instagram нэмэх
                </a>
                <button
                  onClick={() => handleDisconnect("all")}
                  disabled={!!disconnecting}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-danger/30 text-danger/70 hover:text-danger hover:border-danger/60 transition-colors disabled:opacity-50"
                >
                  Бүгдийг салгах
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted mb-2">Платформ холбогдоогүй байна</p>
              <a
                href={`/api/facebook/auth?businessId=${businessId}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:border-primary/40 hover:text-text-primary transition-colors inline-block"
              >
                Facebook / Instagram холбох
              </a>
            </div>
          )}
        </div>

        {/* Knowledge base */}
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {knowledgeLoaded ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border text-success bg-success/10 border-success/30">
                ✓ Knowledge base loaded
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleChooseKnowledgeFile}
              disabled={uploadingKnowledge || removingKnowledge}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:border-primary/40 hover:text-text-primary transition-colors disabled:opacity-50"
            >
              {uploadingKnowledge ? "Uploading..." : "Upload JSON"}
            </button>
            {knowledgeLoaded ? (
              <button
                type="button"
                onClick={handleRemoveKnowledge}
                disabled={uploadingKnowledge || removingKnowledge}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:border-danger/40 hover:text-danger transition-colors disabled:opacity-50"
              >
                {removingKnowledge ? "Removing..." : "Remove"}
              </button>
            ) : null}
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleKnowledgeFileChange} />
          </div>
          <p className="text-xs text-muted">
            Upload a .json file with your business data (packages, FAQ, pricing etc.)
          </p>
        </div>
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
              if (!res.ok) return { ok: false, error: data.error || "Алдаа гарлаа" };
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
