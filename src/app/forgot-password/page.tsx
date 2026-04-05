"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black text-gradient">NEXON</span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2 text-center">
            {t("forgot_password_title")}
          </h1>
          <p className="text-text-secondary text-sm text-center mb-6">
            {t("forgot_password_subtitle")}
          </p>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-text-primary font-medium">{t("forgot_password_sent")}</p>
              <p className="text-text-secondary text-sm">{t("forgot_password_check_email")}</p>
              <Link
                href="/login"
                className="inline-block text-primary hover:text-primary/80 text-sm font-medium transition-colors mt-4"
              >
                {t("forgot_password_back_login")}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {t("login_email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-muted focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {t("forgot_password_submit")}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary mt-6">
                <Link href="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
                  {t("forgot_password_back_login")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
