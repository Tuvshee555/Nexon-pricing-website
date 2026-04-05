"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";
import { inferTransactionType } from "@/lib/transactions";
import { toast } from "sonner";

interface BusinessData {
  id: string;
  name: string;
  status: string;
  bot_prompt: string;
  contact_phone: string;
  contact_email: string;
  virtual_balance: number;
  subscription_price: number;
  next_billing_date: string | null;
  billing_active: boolean;
  users: { id: string; email: string } | null;
  plans: { id?: string; plan_type: string; monthly_tier?: string; monthly_price?: number } | null;
  credits: { balance: number; total_purchased: number } | null;
  platform_accounts: Array<{ id: string; platform: string; external_id: string }> | null;
}

interface Props {
  business: BusinessData;
  logs: Array<{
    id: string;
    logged_at: string;
    platform: string;
    message_count: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    credits_used: number;
  }>;
  transactions: Array<{
    id: string;
    created_at: string;
    amount: number;
    credits_added: number;
    payment_method: string;
    transaction_type?: string;
    status: string;
  }>;
}

const TX_TYPE_LABEL: Record<string, string> = {
  topup: "Үлдэгдэл нэмэх",
  message_pack: "Мессеж пакет",
  subscription: "Сарын захиалга",
  manual: "Гараар",
};

