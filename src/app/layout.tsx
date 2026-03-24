import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
    <html lang="mn">
      <body className="antialiased bg-background text-text-primary">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
