"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  initialName?: string;
  initialType?: string;
  onNext: (businessId: string) => void;
}

const BUSINESS_TYPES = [
  { value: "ecommerce", label: "Дэлгүүр / E-commerce" },
  { value: "restaurant", label: "Ресторан / Кафе" },
  { value: "service", label: "Үйлчилгээ" },
  { value: "education", label: "Боловсрол" },
  { value: "real_estate", label: "Үл хөдлөх хөрөнгө" },
  { value: "healthcare", label: "Эрүүл мэнд" },
  { value: "other", label: "Бусад" },
];

export default function Step1Business({ initialName, initialType, onNext }: Props) {
  const [name, setName] = useState(initialName || "");
  const [type, setType] = useState(initialType || "other");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) {
      toast.error("Бизнесийн нэр оруулна уу");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name.trim(), businessType: type }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Алдаа гарлаа");
        return;
      }

      onNext(data.businessId);
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Бизнесийн мэдээлэл</h2>
        <p className="text-text-secondary text-sm">Таны бизнесийн үндсэн мэдээллийг оруулна уу.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Бизнесийн нэр <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Жишээ: Nexon Coffee Shop"
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Бизнесийн төрөл
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                onClick={() => setType(bt.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left border transition-all ${
                  type === bt.value
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-surface-2 border-border text-text-secondary hover:border-primary/30 hover:text-text-primary"
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={loading || !name.trim()}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Үүсгэж байна...
          </>
        ) : (
          <>
            Дараагийн алхам
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
