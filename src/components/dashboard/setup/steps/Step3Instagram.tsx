"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  businessId: string;
  pageId: string;
  onNext: (instagramConnected: boolean) => void;
  onSkip: () => void;
}

export default function Step3Instagram({ businessId, pageId, onNext, onSkip }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!pageId) {
      toast.error("Facebook page must be connected first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/facebook/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          businessId,
          connectInstagram: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not connect Instagram");
        return;
      }

      if (data.instagramConnected) {
        toast.success("Instagram connected");
        onNext(true);
      } else {
        toast.error("No connected Instagram business account was found for this page.");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-bold text-slate-950">{t("setup_ig_title")}</h2>
        <p className="text-sm text-slate-600">{t("setup_ig_subtitle")}</p>
      </div>

      <div className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-950">Instagram Direct</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("setup_ig_feature1")}
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("setup_ig_feature2")}
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("setup_ig_feature3")}
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        {t("setup_ig_req")}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("setup_ig_connecting")}
            </>
          ) : (
            t("setup_ig_connect")
          )}
        </button>
        <button onClick={onSkip} className="w-full py-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
          {t("setup_skip_now")}
        </button>
      </div>
    </div>
  );
}
