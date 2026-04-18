"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  user: { email?: string | null; name?: string | null };
  role: string;
}

const HomeIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l9-8 9 8M5 10v10h14V10" />
  </svg>
);
const ContactsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20h10M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const AutomationIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 3L4 14h7v7l9-11h-7V3z" />
  </svg>
);
const SequencesIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h11M8 12h11M8 17h7M4 7h.01M4 12h.01M4 17h.01" />
  </svg>
);
const AnalyticsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 19V5m5 14V9m5 10V13m4 6H3" />
  </svg>
);
const FlowsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10v4H7zM7 13h10v4H7z" />
  </svg>
);
const InboxIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15a2 2 0 01-2 2h-4l-3 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8z" />
  </svg>
);
const BroadcastIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.5v13a1.5 1.5 0 01-2.9.5L6 13m12 0a3 3 0 100-6M6.5 13.5A4 4 0 018 6h1.5c4 0 7.3-1.2 8.5-3v14c-1.2-1.8-4.5-3-8.5-3H8a4 4 0 01-1.5-.5z" />
  </svg>
);
const AIIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2m6.36 1.64l-1.41 1.41M21 12h-2M5 12H3m3.05-5.95L7.46 7.46M9 17h6m-7-1.5a5 5 0 117 0l-.55.55A3.3 3.3 0 0013.5 18v1a1.5 1.5 0 11-3 0v-1c0-.73-.29-1.43-.8-1.95L9 16.5z" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8.5A3.5 3.5 0 1112 15.5 3.5 3.5 0 0112 8.5zm7.4 3.5a7.2 7.2 0 00-.08-1l2.03-1.58-1.92-3.32-2.46.69a7.5 7.5 0 00-1.73-1l-.37-2.5h-3.84l-.37 2.5c-.61.22-1.19.55-1.72.96l-2.46-.69-1.92 3.32 2.02 1.58c-.05.33-.08.67-.08 1 0 .34.03.68.08 1.01L2.5 14.59l1.92 3.32 2.46-.69c.53.41 1.11.73 1.72.96l.37 2.52h3.84l.37-2.52c.61-.23 1.19-.55 1.73-.96l2.46.69 1.92-3.32-2.03-1.58c.05-.33.08-.67.08-1.01z" />
  </svg>
);
const CatalogIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const WebhookIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const TeamIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
  </svg>
);

export default function DashboardSidebar({ user, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const clientSections = [
    {
      label: "Overview",
      links: [{ href: "/dashboard", label: "Home", icon: <HomeIcon /> }],
    },
    {
      label: "Engage",
      links: [
        { href: "/dashboard/inbox", label: "Inbox", icon: <InboxIcon /> },
        { href: "/dashboard/contacts", label: "Contacts", icon: <ContactsIcon /> },
        { href: "/dashboard/broadcasts", label: "Broadcasts", icon: <BroadcastIcon /> },
      ],
    },
    {
      label: "Build",
      links: [
        { href: "/dashboard/automation", label: "Automation", icon: <AutomationIcon /> },
        { href: "/dashboard/sequences", label: "Sequences", icon: <SequencesIcon /> },
        { href: "/dashboard/flows", label: "Flows", icon: <FlowsIcon /> },
        { href: "/dashboard/ai", label: "AI", icon: <AIIcon /> },
        { href: "/dashboard/catalog", label: "Catalog", icon: <CatalogIcon /> },
      ],
    },
    {
      label: "Monitor",
      links: [
        { href: "/dashboard/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
        { href: "/dashboard/team", label: "Team", icon: <TeamIcon /> },
        { href: "/dashboard/webhooks", label: "Webhooks", icon: <WebhookIcon /> },
        { href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon /> },
      ],
    },
  ];

  const adminSections = [
    {
      label: "Admin",
      links: [
        { href: "/admin", label: "Dashboard", icon: <AnalyticsIcon /> },
        { href: "/admin/clients", label: "Clients", icon: <ContactsIcon /> },
      ],
    },
  ];

  const sections = role === "admin" ? adminSections : clientSections;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0f172a_0%,#111827_55%,#172554_100%)] text-slate-100">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-900">
            N
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nexon</p>
            <p className="text-sm font-semibold text-white">Workflow console</p>
          </div>
        </Link>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <p className="mt-2 text-lg font-black text-white">AI messaging</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">Calmer inbox visibility with clearer automation control.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </p>
            <div className="mt-2 space-y-1">
              {section.links.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-white text-slate-900 shadow-lg"
                        : "text-slate-300 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className={active ? "text-primary" : "text-slate-400"}>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">
              {(user.name || user.email || "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name || user.email}</p>
              <p className="text-xs text-slate-400">{role === "admin" ? "Admin access" : "Client workspace"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/12"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </aside>

      <button
        className="fixed left-4 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label="Open dashboard navigation"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col lg:hidden relative">
            <button
              type="button"
              aria-label="Close dashboard navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-200 transition-colors hover:bg-white/12"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
