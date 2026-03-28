"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-strong border-b border-primary/10 shadow-lg shadow-primary/5"
          : "bg-transparent"
      }`}
    >
      {/* Top glow line when scrolled */}
      {scrolled && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-primary"
            >
              <span className="text-white font-black text-sm">N</span>
            </motion.div>
            <span className="text-xl font-black text-gradient-animated">NEXON</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: t("nav_features"), id: "features" },
              { label: t("nav_pricing"), id: "pricing" },
              { label: t("nav_howItWorks"), id: "how-it-works" },
              { label: t("nav_contact"), id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="relative text-text-secondary hover:text-text-primary text-sm font-medium transition-colors group"
              >
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang(lang === "mn" ? "en" : "mn")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all duration-200"
            >
              {lang === "mn" ? "EN" : "МН"}
            </motion.button>

            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              {t("nav_login")}
            </Link>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="btn-shimmer bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors glow-primary"
              >
                {t("nav_register")}
              </Link>
            </motion.div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-text-secondary"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <AnimatePresence mode="wait">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </AnimatePresence>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden glass-strong border-t border-border/50 overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {[
                  { label: t("nav_features"), id: "features" },
                  { label: t("nav_pricing"), id: "pricing" },
                  { label: t("nav_howItWorks"), id: "how-it-works" },
                  { label: t("nav_contact"), id: "contact" },
                ].map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    onClick={() => scrollTo(item.id)}
                    className="block w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </motion.button>
                ))}
                <div className="px-4 pt-2">
                  <Link href="/login" className="block text-sm text-text-secondary py-2">
                    {t("nav_login")}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
