import Link from "next/link";

const teamMembers = [
  {
    name: "Owner",
    role: "Full access",
    focus: "Automation, billing, and channel setup",
    status: "Active",
  },
  {
    name: "Support lead",
    role: "Inbox manager",
    focus: "Replies, assignments, and escalations",
    status: "Needs invite",
  },
  {
    name: "Growth operator",
    role: "Campaign editor",
    focus: "Broadcasts, templates, and sequences",
    status: "Ready",
  },
];

const collaborationNotes = [
  "Keep one place for assignments so handoffs are obvious.",
  "Write short internal notes when a human needs context.",
  "Use shared replies so the team answers consistently.",
  "Make approval and review steps visible before a campaign goes live.",
];

export default function TeamPage() {
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
              Collaboration gets stronger when every handoff, note, and approval step is easy to see.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/inbox" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Open inbox
            </Link>
            <Link href="/dashboard/settings" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Team settings
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <MetricCard label="Members" value="3" note="Demo workspace" />
          <MetricCard label="Open handoffs" value="7" note="Needs human review" />
          <MetricCard label="Notes today" value="12" note="Internal context added" />
          <MetricCard label="Approvals" value="2" note="Waiting on review" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="surface-panel rounded-[30px] p-6">
          <p className="section-label">Roles</p>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
            Who owns what in the workspace
          </h2>
          <div className="mt-5 space-y-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{member.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {member.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{member.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="surface-panel rounded-[30px] p-6">
            <p className="section-label">Collaboration rules</p>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
              Small habits make the team faster
            </h2>
            <div className="mt-5 space-y-3">
              {collaborationNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm leading-7 text-slate-600">{note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-panel rounded-[30px] p-6">
            <p className="section-label">Team workflow</p>
            <div className="mt-5 space-y-3">
              {[
                "Assign conversations from the inbox",
                "Leave internal notes before escalation",
                "Approve flows and broadcasts before launch",
                "Keep saved replies in one shared source",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
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
