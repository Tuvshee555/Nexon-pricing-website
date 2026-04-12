"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  initialName?: string;
  initialType?: string;
  onNext: (businessId: string) => void;
}

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant / Food", icon: "RS" },
  { value: "ecommerce", label: "Ecommerce / Retail", icon: "EC" },
  { value: "service", label: "Service business", icon: "SV" },
  { value: "healthcare", label: "Healthcare", icon: "HC" },
  { value: "real_estate", label: "Real estate", icon: "RE" },
  { value: "education", label: "Education", icon: "ED" },
  { value: "beauty", label: "Beauty / Salon", icon: "BE" },
  { value: "other", label: "Other", icon: "OT" },
];

export default function Step1Business({ initialName, initialType, onNext }: Props) {
  const [name, setName] = useState(initialName || "");
  const [type, setType] = useState(initialType || "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) {
      toast.error("Please enter your business name");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name.trim(), businessType: type || "other" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      onNext(data.businessId);
    } catch {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-black text-gray-900">Tell us about the business</h1>
        <p className="text-sm text-gray-500">We&apos;ll use this to shape the bot voice and your default setup.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Business name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Example: Nexon Coffee Shop"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700">Business type</p>
        <div className="space-y-2">
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.value}
              type="button"
              onClick={() => setType(bt.value)}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                type === bt.value ? "border-slate-900 bg-slate-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black tracking-[0.18em] text-slate-700">
                {bt.icon}
              </span>
              <span className={`text-sm font-medium ${type === bt.value ? "text-slate-900" : "text-gray-700"}`}>
                {bt.label}
              </span>
              <div
                className={`ml-auto flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                  type === bt.value ? "border-slate-900" : "border-gray-300"
                }`}
              >
                {type === bt.value && <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={loading || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-40"
      >
        {loading ? "Creating..." : "Continue"}
        {!loading && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
