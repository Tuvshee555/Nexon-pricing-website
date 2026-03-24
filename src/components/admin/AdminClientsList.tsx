"use client";

import { useState } from "react";
import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";

interface Client {
  id: string;
  name: string;
  status: string;
  created_at: string;
  users: { email: string } | null;
  plans: { plan_type: string; monthly_tier?: string; monthly_price?: number } | null;
  credits: { balance: number } | null;
}

export default function AdminClientsList({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.users?.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "text-success bg-success/10 border-success/30",
      paused: "text-warning bg-warning/10 border-warning/30",
      cancelled: "text-danger bg-danger/10 border-danger/30",
    };
    const label: Record<string, string> = {
      active: "Идэвхтэй",
      paused: "Түр зогссон",
      cancelled: "Цуцлагдсан",
    };
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[status] || ""}`}>
        {label[status] || status}
      </span>
    );
  };

  const getPlanLabel = (plan: Client["plans"]) => {
    if (!plan) return "—";
    if (plan.plan_type === "credit") return "Кредит";
    const mp = MONTHLY_PLANS.find((p) => p.tier === plan.monthly_tier);
    return mp ? mp.nameMn : "Сарын";
  };

  return (
    <div className="card overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Хайх..."
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
              <th className="text-right text-muted font-medium px-6 py-3">Кредит</th>
              <th className="text-right text-muted font-medium px-6 py-3">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                  Хайлтад тохирох клиент олдсонгүй.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="border-b border-border/50 hover:bg-surface-2/50">
                  <td className="px-6 py-4 font-medium text-text-primary">{client.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{client.users?.email || "—"}</td>
                  <td className="px-6 py-4 text-text-secondary">{getPlanLabel(client.plans)}</td>
                  <td className="px-6 py-4">{statusBadge(client.status)}</td>
                  <td className="px-6 py-4 text-right text-accent font-medium">
                    {client.credits?.balance ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-primary hover:text-primary/80 text-xs font-semibold border border-primary/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Харах
                    </Link>
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
