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

// ── WhatsApp Bot Section ─────────────────────────────────────────────────────

export function WhatsAppSection() {
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/connect")
      .then((r) => r.json())
      .then((d) => {
        setConnected(!!d.connected);
        setPhoneNumber(d.phoneNumber ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connect = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId: phoneNumberId.trim(), accessToken: accessToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not connect WhatsApp");
        return;
      }
      setConnected(true);
      setPhoneNumber(data.phoneNumber);
      setPhoneNumberId("");
      setAccessToken("");
      toast.success(`WhatsApp ${data.phoneNumber} connected!`);
    } catch {
      toast.error("Connection error");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setSaving(true);
    try {
      await fetch("/api/whatsapp/connect", { method: "DELETE" });
      setConnected(false);
      setPhoneNumber(null);
      toast.success("WhatsApp disconnected");
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
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50">
          <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div>
          <p className="section-label">WhatsApp Business</p>
        </div>
      </div>

      <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">
        Connect WhatsApp Business API
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Let customers message you on WhatsApp and get the same AI + keyword trigger replies as your other channels.
      </p>

      {connected && phoneNumber ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">{phoneNumber}</p>
              <p className="text-xs text-emerald-700">WhatsApp Business connected</p>
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
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-bold mb-1">Requires Meta WhatsApp Business API access</p>
            <p className="text-xs leading-5">You need a verified Meta Business account with WhatsApp Business API enabled. Once approved, you&apos;ll get a Phone Number ID and a permanent access token from Meta.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">How to get your credentials</p>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">1</span>
                <span>Go to <strong>developers.facebook.com</strong> → create a WhatsApp app</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">2</span>
                <span>Add a phone number and verify it with WhatsApp Business</span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">3</span>
                <span>Copy the <strong>Phone Number ID</strong> and generate a permanent <strong>access token</strong></span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">4</span>
                <span>Set webhook URL in Meta dashboard to <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">your-domain.com/api/webhook/whatsapp</code></span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Phone Number ID</label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="e.g. 123456789012345"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Access token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAxxxxxxxxxxxxxxxxx..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <button
            onClick={connect}
            disabled={saving || !phoneNumberId.trim() || !accessToken.trim()}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            {saving ? "Connecting..." : "Connect WhatsApp"}
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
