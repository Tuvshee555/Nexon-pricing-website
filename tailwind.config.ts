import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        primary: "#0F4FE8",
        accent: "#00D4FF",
        surface: "#111118",
        "surface-2": "#16161F",
        border: "#1E1E2E",
        muted: "#6B7280",
        "text-primary": "#F0F0FF",
        "text-secondary": "#9CA3AF",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(15,79,232,0.3), transparent)",
        "card-gradient": "linear-gradient(135deg, rgba(15,79,232,0.08) 0%, rgba(0,212,255,0.04) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "float-slow": "float 8s ease-in-out 1s infinite",
        "aurora-1": "aurora1 12s ease-in-out infinite",
        "aurora-2": "aurora2 15s ease-in-out infinite",
        "aurora-3": "aurora3 18s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "spin-slow": "spin 8s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "scan-line": "scanLine 4s linear infinite",
        "border-glow": "borderGlow 3s ease-in-out infinite",
        "counter-up": "counterUp 1s ease-out forwards",
        "text-shimmer": "textShimmer 3s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        aurora1: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)", opacity: "0.6" },
          "33%": { transform: "translate(5%, -8%) scale(1.1)", opacity: "0.8" },
          "66%": { transform: "translate(-3%, 5%) scale(0.95)", opacity: "0.5" },
        },
        aurora2: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)", opacity: "0.5" },
          "33%": { transform: "translate(-6%, 6%) scale(1.15)", opacity: "0.7" },
          "66%": { transform: "translate(4%, -4%) scale(0.9)", opacity: "0.4" },
        },
        aurora3: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)", opacity: "0.4" },
          "50%": { transform: "translate(3%, -6%) scale(1.08)", opacity: "0.65" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(15,79,232,0.3), 0 0 60px rgba(0,212,255,0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(15,79,232,0.6), 0 0 100px rgba(0,212,255,0.25)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(15,79,232,0.3)" },
          "50%": { borderColor: "rgba(0,212,255,0.6)" },
        },
        counterUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        textShimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
