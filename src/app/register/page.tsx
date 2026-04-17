"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { useLanguage } from "@/contexts/LanguageContext";
import { MONTHLY_PLANS, MonthlyTier } from "@/types";
import { trackEvent } from "@/lib/analytics";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const [showEmail, setShowEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const requestedTier = searchParams.get("plan") as MonthlyTier | null;
  const requestedBilling = searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const selectedPlan = requestedTier ? MONTHLY_PLANS.find((plan) => plan.tier === requestedTier) : null;
  const setupTarget = selectedPlan ? `/dashboard/setup?plan=${selectedPlan.tier}&billing=${requestedBilling}` : "/dashboard";
  const loginHref = selectedPlan ? `/login?plan=${selectedPlan.tier}` : "/login";

  const copy =
    lang === "mn"
      ? {
          eyebrow: "Бүртгүүлэх",
          title: "Танай AI messaging workspace-ийг хэдхэн алхмаар эхлүүл",
          subtitle: "Сувгаа холбоод, automation flow-уудаа илүү цэгцтэйгээр эхлүүлэх шинэ onboarding experience.",
          rightEyebrow: "Launch clarity",
          rightTitle: "Эхний setup-аасаа эхлээд илүү тодорхой эхэл",
          rightDescription: "Provider-first onboarding, cleaner card hierarchy, өөрийн багт ойлгомжтой dashboard shell.",
          highlights: [
            "Instagram болон Messenger урсгалаа илүү ойлгомжтой бүтэцтэй эхлүүлнэ",
            "AI handoff, FAQ, lead routing-аа нэг дор тохируулна",
            "Шинэ хэрэглэгч ормогц dashboard shell дээрээ шууд ажиллаж эхэлнэ",
          ],
          stats: [
            { label: "Minutes", value: "5" },
            { label: "Channels", value: "2" },
            { label: "Setup", value: "Guided" },
          ],
          google: "Google-ээр үргэлжлүүлэх",
          emailOption: "И-мэйлээр үргэлжлүүлэх",
          divider: "эсвэл",
          back: "Буцах",
          name: "Нэр",
          email: "И-мэйл",
          password: "Нууц үг",
          submit: "Бүртгэл үүсгэх",
          submitting: "Үүсгэж байна...",
          footer: "Бүртгэлтэй юу?",
          login: "Нэвтрэх",
          shortPassword: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.",
          emailExists: "Энэ и-мэйл бүртгэлтэй байна.",
          genericError: "Бүртгэл амжилтгүй боллоо.",
        }
      : {
          eyebrow: "Create account",
          title: "Launch your AI messaging workspace in a few clean steps",
          subtitle: "A calmer onboarding flow for connecting channels and shaping your automation system.",
          rightEyebrow: "Launch clarity",
          rightTitle: "Start with more structure from the first setup",
          rightDescription: "Provider-first onboarding, cleaner card hierarchy, and a dashboard shell your team can read quickly.",
          highlights: [
            "Connect Instagram and Messenger with a clearer starting structure",
            "Set up AI handoff, FAQ logic, and lead routing in one place",
            "Land in a cleaner dashboard shell right after signup",
          ],
          stats: [
            { label: "Minutes", value: "5" },
            { label: "Channels", value: "2" },
            { label: "Setup", value: "Guided" },
          ],
          google: "Continue with Google",
          emailOption: "Continue with email",
          divider: "or",
          back: "Back",
          name: "Name",
          email: "Email",
          password: "Password",
          submit: "Create account",
          submitting: "Creating account...",
          footer: "Already have an account?",
          login: "Sign in",
          shortPassword: "Password must be at least 6 characters.",
          emailExists: "This email is already registered.",
          genericError: "We could not create your account.",
        };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(copy.shortPassword);
      return;
    }

    setLoading(true);
    trackEvent("register_submit_started", { source: "register_page", selectedPlan: selectedPlan?.tier || null });
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error === "Email already registered" ? copy.emailExists : data.error || copy.genericError);
      trackEvent("register_submit_failed", { reason: data.error || "unknown", selectedPlan: selectedPlan?.tier || null });
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      trackEvent("register_signin_failed", { selectedPlan: selectedPlan?.tier || null });
      router.push(loginHref);
      return;
    }

    trackEvent("register_submit_succeeded", { selectedPlan: selectedPlan?.tier || null });
    router.push(setupTarget);
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    trackEvent("register_google_started", { selectedPlan: selectedPlan?.tier || null });
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
              <div className="mt-5 space-y-2">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  {lang === "mn"
                    ? `Сонгосон багц: ${selectedPlan.nameMn} — ${
                        requestedBilling === "annual"
                          ? `${selectedPlan.annualPrice.toLocaleString()}₮/сар (жилийн)`
                          : `${selectedPlan.price.toLocaleString()}₮/сар`
                      }`
                    : `Selected plan: ${selectedPlan.nameEn} — ${
                        requestedBilling === "annual"
                          ? `${selectedPlan.annualPrice.toLocaleString()}₮/mo (billed annually)`
                          : `${selectedPlan.price.toLocaleString()}₮/month`
                      }`}
                </div>
                {selectedPlan.tier !== "free" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {lang === "mn"
                      ? "14 хоногийн үнэгүй туршилт — картын мэдээлэл шаардахгүй."
                      : "14-day free trial included — no card required to start."}
                  </div>
                )}
              </div>
            )}

            {!showEmail ? (
              <div className="mt-8">
                <button
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

                <button
                  onClick={() => setShowEmail(true)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {copy.emailOption}
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <button
                  onClick={() => setShowEmail(false)}
                  className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {copy.back}
                </button>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{copy.name}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                      placeholder={copy.name}
                    />
                  </div>

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
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{copy.password}</label>
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
              </div>
            )}

            <p className="mt-6 text-sm text-slate-500">
              {copy.footer}{" "}
              <Link href={loginHref} className="font-semibold text-slate-900 transition-colors hover:text-primary">
                {copy.login}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
