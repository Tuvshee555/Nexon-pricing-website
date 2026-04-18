function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

interface QPayToken {
  access_token: string;
  expires_in: number;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const BASE_URL = requireEnv("QPAY_BASE_URL");
  const USERNAME = requireEnv("QPAY_USERNAME");
  const PASSWORD = requireEnv("QPAY_PASSWORD");

  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`,
    },
  });

  if (!res.ok) {
    throw new Error(`QPay auth failed: ${res.status}`);
  }

  const data: QPayToken = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export interface QPayInvoice {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  urls: Array<{ name: string; description: string; logo: string; link: string }>;
}

export async function createInvoice(params: {
  amount: number;
  description: string;
  callbackUrl: string;
  senderInvoiceNo: string;
}): Promise<QPayInvoice> {
  const token = await getToken();

  const BASE_URL = requireEnv("QPAY_BASE_URL");
  const res = await fetch(`${BASE_URL}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice_code: requireEnv("QPAY_INVOICE_CODE"),
      sender_invoice_no: params.senderInvoiceNo,
      invoice_receiver_code: "terminal",
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QPay create invoice failed: ${res.status} ${err}`);
  }

  return res.json();
}

export interface QPayPaymentCheck {
  count: number;
  paid_amount: number;
  rows: Array<{
    payment_id: string;
    payment_status: string;
    payment_date: string;
    payment_amount: number;
  }>;
}

export async function checkPayment(invoiceId: string): Promise<QPayPaymentCheck> {
  const token = await getToken();
  const BASE_URL = requireEnv("QPAY_BASE_URL");

  const res = await fetch(`${BASE_URL}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ object_type: "INVOICE", object_id: invoiceId }),
  });

  if (!res.ok) {
    throw new Error(`QPay check payment failed: ${res.status}`);
  }

  return res.json();
}
