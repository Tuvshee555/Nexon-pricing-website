"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CREDIT_PACKS } from "@/types";
import { expireQPayInvoice, startQPayPolling, type QPayInvoice } from "@/lib/qpay-polling";

interface Props {
  businessId: string;
  businessName: string;
  planType: string;
  virtualBalance: number;
  subscriptionPrice: number;
}

type PaymentState = "select" | "qr" | "success" | "error" | "expired";
type PaymentTab = "balance" | "messages";
type InvoiceType = "topup" | "message_pack";

interface InvoicePayload {
  amount: number;
  credits?: number;
  type: InvoiceType;
}

const TOPUP_PRESETS = [100000, 200000, 300000, 500000];

export default function BuyCreditsClient({
  businessId,
  businessName,
  planType,
  virtualBalance,
  subscriptionPrice,
}: Props) {
  const isMonthly = planType === "monthly";

  const [tab, setTab] = useState<PaymentTab>(isMonthly ? "balance" : "messages");
  const [selectedTopup, setSelectedTopup] = useState<number | null>(null);
  const [customTopup, setCustomTopup] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("select");
  const [invoice, setInvoice] = useState<QPayInvoice | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successAmount, setSuccessAmount] = useState<InvoicePayload | null>(null);
  const [lastInvoicePayload, setLastInvoicePayload] = useState<InvoicePayload | null>(null);
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

  const startInvoice = async (payload: InvoicePayload) => {
    setLoading(true);
    setError("");
    stopPolling();

    try {
      setLastInvoicePayload(payload);
      const body: Record<string, unknown> = {
        businessId,
        amount: payload.amount,
        type: payload.type,
      };
      if (payload.type === "message_pack" && payload.credits) {
        body.credits = payload.credits;
      }

      const response = await fetch("/api/qpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invoice creation failed");
      }

      const createdInvoice = data as QPayInvoice;
      setInvoice(createdInvoice);
      setSuccessAmount(payload);
      setPaymentState("qr");

      stopPollingRef.current = startQPayPolling({
        invoiceId: createdInvoice.invoice_id,
        onPaid: async () => {
          setPaymentState("success");
          toast.success("Төлбөр амжилттай!");
        },
        onExpired: async () => {
          await expireQPayInvoice(createdInvoice.invoice_id);
          setPaymentState("expired");
          toast.error("Нэхэмжлэхийн хугацаа дууслаа. Дахин оролдоно уу.");
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Алдаа гарлаа";
      setError(message);
      setPaymentState("error");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPack = (pack: (typeof CREDIT_PACKS)[0]) => {
    if (loading) return;
    void startInvoice({ amount: pack.amount, credits: pack.credits, type: "message_pack" });
  };

  const handleTopup = () => {
    const amount = selectedTopup || parseInt(customTopup, 10);
    if (!amount || amount < 10000) {
      setError("Доод дүн нь 10,000₮ байна.");
      return;
    }
    void startInvoice({ amount, type: "topup" });
  };

  const reset = async (options?: { expireCurrent?: boolean }) => {
    const currentInvoiceId = invoice?.invoice_id;
    stopPolling();
    if (options?.expireCurrent && currentInvoiceId) {
      await expireQPayInvoice(currentInvoiceId);
    }
    setPaymentState("select");
    setSelectedTopup(null);
    setCustomTopup("");
    setInvoice(null);
    setError("");
  };

  if (paymentState === "success") {
    return (
      <div className="max-w-md mx-auto pt-10 text-center">
        <div className="card p-8">
          <div className="w-20 h-20 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-2">Төлбөр амжилттай!</h2>
          {successAmount?.type === "topup" ? (
            <p className="text-text-secondary mb-1">
              <span className="text-accent font-bold">{successAmount.amount.toLocaleString()}₮</span> үлдэгдэлд нэмэгдлээ.
            </p>
          ) : (
            <p className="text-text-secondary mb-1">
              <span className="text-accent font-bold">{successAmount?.credits}</span> мессеж таны дансанд нэмэгдлээ.
            </p>
          )}
          <p className="text-sm text-muted">{businessName}</p>

          <div className="mt-6 space-y-2">
            <Link
              href="/dashboard"
              className="w-full inline-flex justify-center bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Dashboard руу очих
            </Link>
            <button
              onClick={() => void reset()}
              className="w-full border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold py-3 rounded-xl transition-colors"
            >
              Дахин төлбөр хийх
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentState === "expired" && invoice && lastInvoicePayload) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Нэхэмжлэхийн хугацаа дууслаа</h2>
          <p className="text-sm text-text-secondary mb-6">QPay invoice 10 минутын дараа хүчингүй болдог. Дахин үүсгээд төлнө үү.</p>

          <div className="space-y-2">
            <button
              onClick={() => void startInvoice(lastInvoicePayload)}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Дахин invoice үүсгэх
            </button>
            <button
              onClick={() => void reset()}
              className="w-full border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary font-semibold py-3 rounded-xl transition-colors"
            >
              Буцах
            </button>
          </div>
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
              {successAmount?.type === "topup"
                ? `${successAmount.amount.toLocaleString()}₮ үлдэгдэл нэмэх`
                : `${successAmount?.amount.toLocaleString()}₮ → ${successAmount?.credits} мессеж`}
            </p>
            <p className="text-xs text-muted mt-1">Хугацаа: 10 минут</p>
          </div>

          <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-6">
            {invoice.qr_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${invoice.qr_image}`} alt="QPay QR Code" className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                QR код ачааллаж байна...
              </div>
            )}
          </div>

          {invoice.urls?.length ? (
            <div className="mb-6">
              <p className="text-xs text-muted text-center mb-3">Эсвэл апп-аар нээх:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {invoice.urls.map((url) => (
                  <a
                    key={url.name}
                    href={url.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-surface-2 border border-border px-3 py-1.5 rounded-lg hover:border-primary/50 transition-colors text-text-secondary"
                  >
                    {url.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url.logo} alt={url.name} className="w-4 h-4 rounded" />
                    ) : null}
                    {url.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-6">
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            Төлбөр хүлээж байна...
          </div>

          <button
            onClick={() => void reset({ expireCurrent: true })}
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
        <h1 className="text-2xl font-bold text-text-primary">Төлбөр нэмэх</h1>
        <p className="text-text-secondary mt-1 text-sm">{businessName}</p>
      </div>

      {error ? (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl p-4 text-sm">{error}</div>
      ) : null}

      {isMonthly ? (
        <div className="inline-flex bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setTab("balance")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "balance" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Үлдэгдэл нэмэх
          </button>
          <button
            onClick={() => setTab("messages")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "messages" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Мессеж пакет
          </button>
        </div>
      ) : null}

      {tab === "balance" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-text-secondary text-xs mb-1">Одоогийн үлдэгдэл</p>
              <p className="text-2xl font-black text-gradient">{virtualBalance.toLocaleString()}₮</p>
            </div>
            <div className="card p-4">
              <p className="text-text-secondary text-xs mb-1">Сарын захиалга</p>
              <p className="text-2xl font-black text-text-primary">{subscriptionPrice.toLocaleString()}₮</p>
            </div>
          </div>

          <p className="text-text-secondary text-sm">Нэмэх дүнгээ сонгоно уу:</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOPUP_PRESETS.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedTopup(amount);
                  setCustomTopup("");
                }}
                disabled={loading}
                className={`card p-4 text-center hover:border-primary/50 transition-all disabled:opacity-50 ${
                  selectedTopup === amount ? "border-primary bg-primary/5" : ""
                }`}
              >
                <p className="text-xl font-black text-gradient">{(amount / 1000).toFixed(0)}K₮</p>
                <p className="text-xs text-text-secondary mt-1">{amount.toLocaleString()}₮</p>
              </button>
            ))}
          </div>

          <input
            type="number"
            value={customTopup}
            onChange={(e) => {
              setCustomTopup(e.target.value);
              setSelectedTopup(null);
            }}
            placeholder="Өөр дүн (₮)"
            min={10000}
            step={1000}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary placeholder-muted focus:outline-none focus:border-primary"
          />

          <button
            onClick={handleTopup}
            disabled={loading || (!selectedTopup && !customTopup)}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Үүсгэж байна...
              </>
            ) : (
              `${(selectedTopup || parseInt(customTopup, 10) || 0).toLocaleString()}₮ нэмэх`
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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
                {pack.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-background text-xs font-bold px-3 py-1 rounded-full">Алдартай</span>
                  </div>
                ) : null}
                <div className="text-3xl font-black text-gradient mb-2">{pack.amount.toLocaleString()}₮</div>
                <div className="text-text-primary font-semibold mb-1">{pack.credits.toLocaleString()} мессеж</div>
                <div className="text-text-secondary text-sm">≈ {Math.round(pack.amount / pack.credits)}₮ / мессеж</div>
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
              <li>Дээрх мессеж пакетуудын аль нэгийг сонгоно.</li>
              <li>QPay QR код уншуулж төлбөрөө хийнэ.</li>
              <li>Баталгаажмагц мессеж автоматаар дансанд нэмэгдэнэ.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
