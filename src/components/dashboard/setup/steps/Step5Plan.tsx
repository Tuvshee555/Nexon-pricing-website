"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { MONTHLY_PLANS, CREDIT_PACKS } from "@/types";

interface Props {
  businessId: string;
  pageName: string;
  instagramConnected: boolean;
  onComplete: () => void;
  onBack: () => void;
}

type PlanTab = "credit" | "monthly";

export default function Step5Plan({
  businessId,
  pageName,
  instagramConnected,
  onComplete,
  onBack,
}: Props) {
  const [tab, setTab] = useState<PlanTab>("credit");
  const [selectedPack, setSelectedPack] = useState(CREDIT_PACKS[1]);
  const [selectedMonthly, setSelectedMonthly] = useState(MONTHLY_PLANS[1]);
  const [payState, setPayState] = useState<"select" | "qr" | "success">("select");
  const [invoice, setInvoice] = useState<{
    invoice_id: string;
    qr_image: string;
    qr_text: string;
    urls: Array<{ name: string; link: string; logo: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handlePay = async () => {
    const amount = tab === "credit" ? selectedPack.amount : selectedMonthly.price;
    const credits = tab === "credit" ? selectedPack.credits : undefined;
    const type = tab === "credit" ? "message_pack" : "subscription";

    if (!amount) {
      // Enterprise plan — contact us
      toast.info("Enterprise төлөвлөгөөний хувьд бидэнтэй холбоо барина уу.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = { businessId, amount, type };
      if (credits) body.credits = credits;

      const res = await fetch("/api/qpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoice үүсгэхэд алдаа гарлаа");

      setInvoice(data);
      setPayState("qr");

      // Poll for payment
      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/qpay/check?invoice_id=${data.invoice_id}`);
          const checkData = await checkRes.json();
          if (checkData.paid) {
            clearInterval(pollRef.current!);
            // Mark onboarding as complete
            await fetch("/api/business/update-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "active" }),
            });
            setPayState("success");
          }
        } catch {
          // Ignore polling errors
        }
      }, 3000);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (payState === "success") {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-success/10 border border-success/30 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Бүгд бэлэн!</h2>
          <p className="text-text-secondary text-sm">
            Таны bot идэвхжлээ. Одоо {pageName || "Facebook хуудас"} дээр хэрэглэгчидтэй яриад үзнэ үү.
          </p>
          {instagramConnected && (
            <p className="text-pink-400 text-sm mt-1">+ Instagram Direct мессеж ч идэвхтэй</p>
          )}
        </div>
        <button
          onClick={onComplete}
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Хяналтын самбар руу орох →
        </button>
      </div>
    );
  }

  if (payState === "qr" && invoice) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">QPay төлбөр</h2>
          <p className="text-text-secondary text-sm">QR код уншуулан төлбөрөө хийнэ үү.</p>
        </div>
        <div className="flex justify-center">
          <img
            src={`data:image/png;base64,${invoice.qr_image}`}
            alt="QPay QR"
            className="w-48 h-48 rounded-xl border border-border"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {invoice.urls?.slice(0, 6).map((url) => (
            <a
              key={url.name}
              href={url.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-secondary hover:border-primary/40 hover:text-text-primary transition-colors"
            >
              {url.logo && (
                <img src={url.logo} alt={url.name} className="w-6 h-6 rounded" />
              )}
              {url.name}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Төлбөр хүлээж байна...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Төлөвлөгөө сонгох</h2>
        <p className="text-text-secondary text-sm">Таны хэрэгцээнд тохирсон төлөвлөгөөг сонгоно уу.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-2 rounded-xl">
        {(["credit", "monthly"] as PlanTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "credit" ? "Мессеж пакет" : "Сарын захиалга"}
          </button>
        ))}
      </div>

      {tab === "credit" && (
        <div className="space-y-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.amount}
              type="button"
              onClick={() => setSelectedPack(pack)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selectedPack.amount === pack.amount
                  ? "bg-primary/10 border-primary/50"
                  : "bg-surface-2 border-border hover:border-primary/30"
              }`}
            >
              <div className="text-left">
                <p className={`font-semibold ${selectedPack.amount === pack.amount ? "text-primary" : "text-text-primary"}`}>
                  {pack.credits} мессеж
                </p>
                {pack.popular && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Алдартай</span>
                )}
              </div>
              <p className="text-lg font-bold text-text-primary">{pack.amount.toLocaleString()}₮</p>
            </button>
          ))}
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-2">
          {MONTHLY_PLANS.filter((p) => p.tier !== "enterprise").map((plan) => (
            <button
              key={plan.tier}
              type="button"
              onClick={() => setSelectedMonthly(plan)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selectedMonthly.tier === plan.tier
                  ? "bg-primary/10 border-primary/50"
                  : "bg-surface-2 border-border hover:border-primary/30"
              }`}
            >
              <div className="text-left">
                <p className={`font-semibold ${selectedMonthly.tier === plan.tier ? "text-primary" : "text-text-primary"}`}>
                  {plan.nameMn}
                </p>
                <p className="text-xs text-muted">{plan.messageLimit.toLocaleString()} мессеж/сар</p>
                {plan.popular && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full mt-1 inline-block">Алдартай</span>
                )}
              </div>
              <p className="text-lg font-bold text-text-primary">{plan.price.toLocaleString()}₮/сар</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Буцах
        </button>
        <button
          onClick={handlePay}
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Боловсруулж байна...
            </>
          ) : (
            <>
              QPay-аар төлөх
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
