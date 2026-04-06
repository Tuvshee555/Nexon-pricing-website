"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  businessId: string;
  onNext: (instagramConnected: boolean) => void;
  onSkip: () => void;
}

export default function Step3Instagram({ businessId, onNext, onSkip }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facebook/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: "", // Will be taken from cookie via subscribe route logic
          businessId,
          connectInstagram: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Instagram холбоход алдаа гарлаа");
        return;
      }

      if (data.instagramConnected) {
        toast.success("Instagram амжилттай холбогдлоо");
        onNext(true);
      } else {
        toast.error("Instagram бизнес акаунт олдсонгүй. Facebook хуудастай Instagram холбосон байх ёстой.");
      }
    } catch {
      toast.error("Холболтын алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Instagram холбох</h2>
        <p className="text-text-secondary text-sm">
          Instagram бизнес акаунтыг холбосноор Instagram direct мессежүүдэд хариулах болно.
        </p>
      </div>

      <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-text-primary">Instagram Direct мессеж</p>
            <p className="text-xs text-muted">Хэрэглэгчдийн DM-д автоматаар хариулах</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            24/7 автомат хариулт
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Хэрэглэгчийн асуултад шуурхай хариулт
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Facebook Messenger-тэй хамт ажиллана
          </li>
        </ul>
      </div>

      <div className="bg-surface-2 border border-border rounded-xl p-4 text-sm text-muted">
        <strong className="text-text-secondary">Шаардлага:</strong> Instagram бизнес акаунт нь таны холбосон Facebook хуудастай холбоотой байх ёстой.
      </div>

      <div className="space-y-3">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Холбож байна...
            </>
          ) : (
            "Instagram холбох"
          )}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted hover:text-text-secondary py-2 transition-colors"
        >
          Одоохондоо алгасах → (Зөвхөн Facebook Messenger)
        </button>
      </div>
    </div>
  );
}
