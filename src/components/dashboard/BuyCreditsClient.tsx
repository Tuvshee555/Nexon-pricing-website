"use client";

import { useState, useEffect, useRef } from "react";
import { CREDIT_PACKS } from "@/types";

interface Props {
  businessId: string;
  businessName: string;
}

type PaymentState = "select" | "qr" | "success" | "error";

export default function BuyCreditsClient({ businessId, businessName }: Props) {
  const [selectedPack, setSelectedPack] = useState<(typeof CREDIT_PACKS)[0] | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("select");
  const [invoice, setInvoice] = useState<{
    invoice_id: string;
    qr_image: string;
    qr_text: string;
    urls: Array<{ name: string; link: string; logo: string }>;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleSelectPack = async (pack: (typeof CREDIT_PACKS)[0]) => {
    setSelectedPack(pack);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/qpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          amount: pack.amount,
          credits: pack.credits,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invoice creation failed");

      setInvoice(data);
      setPaymentState("qr");

      // Poll every 3 seconds
      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(
            `/api/qpay/check?invoice_id=${data.invoice_id}&business_id=${businessId}&credits=${pack.credits}&amount=${pack.amount}`
          );
          const checkData = await checkRes.json();

          if (checkData.paid) {
            stopPolling();
            setPaymentState("success");
          }
        } catch {}
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      setPaymentState("error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopPolling();
    setPaymentState("select");
    setSelectedPack(null);
    setInvoice(null);
    setError("");
  };

  if (paymentState === "success") {
    return (
      <div className="max-w-md mx-auto pt-12 text-center">
        <div className="card p-12">
          <div className="w-20 h-20 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Төлбөр амжилттай!</h2>
          <p className="text-text-secondary mb-2">
            <span className="text-accent font-bold">{selectedPack?.credits}</span> кредит таны дансанд нэмэгдлээ.
          </p>
          <p className="text-sm text-muted">{businessName}</p>
          <button
            onClick={reset}
            className="mt-8 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Буцах
          </button>
        </div>
      </div>
    );
  }

  if (paymentState === "qr" && invoice) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <div className="card p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">QPay QR Код</h2>
            <p className="text-text-secondary text-sm mt-1">
              {selectedPack?.amount.toLocaleString()}₮ → {selectedPack?.credits} кредит
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-6">
            {invoice.qr_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${invoice.qr_image}`}
                alt="QPay QR Code"
                className="w-56 h-56"
              />
            ) : (
              <div className="w-56 h-56 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                QR код ачааллаж байна...
              </div>
            )}
          </div>

          {/* Payment apps */}
          {invoice.urls && invoice.urls.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-muted text-center mb-3">Эсвэл аппаар нээх:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {invoice.urls.map((url) => (
                  <a
                    key={url.name}
                    href={url.link}
                    className="flex items-center gap-1.5 text-xs bg-surface-2 border border-border px-3 py-1.5 rounded-lg hover:border-primary/50 transition-colors text-text-secondary"
                  >
                    {url.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url.logo} alt={url.name} className="w-4 h-4 rounded" />
                    )}
                    {url.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-6">
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            Төлбөр хүлээж байна...
          </div>

          <button
            onClick={reset}
            className="w-full border border-border hover:border-danger/50 text-text-secondary hover:text-danger py-2.5 rounded-lg text-sm transition-colors"
          >
            Цуцлах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Кредит худалдан авах</h1>
        <p className="text-text-secondary mt-1 text-sm">{businessName}</p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CREDIT_PACKS.map((pack) => (
          <button
            key={pack.amount}
            onClick={() => !loading && handleSelectPack(pack)}
            disabled={loading}
            className={`relative card p-6 text-left hover:border-primary/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              pack.popular ? "border-accent" : ""
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent text-background text-xs font-bold px-3 py-1 rounded-full">
                  Алдартай
                </span>
              </div>
            )}

            <div className="text-3xl font-black text-gradient mb-2">
              {pack.amount.toLocaleString()}₮
            </div>
            <div className="text-text-primary font-semibold mb-1">
              {pack.credits.toLocaleString()} кредит
            </div>
            <div className="text-text-secondary text-sm">
              ≈ {Math.round(pack.amount / pack.credits)}₮ / кредит
            </div>
            <div className="mt-4 text-xs text-success flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Хэзээ ч дуусдаггүй
            </div>
          </button>
        ))}
      </div>

      <div className="card p-5 text-sm text-text-secondary">
        <p className="font-semibold text-text-primary mb-2">Хэрхэн ажилладаг вэ?</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Дээрх багцуудаас нэгийг сонгоно</li>
          <li>QPay QR кодыг уншуулна</li>
          <li>Төлбөр баталгаажсаны дараа кредит автоматаар нэмэгдэнэ</li>
        </ol>
      </div>
    </div>
  );
}