export default function AdminClientDetail({ business, logs, transactions }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [messagesInput, setMessagesInput] = useState("");
  const [balanceInput, setBalanceInput] = useState("");
  const [editForm, setEditForm] = useState({
    name: business.name,
    bot_prompt: business.bot_prompt,
    contact_phone: business.contact_phone,
    contact_email: business.contact_email,
    status: business.status,
    plan_type: business.plans?.plan_type || "credit",
    monthly_tier: business.plans?.monthly_tier || "basic",
    monthly_price: business.plans?.monthly_price || "",
    subscription_price: business.subscription_price || "",
    billing_active: business.billing_active || false,
    next_billing_date: business.next_billing_date
      ? business.next_billing_date.slice(0, 10)
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newPlatform, setNewPlatform] = useState({ platform: "instagram", external_id: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "messages" | "payments">("overview");

  const [actionError, setActionError] = useState("");

  const callAction = async (action: string, payload?: object) => {
    setLoading(action);
    setActionError("");
    try {
      const res = await fetch("/api/admin/client-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Алдаа гарлаа";
        setActionError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Амжилттай");
      router.refresh();
    } catch {
      setActionError("Сервертэй холбогдож чадсангүй");
      toast.error("Сервертэй холбогдож чадсангүй");
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
      const data = await res.json();
      if (res.ok) {
        setSaveMsg("Амжилттай хадгалагдлаа");
        toast.success("Амжилттай хадгалагдлаа");
        router.refresh();
      } else {
        toast.error(data.error || "Хадгалж чадсангүй");
      }
    } catch {
      toast.error("Сервертэй холбогдож чадсангүй");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBilling = async () => {
    await callAction("set_billing", {
      subscription_price: editForm.subscription_price,
      billing_active: editForm.billing_active,
      next_billing_date: editForm.next_billing_date || null,
    });
  };

  const handleAddMessages = async () => {
    const amount = parseInt(messagesInput);
    if (!amount || amount <= 0) return;
    await callAction("add_credits", { credits: amount });
    setMessagesInput("");
  };

  const handleReduceMessages = async () => {
    const amount = parseInt(messagesInput);
    if (!amount || amount <= 0) return;
    await callAction("reduce_credits", { credits: amount });
    setMessagesInput("");
  };

  const handleAddBalance = async () => {
    const amount = parseInt(balanceInput);
    if (!amount || amount <= 0) return;
    await callAction("add_balance", { amount });
    setBalanceInput("");
  };

  const handleAddPlatform = async () => {
    if (!newPlatform.external_id) return;
    await callAction("add_platform", newPlatform);
    setNewPlatform({ platform: "instagram", external_id: "" });
  };

  const credits = business.credits;
  const virtualBalance = business.virtual_balance || 0;
  const subscriptionPrice = business.subscription_price || 0;
  const isLowBalance = subscriptionPrice > 0 && virtualBalance < subscriptionPrice;

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

  const totalSpent = transactions
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/clients" className="text-text-secondary hover:text-text-primary transition-colors mt-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{business.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor[business.status] || ""}`}>
              {statusLabel[business.status] || business.status}
            </span>
            {isLowBalance && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border text-warning bg-warning/10 border-warning/30">
                ⚠️ Үлдэгдэл бага
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-0.5">{business.users?.email}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-4 flex flex-wrap gap-2">
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

      {actionError && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg p-3 text-sm">
          {actionError}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`card p-4 ${isLowBalance ? "border-warning/40" : ""}`}>
          <p className="text-text-secondary text-xs mb-1">Үлдэгдэл (₮)</p>
          <p className={`text-2xl font-black ${isLowBalance ? "text-warning" : "text-gradient"}`}>
            {virtualBalance.toLocaleString()}₮
          </p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs mb-1">Үлдсэн мессеж</p>
          <p className="text-2xl font-black text-text-primary">{credits?.balance || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs mb-1">Нийт төлсөн</p>
          <p className="text-2xl font-black text-success">{totalSpent.toLocaleString()}₮</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-xs mb-1">Нийт авсан мессеж</p>
          <p className="text-2xl font-black text-text-primary">{credits?.total_purchased || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-surface border border-border rounded-xl p-1">
        {(["overview", "messages", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {{ overview: "Тойм", messages: "Мессеж", payments: "Төлбөр" }[t]}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
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
                  value={editForm[f.key as keyof typeof editForm] as string}
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
                <option value="credit">Мессеж пакет</option>
                <option value="monthly">Сарын захиалга</option>
              </select>
            </div>

            {editForm.plan_type === "monthly" && (() => {
              const selected = MONTHLY_PLANS.find((p) => p.tier === editForm.monthly_tier);
              return (
                <div className="space-y-2">
                  <label className="block text-sm text-text-secondary mb-1">Сарын тариф</label>
                  <select
                    value={editForm.monthly_tier}
                    onChange={(e) => setEditForm({ ...editForm, monthly_tier: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
                  >
                    {MONTHLY_PLANS.filter((p) => p.tier !== "enterprise").map((p) => (
                      <option key={p.tier} value={p.tier}>
                        {p.nameMn} — {p.price.toLocaleString()}₮/сар — {p.messageLimit.toLocaleString()} мессеж
                      </option>
                    ))}
                  </select>
                  {selected && selected.tier !== "enterprise" && (
                    <div className="bg-surface-2 rounded-lg px-3 py-2 text-xs text-text-secondary">
                      💰 {selected.price.toLocaleString()}₮/сар &nbsp;·&nbsp; 💬 {selected.messageLimit.toLocaleString()} мессеж/сар
                    </div>
                  )}
                </div>
              );
            })()}

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

          <div className="space-y-4">
            {/* Мессеж нэмэх */}
            <div className="card p-6">
              <h2 className="font-bold text-text-primary mb-4">Мессеж нэмэх</h2>
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
                  value={messagesInput}
                  onChange={(e) => setMessagesInput(e.target.value)}
                  placeholder="Мессеж тоо"
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddMessages}
                  disabled={loading === "add_credits"}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading === "add_credits" ? "..." : "Нэмэх"}
                </button>
                <button
                  onClick={handleReduceMessages}
                  disabled={loading === "reduce_credits"}
                  className="px-4 py-2 bg-danger/10 hover:bg-danger/20 border border-danger/30 disabled:opacity-50 text-danger text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading === "reduce_credits" ? "..." : "Хасах"}
                </button>
              </div>
            </div>

            {/* Үлдэгдэл нэмэх */}
            <div className={`card p-6 ${isLowBalance ? "border-warning/40" : ""}`}>
              <h2 className="font-bold text-text-primary mb-4">Үлдэгдэл (₮)</h2>
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-text-secondary text-xs">Одоогийн</p>
                  <p className={`text-2xl font-black ${isLowBalance ? "text-warning" : "text-gradient"}`}>
                    {virtualBalance.toLocaleString()}₮
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs">Сарын захиалга</p>
                  <p className="text-xl font-bold text-text-primary">
                    {subscriptionPrice.toLocaleString()}₮
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="Нэмэх дүн (₮)"
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddBalance}
                  disabled={loading === "add_balance"}
                  className="px-4 py-2 bg-success/20 hover:bg-success/30 border border-success/30 text-success text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading === "add_balance" ? "..." : "Нэмэх"}
                </button>
              </div>

              {/* Billing settings */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editForm.subscription_price as string}
                    onChange={(e) => setEditForm({ ...editForm, subscription_price: e.target.value })}
                    placeholder="Сарын захиалгын үнэ"
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="date"
                    value={editForm.next_billing_date}
                    onChange={(e) => setEditForm({ ...editForm, next_billing_date: e.target.value })}
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.billing_active}
                      onChange={(e) => setEditForm({ ...editForm, billing_active: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    Автомат хасалт идэвхтэй
                  </label>
                  <button
                    onClick={handleSaveBilling}
                    disabled={loading === "set_billing"}
                    className="text-xs px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors disabled:opacity-50"
                  >
                    Хадгалах
                  </button>
                </div>
              </div>
            </div>

            {/* Platform accounts */}
            <div className="card p-6">
              <h2 className="font-bold text-text-primary mb-4">Платформ акаунт</h2>
              <div className="space-y-2 mb-4">
                {business.platform_accounts?.map((pa) => (
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
      )}

      {/* Messages tab */}
      {activeTab === "messages" && (
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
                  <th className="text-right text-muted font-medium px-6 py-3">Зарцуулсан</th>
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
      )}

      {/* Payments tab */}
      {activeTab === "payments" && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-text-primary">Төлбөрийн түүх</h2>
            <span className="text-sm text-success font-semibold">
              Нийт: {totalSpent.toLocaleString()}₮
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted font-medium px-6 py-3">Огноо</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Дүн</th>
                  <th className="text-right text-muted font-medium px-6 py-3">Мессеж</th>
                  <th className="text-left text-muted font-medium px-6 py-3">Төрөл</th>
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
                        {tx.amount > 0 ? `${tx.amount.toLocaleString()}₮` : "—"}
                      </td>
                      <td className="px-6 py-3 text-right text-accent">
                        {tx.credits_added > 0 ? tx.credits_added : "—"}
                      </td>
                      <td className="px-6 py-3 text-text-secondary text-xs">
                        {TX_TYPE_LABEL[inferTransactionType(tx)] || tx.payment_method}
                      </td>
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
      )}
    </div>
  );
}
