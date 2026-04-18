"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  support: "bg-blue-100 text-blue-700",
  growth: "bg-emerald-100 text-emerald-700",
  viewer: "bg-slate-100 text-slate-600",
};

const roleDescriptions: Record<string, string> = {
  owner: "Full access — automation, billing, and channels",
  support: "Inbox manager — replies, assignments, escalations",
  growth: "Campaign editor — broadcasts, templates, sequences",
  viewer: "Read-only access — no editing",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "support" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => { setMembers(d.members || []); setLoading(false); });
  }, []);

  const invite = async () => {
    if (!form.email) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { member?: TeamMember; error?: string };
    if (data.member) {
      setMembers((prev) => {
        const exists = prev.find((m) => m.id === data.member!.id);
        return exists ? prev.map((m) => m.id === data.member!.id ? data.member! : m) : [...prev, data.member!];
      });
      setSuccess(`Invite sent to ${form.email}`);
      setForm({ email: "", name: "", role: "support" });
      setShowInvite(false);
    } else {
      setError(data.error ?? "Something went wrong");
    }
    setSaving(false);
  };

  const remove = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return;
    await fetch(`/api/team?id=${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Team</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Shared ownership for inbox, automation, and approvals
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Invite your support and growth team. Each role gets the right level of access.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowInvite(true); setError(null); setSuccess(null); }}
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Invite member
            </button>
            <Link href="/dashboard/inbox" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Open inbox
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <MetricCard label="Members" value={String(members.length)} note="Active + pending" />
          <MetricCard label="Active" value={String(members.filter((m) => m.status === "active").length)} note="Accepted invites" />
          <MetricCard label="Pending" value={String(members.filter((m) => m.status === "pending").length)} note="Waiting to accept" />
          <MetricCard label="Roles" value="4" note="Owner, Support, Growth, Viewer" />
        </div>
      </section>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-800">
          {success}
        </div>
      )}

      {showInvite && (
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5">Invite team member</h2>
          {error && <p className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Email</label>
              <input
                type="email"
                placeholder="colleague@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Name (optional)</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
              >
                <option value="support">Support (inbox manager)</option>
                <option value="growth">Growth (campaign editor)</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={invite}
              disabled={saving || !form.email}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Sending..." : "Send invite"}
            </button>
            <button onClick={() => setShowInvite(false)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="surface-panel rounded-[30px] p-6">
          <p className="section-label">Members</p>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
            Who&apos;s on the team
          </h2>
          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-sm text-slate-500 font-medium">No team members yet</p>
                <p className="text-xs text-slate-400 mt-1">Invite your first team member above.</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-black text-slate-950">{member.name || member.email}</p>
                      {member.name && <p className="text-sm text-slate-500">{member.email}</p>}
                      <p className="mt-1 text-xs text-slate-400">{roleDescriptions[member.role]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleColors[member.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {member.role}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {member.status === "active" ? "Active" : "Pending invite"}
                      </span>
                      <button
                        onClick={() => void remove(member.id, member.email)}
                        className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface-panel rounded-[30px] p-6">
          <p className="section-label">Role guide</p>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
            What each role can do
          </h2>
          <div className="mt-5 space-y-3">
            {[
              { role: "Owner", color: "bg-purple-100 text-purple-700", desc: "Full access — automation, billing, and channels" },
              { role: "Support", color: "bg-blue-100 text-blue-700", desc: "Inbox — reply, assign, escalate" },
              { role: "Growth", color: "bg-emerald-100 text-emerald-700", desc: "Campaigns — broadcasts, templates, sequences" },
              { role: "Viewer", color: "bg-slate-100 text-slate-600", desc: "Read-only — no editing" },
            ].map((r) => (
              <div key={r.role} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0 ${r.color}`}>{r.role}</span>
                <p className="text-sm leading-6 text-slate-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}
