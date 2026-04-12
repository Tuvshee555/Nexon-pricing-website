"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  const copy =
    lang === "mn"
      ? {
          tagline: "Монгол бизнесийн Instagram, Messenger яриаг илүү цэгцтэй ажиллуулахад зориулсан AI workflow platform.",
          product: "Бүтээгдэхүүн",
          contact: "Холбоо",
          rights: "Бүх эрх хуулиар хамгаалагдсан.",
          links: [
            { href: "/login", label: "Нэвтрэх" },
            { href: "/register", label: "Бүртгүүлэх" },
            { href: "/dashboard", label: "Хяналтын самбар" },
          ],
        }
      : {
          tagline:
            "An AI workflow platform for Mongolian businesses that want a cleaner, faster Instagram and Messenger operating rhythm.",
          product: "Product",
          contact: "Contact",
          rights: "All rights reserved.",
          links: [
            { href: "/login", label: "Login" },
            { href: "/register", label: "Register" },
            { href: "/dashboard", label: "Dashboard" },
          ],
        };

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 px-4 py-14 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
              N
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nexon</p>
              <p className="text-sm font-semibold text-slate-900">AI messaging platform</p>
            </div>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600">{copy.tagline}</p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">{copy.product}</h3>
          <div className="mt-4 space-y-3">
            {copy.links.map((link) => (
              <Link key={link.href} href={link.href} className="block text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">{copy.contact}</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <a href="tel:+97686185769" className="block transition-colors hover:text-slate-900">
              +976 8618 5769
            </a>
            <a href="mailto:nexondigitalnova@gmail.com" className="block transition-colors hover:text-slate-900">
              nexondigitalnova@gmail.com
            </a>
            <a href="https://www.instagram.com/nexon_digital_nova/" target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-slate-900">
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-6 text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Nexon Digital Nova. {copy.rights}
      </div>
    </footer>
  );
}
