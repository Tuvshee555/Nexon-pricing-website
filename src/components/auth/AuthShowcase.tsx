"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  stats: Array<{ label: string; value: string }>;
}

export default function AuthShowcase({
  eyebrow,
  title,
  description,
  highlights,
  stats,
}: Props) {
  return (
    <div className="hidden lg:flex lg:w-[46%] p-3">
      <div className="relative flex h-full w-full overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#0f4fe8_0%,#245ff0_48%,#1837a9_100%)] p-8 text-white soft-shadow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,212,145,0.24),transparent_30%)]" />

        <div className="relative flex w-full flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#0f4fe8]">
                N
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] uppercase text-white/70">Nexon</p>
                <p className="text-sm font-medium text-white/90">Messaging automation</p>
              </div>
            </Link>

            <div className="mt-10 max-w-md">
              <p className="section-label border-white/20 bg-white/10 text-white">{eyebrow}</p>
              <h2 className="mt-5 text-4xl font-black leading-tight">{title}</h2>
              <p className="mt-4 text-base leading-7 text-white/78">{description}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="surface-card rounded-[28px] p-5 text-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Today in the inbox</p>
                  <p className="mt-1 text-2xl font-black">Customers are getting answers faster</p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                  Live
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {highlights.map((highlight, index) => (
                  <motion.div
                    key={highlight}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{highlight}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 + index * 0.06 }}
                  className="rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/72">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
