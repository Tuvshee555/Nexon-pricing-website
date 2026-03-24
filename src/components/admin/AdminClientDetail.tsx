"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";

interface BusinessData {
  id: string;
  name: string;
  status: string;
  bot_prompt: string;
  contact_phone: string;
  contact_email: string;
  users: { id: string; email: string } | null;
  plans: { id?: string; plan_type: string; monthly_tier?: string; monthly_price?: number } | null;
  credits: { balance: number; total_purchased: number } | null;
  platform_accounts: Array<{ id: string; platform: string; external_id: string }> | null;
}

interface Props {
  business: BusinessData;
  logs: Array<{id: string; logged_at: string; platform: string; message_count: number; prompt_tokens: number; completion_tokens: number; total_tokens: number; credits_used: number}>;
  transactions: Array<{id: string; created_at: string; amount: number; credits_added: number; payment_method: string; status: string}>;
}

export default function AdminClientDetail({ business, logs, transactions }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [editForm, setEditForm] = useState({
    name: business.name,
    bot_prompt: business.bot_prompt,
    contact_phone: business.contact_phone,
    contact_email: business.contact_email,
    status: business.status,
    plan_type: business.plans?.plan_type || "credit",
    monthly_tier: business.plans?.monthly_tier || "basic",
    monthly_price: business.plans?.monthly_price || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newPlatform, setNewPlatform] = useState({ platform: "instagram", external_id: "" });

  const callAction = async (action: string, payload?: object) => {
    setLoading(action);
    try {
      const res = await fetch("/api/admin/client-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, action, ...payload }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/admin/client-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, action: "update", ...editForm }),
      });
      if (res.ok) {
        setSaveMsg("Амжилттай хадгалагдлаа");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddCredits = async () => {
    const amount = parseInt(creditsToAdd);
    if (!amount || amount <= 0) return;
    await callAction("add_credits", { credits: amount });
    setCreditsToAdd("");
  };

  const handleAddPlatform = async () => {
    if (!newPlatform.external_id) return;
    await callAction("add_platform", newPlatform);
    setNewPlatform({ platform: "instagram", external_id: "" });
  };

  const credits = business.credits;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients" className="text-text-secondary hover:text-text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{business.name}</h1>
          <p className="text-text-secondary text-sm">{business.users?.email}</p>
        </div>
      </div>

      {/* Status actions */}
      <div className="card p-4 flex flex-wrap gap-3">
        <button
          onClick={() => callAction("activate")}
          disabled={loading === "activate" || business.status === "active"}
          className="px-4 py-2 bg-success/10 border border-success/30 text-success rounded-lg text-sm font-medium hover:bg-success/20 disabled:opacity-40 transition-colors"
        >
          {loading === "activate" ? "..." : "Идэвхжүүлэх"}
        </button>
        <button
          onClick={() => callAction("pause")}
          disabled={loading === "pause" || business.status === "paused"}
          className="px-4 py-2 bg-warning/10 border border-warning/30 text-warning rounded-lg text-sm font-medium hover:bg-warning/20 disabled:opacity-40 transition-colors"
        >
          {loading === "pause" ? "..." : "Түр зогсоох"}
        </button>
        <button
          onClick={() => callAction("cancel")}
          disabled={loading === "cancel" || business.status === "cancelled"}
          className="px-4 py-2 bg-danger/10 border border-danger/30 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 disabled:opacity-40 transition-colors"
        >
          {loading === "cancel" ? "..." : "Цуцлах"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <h2 className="font-bold text-text-primary">Бизнесийн мэдээлэл</h2>

          {[
            { label: "Нэр", key: "name", type: "text" },
            { label: "Утас", key: "contact_phone", type: "text" },
            { label: "И-мэйл", key: "contact_email", type: "email" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm text-text-secondary mb-1">{f.label}</label>
              <input
                type={f.type}
                value={editForm[f.key as keyof typeof editForm]}
                onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm text-text-secondary mb-1">Статус</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
            >
              <option value="active">Идэвхтэй</option>
              <option value="paused">Түр зогссон</option>
              <option value="cancelled">Цуцлагдсан</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Төлөвлөгөөний төрөл</label>
            <select
              value={editForm.plan_type}
              onChange={(e) => setEditForm({ ...editForm, plan_type: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
            >
              <option value="credit">Кредит</option>
              <option value="monthly">Сарын</option>
            </select>
          </div>

          {editForm.plan_type === "monthly" && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">Сарын тариф</label>
              <select
                value={editForm.monthly_tier}
                onChange={(e) => setEditForm({ ...editForm, monthly_tier: e.target.value })}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
              >
                {MONTHLY_PLANS.map((p) => (
                  <option key={p.tier} value={p.tier}>{p.nameMn}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-1">Бот тохиргоо</label>
            <textarea
              value={editForm.bot_prompt}
              onChange={(e) => setEditForm({ ...editForm, bot_prompt: e.target.value })}
              rows={4}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Та ... компанийн AI туслагч байна..."
            />
          </div>

          {saveMsg && <p className="text-success text-sm">{saveMsg}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </form>

        {/* Credits + Platform */}
        <div className="space-y-4">
          {/* Credits */}
          <div className="card p-6">
            <h2 className="font-bold text-text-primary mb-4">Кредит</h2>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-text-secondary text-xs">Үлдсэн</p>
                <p className="text-2xl font-black text-gradient">{credits?.balance || 0}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Нийт авсан</p>
                <p className="text-xl font-bold text-text-primary">{credits?.total_purchased || 0}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
                placeholder="Кредит тоо"
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleAddCredits}
                disabled={loading === "add_credits"}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading === "add_credits" ? "..." : "Нэмэх"}
              </button>
            </div>
          </div>

          {/* Platform accounts */}
          <div className="card p-6">
            <h2 className="font-bold text-text-primary mb-4">Платформ акаунт</h2>
            <div className="space-y-2 mb-4">
              {business.platform_accounts?.map((pa: {id: string; platform: string; external_id: string}) => (
                <div key={pa.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs text-muted capitalize">{pa.platform}</span>
                    <p className="text-sm text-text-primary font-mono">{pa.external_id}</p>
                  </div>
                </div>
              ))}
              {(!business.platform_accounts || business.platform_accounts.length === 0) && (
                <p className="text-text-secondary text-sm">Платформ холбоогүй байна.</p>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={newPlatform.platform}
                onChange={(e) => setNewPlatform({ ...newPlatform, platform: e.target.value })}
                className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
              >
                <option value="instagram">Instagram</option>
                <option value="messenger">Messenger</option>
              </select>
              <input
                type="text"
                value={newPlatform.external_id}
                onChange={(e) => setNewPlatform({ ...newPlatform, external_id: e.target.value })}
                placeholder="External ID"
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
              />
              <button
                onClick={handleAddPlatform}
                disabled={loading === "add_platform"}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {loading === "add_platform" ? "..." : "+"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message logs */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-text-primary">Мессежийн түүх</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted font-medium px-6 py-3">Огноо</th>
                <th className="text-left text-muted font-medium px-6 py-3">Платформ</th>
                <th className="text-right text-muted font-medium px-6 py-3">Мессеж</th>
                <th className="text-right text-muted font-medium px-6 py-3">Prompt</th>
                <th className="text-right text-muted font-medium px-6 py-3">Completion</th>
                <th className="text-right text-muted font-medium px-6 py-3">Нийт токен</th>
                <th className="text-right text-muted font-medium px-6 py-3">Кредит</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                    Мессеж байхгүй байна.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-surface-2/50">
                    <td className="px-6 py-3 text-text-secondary">
                      {new Date(log.logged_at).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="px-6 py-3 text-text-secondary capitalize">{log.platform}</td>
                    <td className="px-6 py-3 text-right text-text-primary">{log.message_count}</td>
                    <td className="px-6 py-3 text-right text-text-secondary">{log.prompt_tokens}</td>
                    <td className="px-6 py-3 text-right text-text-secondary">{log.completion_tokens}</td>
                    <td className="px-6 py-3 text-right text-text-primary">{log.total_tokens.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-accent font-medium">{log.credits_used}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-text-primary">Төлбөрийн түүх</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted font-medium px-6 py-3">Огноо</th>
                <th className="text-right text-muted font-medium px-6 py-3">Дүн</th>
                <th className="text-right text-muted font-medium px-6 py-3">Кредит</th>
                <th className="text-left text-muted font-medium px-6 py-3">Арга</th>
                <th className="text-left text-muted font-medium px-6 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                    Төлбөр байхгүй байна.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-2/50">
                    <td className="px-6 py-3 text-text-secondary">
                      {new Date(tx.created_at).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="px-6 py-3 text-right text-success font-medium">
                      {tx.amount.toLocaleString()}₮
                    </td>
                    <td className="px-6 py-3 text-right text-accent">{tx.credits_added}</td>
                    <td className="px-6 py-3 text-text-secondary capitalize">{tx.payment_method}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        tx.status === "paid"
                          ? "text-success bg-success/10 border-success/30"
                          : tx.status === "pending"
                          ? "text-warning bg-warning/10 border-warning/30"
                          : "text-danger bg-danger/10 border-danger/30"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
