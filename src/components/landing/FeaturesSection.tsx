"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    titleKey: "feature1_title" as const,
    descKey: "feature1_desc" as const,
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-400/50",
    iconGlow: "rgba(15,79,232,0.5)",
    iconBg: "bg-blue-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    titleKey: "feature2_title" as const,
    descKey: "feature2_desc" as const,
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-400/50",
    iconGlow: "rgba(168,85,247,0.5)",
    iconBg: "bg-purple-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    titleKey: "feature3_title" as const,
    descKey: "feature3_desc" as const,
    gradient: "from-green-500/20 to-teal-500/20",
    border: "border-green-500/20",
    hoverBorder: "hover:border-green-400/50",
    iconGlow: "rgba(16,185,129,0.5)",
    iconBg: "bg-green-500/10",
  },
];

export default function FeaturesSection() {
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[40rem] w-[60rem] rounded-full opacity-10"
          style={{
            background: "radial-gradient(ellipse, rgba(15,79,232,0.6) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-text-primary mb-4">
            {t("features_title")}
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            {t("features_subtitle")}
          </p>
          {/* Decorative line */}
          <div className="mt-6 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.15, duration: 0.7, ease: "easeOut" }}
              className={`group relative p-8 rounded-2xl border ${feature.border} ${feature.hoverBorder} bg-gradient-to-br ${feature.gradient} backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-default`}
            >
              {/* Top glow line on hover */}
              <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300" />

              {/* Icon */}
              <div
                className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.iconBg} text-accent mb-5 transition-all duration-300 group-hover:scale-110`}
                style={{ boxShadow: `0 0 0 0 ${feature.iconGlow}` }}
              >
                {/* Rotating ring on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border border-current opacity-0 group-hover:opacity-30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-gradient transition-all duration-300">
                {t(feature.titleKey)}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {t(feature.descKey)}
              </p>

              {/* Bottom accent */}
              <div className="absolute inset-x-0 bottom-0 h-px rounded-b-2xl bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
