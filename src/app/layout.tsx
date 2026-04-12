import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexon | AI conversations for Mongolian businesses",
  description:
    "AI-powered Instagram and Messenger automation for Mongolian businesses, with guided onboarding, live inbox visibility, and conversion-focused workflows.",
  keywords: ["AI chatbot", "Mongolia", "Instagram", "Messenger", "Nexon"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geistSans.variable, geistMono.variable)}>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <LanguageProvider>
          {children}
          <Toaster
            theme="light"
            position="top-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#111827",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
