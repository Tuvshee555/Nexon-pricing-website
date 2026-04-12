import Link from "next/link";

const templateGroups = [
  {
    name: "Lead capture",
    summary: "Start a conversation with qualification and a clear next step.",
    templates: [
      {
        title: "Welcome and qualify",
        detail: "Greets the user, asks one qualifying question, and routes the lead.",
        tags: ["welcome", "lead", "handoff"],
      },
      {
        title: "Offer interest",
        detail: "Captures what the customer wants before showing pricing or a demo.",
        tags: ["interest", "sales", "routing"],
      },
    ],
  },
  {
    name: "Support",
    summary: "Give fast answers, then hand off when a human is needed.",
    templates: [
      {
        title: "FAQ auto-responder",
        detail: "Replies to price, hours, shipping, and availability questions.",
        tags: ["faq", "support", "self-serve"],
      },
      {
        title: "Escalation path",
        detail: "Flags the chat and notifies the team when the answer is uncertain.",
        tags: ["handoff", "team", "priority"],
      },
    ],
  },
  {
    name: "Retention",
    summary: "Follow up after the first conversation without being noisy.",
    templates: [
      {
        title: "Abandoned lead follow-up",
        detail: "Checks back after the user leaves mid-conversation.",
        tags: ["follow-up", "nurture", "delay"],
      },
      {
        title: "Post-purchase care",
        detail: "Sends useful info after a sale or booking to reduce support load.",
        tags: ["retention", "care", "automation"],
      },
    ],
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Templates</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Start from proven flows instead of building everything from scratch
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              These are structured starting points for the most common customer journeys. They help users move faster and keep the product easier to learn.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/flows" className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Build a flow
            </Link>
            <Link href="/dashboard/automation" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Review automation
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <MetricCard label="Template groups" value={String(templateGroups.length)} note="Organized by outcome" />
          <MetricCard label="Starter templates" value={String(templateGroups.reduce((sum, group) => sum + group.templates.length, 0))} note="Ready to adapt" />
          <MetricCard label="Goal" value="Faster setup" note="Less blank-canvas friction" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          {templateGroups.map((group) => (
            <section key={group.name} className="surface-panel rounded-[30px] p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{group.name}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">{group.summary}</h2>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {group.templates.length} templates
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {group.templates.map((template) => (
                  <div key={template.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black text-slate-950">{template.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{template.detail}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Link href="/dashboard/flows" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800">
                        Use in flows
                      </Link>
                      <Link href="/dashboard/automation" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                        Connect trigger
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="surface-panel rounded-[30px] p-6">
            <p className="section-label">How to use</p>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950">
              Templates should reduce setup time, not box users in
            </h2>
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              <p>Pick the template that matches the user intent you see most often.</p>
              <p>Adapt the copy, then connect it to a trigger in automation or a flow.</p>
              <p>Keep the template library simple so the user can get to value fast.</p>
            </div>
          </div>

          <div className="surface-panel rounded-[30px] p-6">
            <p className="section-label">Template checklist</p>
            <div className="mt-5 space-y-3">
              {[
                "Use one clear goal per template",
                "Show the next step after the first reply",
                "Include a human handoff path",
                "Make the template easy to edit",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
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
