"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CREDIT_PACKS, MONTHLY_PLANS } from "@/types";
import { expireQPayInvoice, startQPayPolling, type QPayInvoice } from "@/lib/qpay-polling";

interface Props {
  businessId: string;
  pageName: string;
  instagramConnected: boolean;
  onComplete: () => void;
  onBack: () => void;
}

type PlanTab = "credit" | "monthly";
type PayState = "select" | "qr" | "success" | "expired";
type PaymentKind = "message_pack" | "subscription";

interface PaymentPayload {
  amount: number;
  credits?: number;
  type: PaymentKind;
}

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
  const [payState, setPayState] = useState<PayState>("select");
  const [invoice, setInvoice] = useState<QPayInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastPayload, setLastPayload] = useState<PaymentPayload | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);

  const stopPolling = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const startPayment = async (payload: PaymentPayload) => {
    setLoading(true);
    stopPolling();
    setLastPayload(payload);
    try {
      const body: Record<string, unknown> = {
        businessId,
        amount: payload.amount,
        type: payload.type,
      };
      if (payload.credits) body.credits = payload.credits;

      const res = await fetch("/api/qpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoice үүсгэхэд алдаа гарлаа");

      const createdInvoice = data as QPayInvoice;
      setInvoice(createdInvoice);
      setPayState("qr");

      stopPollingRef.current = startQPayPolling({
        invoiceId: createdInvoice.invoice_id,
        onPaid: async () => {
          setPayState("success");
        },
        onExpired: async () => {
          await expireQPayInvoice(createdInvoice.invoice_id);
          setPayState("expired");
          toast.error("Нэхэмжлэхийн хугацаа дууслаа. Дахин оролдоно уу.");
        },
      });
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    const amount = tab === "credit" ? selectedPack.amount : selectedMonthly.price;
    const payload: PaymentPayload =
      tab === "credit"
        ? { amount, credits: selectedPack.credits, type: "message_pack" }
        : { amount, type: "subscription" };

    if (!amount) {
      toast.info("Enterprise төлөвлөгөөний хувьд бидэнтэй холбоо барина уу.");
      return;
    }
    void startPayment(payload);
  };

  const handleManualCheck = async () => {
    if (!invoice) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/qpay/check?invoice_id=${invoice.invoice_id}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.paid) {
        stopPolling();
        setPayState("success");
      } else {
        toast.info("Төлбөр баталгаажаагүй байна. Дахин оролдоно уу.");
      }
    } catch {
      toast.error("Шалгахад алдаа гарлаа.");
    } finally {
      setChecking(false);
    }
  };

  const handleCancelInvoice = async () => {
    stopPolling();
    if (invoice) await expireQPayInvoice(invoice.invoice_id);
    setInvoice(null);
    setPayState("select");
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
            Таны bot идэвхжлээ. Одоо {pageName || "Facebook хуудас"} дээр хэрэглэгчидтэй ярьж үзнэ үү.
          </p>
          {instagramConnected ? (
            <p className="text-pink-400 text-sm mt-1">+ Instagram Direct мессеж мөн идэвхтэй.</p>
          ) : null}
        </div>
        <button
          onClick={onComplete}
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Dashboard руу орох →
        </button>
      </div>
    );
  }

  if (payState === "expired" && lastPayload) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-16 h-16 bg-warning/10 border border-warning/30 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Нэхэмжлэх хүчингүй боллоо</h2>
          <p className="text-sm text-text-secondary">QPay invoice 10 минутын дараа дуусдаг. Шинээр үүсгээд төлнө үү.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Буцах
          </button>
          <button
            onClick={() => void startPayment(lastPayload)}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Дахин invoice үүсгэх
          </button>
        </div>
      </div>
    );
  }

  if (payState === "qr" && invoice) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">QPay төлбөр</h2>
          <p className="text-text-secondary text-sm">QR код уншуулан төлбөрөө хийнэ үү. Хугацаа: 10 минут.</p>
        </div>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${invoice.qr_image}`} alt="QPay QR" className="w-48 h-48 rounded-xl border border-border" />
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
              {url.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url.logo} alt={url.name} className="w-6 h-6 rounded" />
              ) : null}
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
        <button
          onClick={() => void handleManualCheck()}
          disabled={checking}
          className="w-full bg-surface-2 border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {checking ? "Шалгаж байна..." : "Төлбөр шалгах"}
        </button>
        <button
          onClick={() => void handleCancelInvoice()}
          className="w-full border border-border hover:border-danger/40 text-text-secondary hover:text-danger font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          Цуцлах
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Төлөвлөгөө сонгох</h2>
        <p className="text-text-secondary text-sm">Таны хэрэгцээнд тохирсон төлөвлөгөөг сонгоно уу.</p>
      </div>

      <div className="flex gap-2 p-1 bg-surface-2 rounded-xl">
        {(["credit", "monthly"] as PlanTab[]).map((type) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === type ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {type === "credit" ? "Мессеж пакет" : "Сарын захиалга"}
          </button>
        ))}
      </div>

      {tab === "credit" ? (
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
                {pack.popular ? (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Алдартай</span>
                ) : null}
              </div>
              <p className="text-lg font-bold text-text-primary">{pack.amount.toLocaleString()}₮</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {MONTHLY_PLANS.filter((plan) => plan.tier !== "enterprise").map((plan) => (
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
                {plan.popular ? (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full mt-1 inline-block">Алдартай</span>
                ) : null}
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
