"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, MonthlyTier } from "@/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const requestedTier = searchParams.get("plan") as MonthlyTier | null;
  const selectedPlan = requestedTier ? MONTHLY_PLANS.find((plan) => plan.tier === requestedTier) : null;
  const setupTarget = selectedPlan ? `/dashboard/setup?plan=${selectedPlan.tier}` : "/dashboard";

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Нэвтрэх",
          title: "Танай inbox-ийг удирдах workspace руу орно уу",
          subtitle: "Нэг сувгийн чат бус, бүх урсгалаа нэг дороос удирдах орчин руу буцаж орно уу.",
          rightEyebrow: "Team rhythm",
          rightTitle: "Өдөр тутмын чатыг илүү цэгцтэй ажиллуул",
          rightDescription: "Lead flow, FAQ automation, human handoff бүгд нэг системд харагдана.",
          highlights: [
            "Давтагддаг асуултыг automation route руу оруулна",
            "Чухал inbox-уудыг баг руу зөв мөчид дамжуулна",
            "Dashboard дээрээ activity-гаа өдөр бүр хянана",
          ],
          stats: [
            { label: "Сувгууд", value: "2" },
            { label: "Live rules", value: "14" },
            { label: "Handoff", value: "9" },
          ],
          google: "Google-ээр үргэлжлүүлэх",
          divider: "эсвэл имэйлээр",
          email: "И-мэйл",
          password: "Нууц үг",
          forgot: "Мартсан?",
          submit: "Нэвтрэх",
          submitting: "Нэвтэрч байна...",
          footer: "Бүртгэлгүй юу?",
          register: "Бүртгүүлэх",
          error: "И-мэйл эсвэл нууц үг буруу байна.",
        }
      : {
          eyebrow: "Sign in",
          title: "Return to the workspace that runs your inbox",
          subtitle: "Jump back into the place where channels, automations, and handoffs stay organized.",
          rightEyebrow: "Team rhythm",
          rightTitle: "Run daily conversations with more clarity",
          rightDescription: "Lead flow, FAQ automation, and human handoff all stay visible inside one system.",
          highlights: [
            "Route repeat questions into the right automation paths",
            "Send important inbox moments to your team at the right time",
            "Track daily activity from a calmer dashboard view",
          ],
          stats: [
            { label: "Channels", value: "2" },
            { label: "Live rules", value: "14" },
            { label: "Handoffs", value: "9" },
          ],
          google: "Continue with Google",
          divider: "or continue with email",
          email: "Email",
          password: "Password",
          forgot: "Forgot?",
          submit: "Sign in",
          submitting: "Signing in...",
          footer: "Need an account?",
          register: "Register",
          error: "Your email or password is incorrect.",
        };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(copy.error);
      setLoading(false);
      return;
    }

    router.push(setupTarget);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: setupTarget });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,79,232,0.12),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eff4fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[36px] border border-white/70 bg-white/78 p-2 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <AuthShowcase
          eyebrow={copy.rightEyebrow}
          title={copy.rightTitle}
          description={copy.rightDescription}
          highlights={copy.highlights}
          stats={copy.stats}
        />

        <div className="flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                N
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nexon</p>
                <p className="text-sm font-semibold text-slate-900">AI messaging platform</p>
              </div>
            </Link>

            <p className="section-label">{copy.eyebrow}</p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950">{copy.title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">{copy.subtitle}</p>
            {selectedPlan && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {lang === "mn"
                  ? `Сонгосон багц: ${selectedPlan.nameMn} (${selectedPlan.price.toLocaleString()}₮ / сар)`
                  : `Selected plan: ${selectedPlan.nameEn} (${selectedPlan.price.toLocaleString()}₮ / month)`}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? copy.submitting : copy.google}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <span className="bg-white px-3">{copy.divider}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{copy.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">{copy.password}</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-primary transition-colors hover:text-primary/80">
                    {copy.forgot}
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? copy.submitting : copy.submit}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500">
              {copy.footer}{" "}
              <Link href={selectedPlan ? `/register?plan=${selectedPlan.tier}` : "/register"} className="font-semibold text-slate-900 transition-colors hover:text-primary">
                {copy.register}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
