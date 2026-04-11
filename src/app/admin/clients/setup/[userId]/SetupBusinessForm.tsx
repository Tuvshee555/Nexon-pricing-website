"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MONTHLY_PLANS } from "@/types";

interface Props {
  userId: string;
  email: string;
}

export default function SetupBusinessForm({ userId, email }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    platforms: [] as string[],
    planType: "monthly",
    monthlyTier: "basic",
    botPrompt: "",
  });

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  };

  const selectedPlan = MONTHLY_PLANS.find((p) => p.tier === form.monthlyTier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/client-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "setup_business",
            userId,
            businessName: form.businessName,
            platforms: form.platforms,
            planType: form.planType,
            monthlyTier: form.monthlyTier,
            botPrompt: form.botPrompt,
          }),
        });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Алдаа гарлаа");

      router.push(`/admin/clients/${data.businessId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients" className="text-text-secondary hover:text-text-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Бизнес тохируулах</h1>
          <p className="text-text-secondary text-sm mt-0.5">{email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Бизнесийн нэр *</label>
          <input
            type="text"
            required
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Платформ</label>
          <div className="flex gap-3">
            {["instagram", "messenger"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  form.platforms.includes(p)
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Төлөвлөгөөний төрөл</label>
          <select
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value })}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
          >
            <option value="monthly">Сарын захиалга</option>
          </select>
        </div>

        {form.planType === "monthly" && (
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Сарын тариф</label>
            <select
              value={form.monthlyTier}
              onChange={(e) => setForm({ ...form, monthlyTier: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary"
            >
              {MONTHLY_PLANS.filter((p) => p.tier !== "enterprise").map((p) => (
                <option key={p.tier} value={p.tier}>
                  {p.nameMn} — {p.price.toLocaleString()}₮/сар — {p.messageLimit.toLocaleString()} мессеж
                </option>
              ))}
            </select>
            {selectedPlan && selectedPlan.tier !== "enterprise" && (
              <p className="text-xs text-muted mt-1">
                {selectedPlan.price.toLocaleString()}₮/сар, {selectedPlan.messageLimit.toLocaleString()} мессеж
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Бот тохиргоо (system prompt)</label>
          <textarea
            value={form.botPrompt}
            onChange={(e) => setForm({ ...form, botPrompt: e.target.value })}
            rows={4}
            placeholder="Та ... компанийн AI туслагч байна."
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "Тохируулж байна..." : "Бизнес үүсгэх"}
        </button>
      </form>
    </div>
  );
}
