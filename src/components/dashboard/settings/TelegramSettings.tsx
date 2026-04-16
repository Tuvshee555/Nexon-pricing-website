"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Telegram Bot Section ─────────────────────────────────────────────────────

export function TelegramBotSection() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/telegram/connect")
      .then((r) => r.json())
      .then((d) => {
        setConnected(!!d.connected);
        setUsername(d.username ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connect = async () => {
    if (!token.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not connect bot");
        return;
      }
      setConnected(true);
      setUsername(data.username);
      setToken("");
      toast.success(`@${data.username} connected!`);
    } catch {
      toast.error("Connection error");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setSaving(true);
    try {
      await fetch("/api/telegram/connect", { method: "DELETE" });
      setConnected(false);
      setUsername(null);
      toast.success("Telegram bot disconnected");
    } catch {
      toast.error("Error disconnecting");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-card rounded-[30px] p-6">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="surface-card rounded-[30px] p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#229ED9]/10">
          <svg className="h-5 w-5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.48c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.115 14.88l-2.948-.924c-.64-.203-.654-.64.136-.948l11.527-4.445c.535-.194 1.002.131.732.685z" />
          </svg>
        </div>
        <div>
          <p className="section-label">Telegram Bot</p>
        </div>
      </div>

      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">
        Connect your Telegram bot
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Your customers can message your Telegram bot and get the same AI + keyword trigger replies as Instagram and Messenger.
      </p>

      {connected && username ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">@{username}</p>
              <p className="text-xs text-emerald-700">Bot is live and accepting messages</p>
            </div>
          </div>
          <button
            onClick={disconnect}
            disabled={saving}
            className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Instructions */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">How to get your bot token</p>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">1</span>
                <span>Open Telegram and search for <strong>@BotFather</strong></span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">2</span>
                <span>Send <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">/newbot</code> and follow the steps</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">3</span>
                <span>Copy the token BotFather gives you (looks like <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">7123456:AAFxxx...</code>)</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">4</span>
                <span>Paste it below and click Connect</span>
              </li>
            </ol>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Bot token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="7123456789:AAFxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-400"
            />
          </div>

          <button
            onClick={connect}
            disabled={saving || !token.trim()}
            className="flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a8cbd] disabled:opacity-40"
          >
            {saving ? "Connecting..." : "Connect bot"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Owner Notification Section ───────────────────────────────────────────────

export function NotificationSettingsSection() {
  const [chatId, setChatId] = useState("");
  const [notifyContact, setNotifyContact] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyBot, setNotifyBot] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/settings")
      .then((r) => r.json())
      .then((d) => {
        setChatId(d.owner_telegram_chat_id ?? "");
        setNotifyContact(d.notify_contact_limit !== false);
        setNotifyPayment(d.notify_payment !== false);
        setNotifyBot(d.notify_bot_status !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerTelegramChatId: chatId.trim() || null,
          notifyContactLimit: notifyContact,
          notifyPayment,
          notifyBotStatus: notifyBot,
        }),
      });
      if (res.ok) toast.success("Notification settings saved");
      else toast.error("Could not save settings");
    } catch {
      toast.error("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!chatId.trim()) {
      toast.error("Enter your Chat ID first");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, ownerTelegramChatId: chatId.trim() }),
      });
      if (res.ok) toast.success("Test message sent! Check your Telegram.");
      else toast.error("Could not send test. Check your Chat ID.");
    } catch {
      toast.error("Error sending test");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-card rounded-[30px] p-6">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="surface-card rounded-[30px] p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="section-label">Notifications</p>
      </div>

      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">
        Get account alerts on Telegram
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Receive personal Telegram messages when your contact limit is high, payment is processed, or your bot is paused.
      </p>

      <div className="mt-6 space-y-5">
        {/* How to get chat ID */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          To get your Chat ID: open Telegram → search <strong>@userinfobot</strong> → send <code className="rounded bg-blue-100 px-1">/start</code> → copy the ID number it gives you.
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">Your Telegram Chat ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
            />
            <button
              onClick={sendTest}
              disabled={testing || !chatId.trim()}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              {testing ? "Sending..." : "Test"}
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notify me when</p>
          {[
            { label: "Contact limit reaches 80%+", value: notifyContact, set: setNotifyContact },
            { label: "Monthly payment is processed", value: notifyPayment, set: setNotifyPayment },
            { label: "Bot is paused or resumes", value: notifyBot, set: setNotifyBot },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm text-slate-700">{item.label}</span>
              <button
                onClick={() => item.set(!item.value)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  item.value ? "bg-slate-900" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    item.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
