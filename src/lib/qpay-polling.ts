export type { QPayInvoice } from "@/lib/qpay";

export const QPAY_POLL_INTERVAL_MS = 3000;
export const QPAY_POLL_TIMEOUT_MS = 10 * 60 * 1000;

interface QPayPollingOptions {
  invoiceId: string;
  onPaid: () => void | Promise<void>;
  onExpired: () => void | Promise<void>;
  onCheckError?: (error: unknown) => void;
}

export function startQPayPolling(options: QPayPollingOptions): () => void {
  const startedAt = Date.now();
  let stopped = false;
  let inFlight = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(intervalId);
  };

  const tick = async () => {
    if (stopped) return;
    // Timeout check must come before inFlight guard so a hung request
    // can't block the expiry callback indefinitely.
    if (Date.now() - startedAt >= QPAY_POLL_TIMEOUT_MS) {
      stop();
      await options.onExpired();
      return;
    }
    if (inFlight) return;

    inFlight = true;
    try {
      const response = await fetch(`/api/qpay/check?invoice_id=${options.invoiceId}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (data?.paid) {
        stop();
        await options.onPaid();
      }
    } catch (error) {
      options.onCheckError?.(error);
    } finally {
      inFlight = false;
    }
  };

  const intervalId = window.setInterval(() => {
    void tick();
  }, QPAY_POLL_INTERVAL_MS);

  void tick();
  return stop;
}

export async function expireQPayInvoice(invoiceId: string): Promise<void> {
  try {
    await fetch("/api/qpay/expire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
  } catch {
    // Best-effort cleanup — do not surface errors to the caller.
  }
}
