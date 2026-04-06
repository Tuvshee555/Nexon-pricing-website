import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nexon — Бизнесийн AI Чатбот",
  description:
    "Instagram болон Facebook Messenger-т ажилладаг AI чатбот. Монгол бизнесүүдэд зориулсан.",
  keywords: ["AI chatbot", "Mongolia", "Instagram", "Messenger", "Nexon"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={cn("font-sans", inter.variable)}>
      <body className="antialiased bg-background text-text-primary">
        <LanguageProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#111118",
                border: "1px solid #1E1E2E",
                color: "#F0F0FF",
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
