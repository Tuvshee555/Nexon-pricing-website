"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { MONTHLY_PLANS, MonthlyTier } from "@/types";
import { expireQPayInvoice, startQPayPolling, type QPayInvoice } from "@/lib/qpay-polling";
import { trackEvent } from "@/lib/analytics";

interface Props {
  businessId: string;
  pageName: string;
  instagramConnected: boolean;
  initialMonthlyTier?: string;
  onComplete: () => void;
  onBack: () => void;
}

type PayState = "select" | "qr" | "success" | "expired";

interface PaymentPayload {
  amount: number;
  monthlyTier: string;
}

export default function Step5Plan({
  businessId,
  pageName,
  instagramConnected,
  initialMonthlyTier,
  onComplete,
  onBack,
}: Props) {
  const defaultMonthly =
    MONTHLY_PLANS.find((plan) => plan.tier === (initialMonthlyTier as MonthlyTier)) || MONTHLY_PLANS[1];
  const [selectedMonthly, setSelectedMonthly] = useState(defaultMonthly);
  const [payState, setPayState] = useState<PayState>("select");
  const [invoice, setInvoice] = useState<QPayInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastPayload, setLastPayload] = useState<PaymentPayload | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const selectedPlanName = selectedMonthly.nameEn;
  const firstChargeAmount = selectedMonthly.price.toLocaleString();

  const stopPolling = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const startPayment = async (payload: PaymentPayload) => {
    setLoading(true);
    stopPolling();
    setLastPayload(payload);
    try {
      const res = await fetch("/api/qpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          amount: payload.amount,
          monthlyTier: payload.monthlyTier,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create invoice");

      const createdInvoice = data as QPayInvoice;
      setInvoice(createdInvoice);
      setPayState("qr");
      trackEvent("qpay_invoice_created", {
        monthlyTier: payload.monthlyTier,
        amount: payload.amount,
      });

      stopPollingRef.current = startQPayPolling({
        invoiceId: createdInvoice.invoice_id,
        onPaid: async () => {
          setPayState("success");
          trackEvent("qpay_paid", {
            monthlyTier: payload.monthlyTier,
            amount: payload.amount,
          });
        },
        onExpired: async () => {
          await expireQPayInvoice(createdInvoice.invoice_id);
          setPayState("expired");
          trackEvent("qpay_invoice_expired", { monthlyTier: payload.monthlyTier });
          toast.error("The invoice expired. Please create a new one.");
        },
      });
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    const amount = selectedMonthly.price;
    if (!amount) {
      toast.info("Enterprise pricing is handled manually by our team.");
      return;
    }
    void startPayment({ amount, monthlyTier: selectedMonthly.tier });
  };

  const handleManualCheck = async () => {
    if (!invoice) return;
    trackEvent("qpay_manual_check", { monthlyTier: selectedMonthly.tier });
    setChecking(true);
    try {
      const res = await fetch(`/api/qpay/check?invoice_id=${invoice.invoice_id}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.paid) {
        stopPolling();
        setPayState("success");
        trackEvent("qpay_paid", {
          monthlyTier: selectedMonthly.tier,
          amount: selectedMonthly.price,
        });
      } else {
        toast.info("We still haven't seen the payment yet. Try again in a moment.");
      }
    } catch {
      toast.error("Unable to check payment status.");
    } finally {
      setChecking(false);
    }
  };

  const handleCancelInvoice = async () => {
    stopPolling();
    if (invoice) await expireQPayInvoice(invoice.invoice_id);
    setInvoice(null);
    setPayState("select");
    trackEvent("qpay_invoice_cancelled", { monthlyTier: selectedMonthly.tier });
  };

  if (payState === "success") {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-bold text-slate-950">You&apos;re all set</h2>
          <p className="text-sm text-slate-600">
            The bot is now active on {pageName || "your Facebook page"}.
            {instagramConnected ? " Instagram Direct is also connected." : ""}
          </p>
        </div>
        <button
          onClick={onComplete}
          className="rounded-xl bg-slate-900 px-8 py-3 text-white font-semibold transition-colors hover:bg-slate-800"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  if (payState === "expired" && lastPayload) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300 bg-amber-50">
          <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-slate-950">Invoice expired</h2>
          <p className="text-sm text-slate-600">QPay invoices expire after 10 minutes. Create a new one to continue.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
          >
            Back
          </button>
          <button
            onClick={() => void startPayment(lastPayload)}
            disabled={loading}
            className="flex-1 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            Create new invoice
          </button>
        </div>
      </div>
    );
  }

  if (payState === "qr" && invoice) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 text-xl font-bold text-slate-950">Pay with QPay</h2>
          <p className="text-sm text-slate-600">Scan the QR code to complete payment. The invoice expires after 10 minutes.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Order summary</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Plan</span>
              <span className="font-semibold text-slate-900">{selectedPlanName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Monthly limit</span>
              <span className="font-semibold text-slate-900">{selectedMonthly.messageLimit.toLocaleString()} messages</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Charge now</span>
              <span className="font-semibold text-slate-900">{firstChargeAmount} ₮</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Next billing date</span>
              <span className="font-semibold text-slate-900">{nextBillingDate.toLocaleDateString("en-US")}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            This payment activates your monthly subscription. Setup fee, when applicable, is handled separately by the team.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <QRCode value={invoice.qr_text} size={192} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {invoice.urls?.slice(0, 6).map((url) => (
            <a
              key={url.name}
              href={url.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              {url.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url.logo} alt={url.name} className="h-6 w-6 rounded" />
              ) : null}
              {url.name}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Waiting for payment...
        </div>
        <p className="text-xs text-slate-500">Need help? Contact support and share the invoice ID from this screen.</p>
        <button
          onClick={() => void handleManualCheck()}
          disabled={checking}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
        >
          {checking ? "Checking..." : "Check payment"}
        </button>
        <button
          onClick={() => void handleCancelInvoice()}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 transition-colors hover:border-red-300 hover:text-red-500"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-bold text-slate-950">Choose a plan</h2>
        <p className="text-sm text-slate-600">Pick the monthly tier that matches your volume.</p>
      </div>

      <div className="space-y-2">
        {MONTHLY_PLANS.filter((plan) => plan.tier !== "enterprise").map((plan) => (
          <button
            key={plan.tier}
            type="button"
            onClick={() => {
              setSelectedMonthly(plan);
              trackEvent("setup_plan_selected", { monthlyTier: plan.tier, amount: plan.price });
            }}
            className={`flex w-full items-center justify-between rounded-xl border p-4 transition-all ${
              selectedMonthly.tier === plan.tier
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="text-left">
              <p className={`font-semibold ${selectedMonthly.tier === plan.tier ? "text-slate-900" : "text-slate-950"}`}>
                {plan.nameMn}
              </p>
              <p className="text-xs text-slate-500">{plan.messageLimit.toLocaleString()} messages / month</p>
              {plan.popular ? (
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  Popular
                </span>
              ) : null}
            </div>
            <p className="text-lg font-bold text-slate-950">{plan.price.toLocaleString()} MNT/month</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Before you pay</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
            <span>
              You selected <strong>{selectedPlanName}</strong> at <strong>{firstChargeAmount} ₮/month</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
            <span>Your monthly usage limit is {selectedMonthly.messageLimit.toLocaleString()} messages.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
            <span>The next billing date after this payment will be {nextBillingDate.toLocaleDateString("en-US")}.</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
        >
          Back
        </button>
        <button
          onClick={handlePay}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              Pay with QPay
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
