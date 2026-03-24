"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border/50" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="text-xl font-black text-gradient">NEXON</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo("features")}
              className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
            >
              {t("nav_features")}
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
            >
              {t("nav_pricing")}
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
            >
              {t("nav_howItWorks")}
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
            >
              {t("nav_contact")}
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "mn" ? "en" : "mn")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all"
            >
              {lang === "mn" ? "EN" : "МН"}
            </button>

            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              {t("nav_login")}
            </Link>

            <Link
              href="/register"
              className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {t("nav_register")}
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-text-secondary"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass border-t border-border/50 py-4 space-y-2">
            {[
              { label: t("nav_features"), id: "features" },
              { label: t("nav_pricing"), id: "pricing" },
              { label: t("nav_howItWorks"), id: "how-it-works" },
              { label: t("nav_contact"), id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="px-4 pt-2">
              <Link href="/login" className="block text-sm text-text-secondary py-2">
                {t("nav_login")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
