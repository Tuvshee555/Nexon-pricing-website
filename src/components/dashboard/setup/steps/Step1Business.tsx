"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  initialName?: string;
  initialType?: string;
  onNext: (businessId: string) => void;
}

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Ресторан / Хоол", icon: "🍽️" },
  { value: "ecommerce", label: "Дэлгүүр / E-commerce", icon: "🛍️" },
  { value: "service", label: "Мэргэжлийн үйлчилгээ", icon: "💼" },
  { value: "healthcare", label: "Эрүүл мэнд", icon: "🏥" },
  { value: "real_estate", label: "Үл хөдлөх хөрөнгө", icon: "🏠" },
  { value: "education", label: "Боловсрол", icon: "🎓" },
  { value: "beauty", label: "Гоо сайхан / Салон", icon: "💅" },
  { value: "other", label: "Бусад", icon: "⚡" },
];

export default function Step1Business({ initialName, initialType, onNext }: Props) {
  const [name, setName] = useState(initialName || "");
  const [type, setType] = useState(initialType || "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) { toast.error("Бизнесийн нэр оруулна уу"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name.trim(), businessType: type || "other" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Алдаа гарлаа"); return; }
      onNext(data.businessId);
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Бизнесийнхээ мэдээлэл</h1>
        <p className="text-gray-500 text-sm">Bot тань энэ мэдээллийг ашиглан хэрэглэгчидтэй зөв харилцана.</p>
      </div>

      {/* Business name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Бизнесийн нэр <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Жишээ: Nexon Coffee Shop"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>

      {/* Business type */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Бизнесийн ангилал</p>
        <div className="space-y-2">
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.value}
              type="button"
              onClick={() => setType(bt.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                type === bt.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-xl">{bt.icon}</span>
              <span className={`text-sm font-medium ${type === bt.value ? "text-primary" : "text-gray-700"}`}>
                {bt.label}
              </span>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                type === bt.value ? "border-primary" : "border-gray-300"
              }`}>
                {type === bt.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={loading || !name.trim()}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
      >
        {loading ? "Үүсгэж байна..." : "Дараагийн алхам"}
        {!loading && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
