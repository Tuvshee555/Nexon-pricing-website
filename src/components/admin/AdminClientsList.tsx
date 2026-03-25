"use client";

import { useState } from "react";
import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";

interface Client {
  userId: string;
  businessId: string | null;
  name: string;
  email: string;
  status: string;
  created_at: string;
  virtual_balance: number;
  subscription_price: number;
  plans: { plan_type: string; monthly_tier?: string; monthly_price?: number } | null;
  credits: { balance: number } | null;
}

export default function AdminClientsList({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const isLow =
      c.subscription_price > 0 && (c.virtual_balance || 0) < c.subscription_price;
    const noBiz = !c.businessId;
    if (filter === "low_balance") return matchSearch && isLow;
    if (filter === "no_business") return matchSearch && noBiz;
    if (filter === "all") return matchSearch;
    return matchSearch && c.status === filter;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "text-success bg-success/10 border-success/30",
      paused: "text-warning bg-warning/10 border-warning/30",
      cancelled: "text-danger bg-danger/10 border-danger/30",
      no_business: "text-muted bg-surface-2 border-border",
    };
    const label: Record<string, string> = {
      active: "Идэвхтэй",
      paused: "Түр зогссон",
      cancelled: "Цуцлагдсан",
      no_business: "Бизнес байхгүй",
    };
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[status] || ""}`}>
        {label[status] || status}
      </span>
    );
  };

  const getPlanLabel = (plan: Client["plans"]) => {
    if (!plan) return "—";
    if (plan.plan_type === "credit") return "Мессеж пакет";
    const mp = MONTHLY_PLANS.find((p) => p.tier === plan.monthly_tier);
    return mp ? mp.nameMn : "Сарын";
  };

  const isLowBalance = (c: Client) =>
    c.subscription_price > 0 && (c.virtual_balance || 0) < c.subscription_price;

  const lowCount = clients.filter(isLowBalance).length;
  const noBizCount = clients.filter((c) => !c.businessId).length;

  return (
    <div className="card overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Нэр эсвэл и-мэйлээр хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2 text-text-primary placeholder-muted text-sm focus:outline-none focus:border-primary"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Бүгд</option>
          <option value="active">Идэвхтэй</option>
          <option value="paused">Түр зогссон</option>
          <option value="cancelled">Цуцлагдсан</option>
          {noBizCount > 0 && (
            <option value="no_business">Бизнес байхгүй ({noBizCount})</option>
          )}
          {lowCount > 0 && (
            <option value="low_balance">⚠️ Үлдэгдэл бага ({lowCount})</option>
          )}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted font-medium px-6 py-3">Нэр</th>
              <th className="text-left text-muted font-medium px-6 py-3">И-мэйл</th>
              <th className="text-left text-muted font-medium px-6 py-3">Төлөвлөгөө</th>
              <th className="text-left text-muted font-medium px-6 py-3">Статус</th>
              <th className="text-right text-muted font-medium px-6 py-3">Үлдэгдэл</th>
              <th className="text-right text-muted font-medium px-6 py-3">Мессеж</th>
              <th className="text-right text-muted font-medium px-6 py-3">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                  Хайлтад тохирох клиент олдсонгүй.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.userId}
                  className={`border-b border-border/50 hover:bg-surface-2/50 ${
                    isLowBalance(client) ? "bg-warning/5" : ""
                  } ${!client.businessId ? "bg-surface-2/30" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      {client.name || <span className="text-muted italic">Тохируулаагүй</span>}
                      {isLowBalance(client) && (
                        <span className="text-warning text-xs">⚠️</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{client.email || "—"}</td>
                  <td className="px-6 py-4 text-text-secondary">
                    {client.businessId ? getPlanLabel(client.plans) : "—"}
                  </td>
                  <td className="px-6 py-4">{statusBadge(client.status)}</td>
                  <td className="px-6 py-4 text-right">
                    {client.businessId && client.subscription_price > 0 ? (
                      <span className={`font-medium ${isLowBalance(client) ? "text-warning" : "text-success"}`}>
                        {(client.virtual_balance || 0).toLocaleString()}₮
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-accent font-medium">
                    {client.businessId ? (client.credits?.balance ?? "—") : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {client.businessId ? (
                      <Link
                        href={`/admin/clients/${client.businessId}`}
                        className="text-primary hover:text-primary/80 text-xs font-semibold border border-primary/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Харах
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/clients/setup/${client.userId}`}
                        className="text-accent hover:text-accent/80 text-xs font-semibold border border-accent/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Тохируулах
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
