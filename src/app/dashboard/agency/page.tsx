"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AgencyClient {
  id: string;
  name: string;
  status: string;
  virtual_balance: number;
  created_at: string;
  owner_email: string;
  contact_count: number;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AgencyPage() {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agency/clients")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); } else { setClients(d.clients || []); }
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">Agency access required</p>
          <p className="text-sm text-slate-500 mt-2">Your account needs to be set up as an agency. Contact support to enable this.</p>
          <Link href="/dashboard" className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalContacts = clients.reduce((s, c) => s + c.contact_count, 0);
  const activeClients = clients.filter((c) => c.status === "active").length;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Agency</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Manage your client accounts
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              View all client businesses under your agency. Each client has their own bot, contacts, and billing.
            </p>
          </div>
          <Link href="/admin" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap">
            Admin panel
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <MetricCard label="Total clients" value={String(clients.length)} />
          <MetricCard label="Active" value={String(activeClients)} />
          <MetricCard label="Total contacts" value={String(totalContacts)} />
          <MetricCard label="Paused" value={String(clients.filter((c) => c.status === "paused").length)} />
        </div>
      </section>

      {loading ? (
        <div className="text-center text-sm text-slate-400 py-10">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500 font-medium">No clients yet</p>
          <p className="text-sm text-slate-400 mt-2">
            Clients are added by creating a business with your agency ID. Contact support to add clients.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-slate-900 text-base">{client.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{client.owner_email}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{client.contact_count} contacts</span>
                    <span>•</span>
                    <span>Balance: {client.virtual_balance.toLocaleString()}₮</span>
                    <span>•</span>
                    <span>Joined {new Date(client.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize flex-shrink-0 ${statusColors[client.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {client.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">{value}</p>
    </div>
  );
}
