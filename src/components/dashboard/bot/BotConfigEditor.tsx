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
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      setStatus(nextStatus);
      toast.success(nextStatus === "active" ? "Bot activated" : "Bot paused");
    } catch {
      toast.error("Connection error");
    } finally {
      setToggling(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    const label = platform === "all" ? "all platforms" : platform;
    if (!confirm(`Disconnect ${label}?`)) return;
    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/business/disconnect-platform?platform=${platform}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      setPlatformAccounts(platform === "all" ? [] : platformAccounts.filter((p) => p.platform !== platform));
      toast.success("Disconnected");
    } catch {
      toast.error("Connection error");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleChooseKnowledgeFile = () => fileInputRef.current?.click();

  const handleKnowledgeFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Please upload a .json file");
      return;
    }
    if (file.size > 100 * 1024) {
      toast.error("File must be 100KB or smaller");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploadingKnowledge(true);
    try {
      const res = await fetch("/api/business/upload-knowledge", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to upload knowledge base");
        return;
      }
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
      if (!res.ok) {
        toast.error(data.error || "Failed to remove knowledge base");
        return;
      }
      setKnowledgeLoaded(false);
      toast.success("Knowledge base removed");
    } catch {
      toast.error("Connection error");
    } finally {
      setRemovingKnowledge(false);
    }
  };

  const statusColor: Record<string, string> = {
    active: "text-emerald-600 bg-emerald-50 border-emerald-200",
    paused: "text-amber-600 bg-amber-50 border-amber-200",
    cancelled: "text-red-600 bg-red-50 border-red-200",
  };
  const statusLabel: Record<string, string> = {
    active: "Active",
    paused: "Paused",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-500">Bot status</p>
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColor[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
          {status !== "cancelled" ? (
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                status === "active"
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {toggling ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {status === "active" ? "Pause" : "Activate"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Connected platforms</p>
          {platformAccounts.length > 0 ? (
            <div className="space-y-2">
              {platformAccounts.map((pa) => (
                <div key={pa.id} className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      pa.platform === "instagram"
                        ? "border-pink-200 bg-pink-50 text-pink-600"
                        : "border-blue-200 bg-blue-50 text-blue-600"
                    }`}
                  >
                    {pa.page_name || (pa.platform === "instagram" ? "Instagram" : "Messenger")}
                  </span>
                  <button
                    onClick={() => handleDisconnect(pa.platform)}
                    disabled={disconnecting === pa.platform}
                    className="text-xs text-slate-500 transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    {disconnecting === pa.platform ? "..." : "Disconnect"}
                  </button>
                </div>
              ))}
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={`/api/facebook/auth?businessId=${businessId}`}
                  className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-white"
                >
                  Add Facebook / Instagram
                </a>
                <button
                  onClick={() => handleDisconnect("all")}
                  disabled={!!disconnecting}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  Disconnect all
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs text-slate-500">No platforms connected yet.</p>
              <a
                href={`/api/facebook/auth?businessId=${businessId}`}
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-white"
              >
                Connect Facebook / Instagram
              </a>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {knowledgeLoaded ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                Knowledge base loaded
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleChooseKnowledgeFile}
              disabled={uploadingKnowledge || removingKnowledge}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-white disabled:opacity-50"
            >
              {uploadingKnowledge ? "Uploading..." : "Upload JSON"}
            </button>
            {knowledgeLoaded ? (
              <button
                type="button"
                onClick={handleRemoveKnowledge}
                disabled={uploadingKnowledge || removingKnowledge}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                {removingKnowledge ? "Removing..." : "Remove"}
              </button>
            ) : null}
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleKnowledgeFileChange} />
          </div>
          <p className="text-xs text-slate-500">
            Upload a JSON file with business info, FAQs, pricing, and any other reference details.
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-950">Bot configuration</h2>
        <BotConfigForm
          initialBotName={initialBotName}
          initialBotPrompt={initialBotPrompt}
          initialWelcomeMessage={initialWelcomeMessage}
          initialBotTone={initialTone}
          submitLabel="Save changes"
          onSave={async ({ botName, botPrompt, welcomeMessage, botTone }) => {
            try {
              const res = await fetch("/api/business/update-bot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ botPrompt, botName, welcomeMessage, botTone }),
              });
              const data = await res.json();
              if (!res.ok) return { ok: false, error: data.error || "Something went wrong" };
              return { ok: true };
            } catch {
              return { ok: false, error: "Connection error" };
            }
          }}
        />
      </div>
    </div>
  );
}
