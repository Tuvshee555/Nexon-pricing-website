"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: t("nav_features"), id: "features" },
    { label: t("nav_pricing"), id: "pricing" },
    { label: t("nav_howItWorks"), id: "how-it-works" },
    { label: t("nav_contact"), id: "contact" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <motion.nav
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`mx-auto max-w-7xl rounded-[24px] border transition-all duration-300 ${
          scrolled
            ? "border-slate-200/80 bg-white/88 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            : "border-white/60 bg-white/72 backdrop-blur-lg"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
              N
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nexon</p>
              <p className="text-sm font-semibold text-slate-900">AI messaging platform</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={() => setLang(lang === "mn" ? "en" : "mn")}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              {lang === "mn" ? "EN" : "MN"}
            </button>
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
              {t("nav_login")}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {t("nav_register")}
            </Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200 lg:hidden"
            >
              <div className="space-y-2 px-5 py-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    {item.label}
                  </button>
                ))}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setLang(lang === "mn" ? "en" : "mn")}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    {lang === "mn" ? "EN" : "MN"}
                  </button>
                  <Link href="/login" className="text-sm font-semibold text-slate-700">
                    {t("nav_login")}
                  </Link>
                  <Link href="/register" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    {t("nav_register")}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
