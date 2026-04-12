"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_COPY: Array<{ match: string; title: string; subtitle: string }> = [
  { match: "/dashboard/contacts", title: "Contacts", subtitle: "Track leads, segments, and customer profiles." },
  { match: "/dashboard/automation", title: "Automation", subtitle: "Shape the rules that turn questions into actions." },
  { match: "/dashboard/sequences", title: "Sequences", subtitle: "Review follow-up journeys and campaign timing." },
  { match: "/dashboard/analytics", title: "Analytics", subtitle: "See where the inbox is creating momentum." },
  { match: "/dashboard/flows", title: "Flows", subtitle: "Organize guided paths for FAQs, orders, and handoffs." },
  { match: "/dashboard/inbox", title: "Inbox", subtitle: "Stay close to the conversations that need a human touch." },
  { match: "/dashboard/broadcasts", title: "Broadcasts", subtitle: "Send updates with more context and less chaos." },
  { match: "/dashboard/ai", title: "AI Settings", subtitle: "Tune response quality, prompts, and assistant behavior." },
  { match: "/dashboard/settings", title: "Settings", subtitle: "Manage workspace details, channels, and billing." },
  { match: "/dashboard/setup", title: "Workspace Setup", subtitle: "Finish your channel and business configuration." },
];

function getPageCopy(pathname: string) {
  return PAGE_COPY.find((item) => pathname.startsWith(item.match)) ?? {
    title: "Home",
    subtitle: "Monitor channel health, automation coverage, and team visibility.",
  };
}

export default function DashboardTopbar() {
  const pathname = usePathname();
  const copy = getPageCopy(pathname);

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Workspace
          </div>
          <h1 className="mt-3 text-2xl font-black text-slate-900">{copy.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{copy.subtitle}</p>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Automation online
          </div>
          <Link
            href="/dashboard/inbox"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Open inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
