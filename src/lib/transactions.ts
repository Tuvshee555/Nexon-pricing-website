import { sql } from "@/lib/db";
export { inferTransactionType, type TransactionKind, type TransactionLike } from "@/lib/transaction-utils";
import type { TransactionKind } from "@/lib/transaction-utils";

interface TransactionInsertData {
  amount: number;
  business_id: string;
  credits_added: number;
  paid_at?: string;
  payment_method: "manual" | "qpay";
  qpay_invoice_id?: string;
  qpay_payment_id?: string;
  status: "cancelled" | "failed" | "paid" | "pending";
  transaction_type?: TransactionKind;
}

export async function insertTransaction(transaction: TransactionInsertData) {
  await sql`
    INSERT INTO transactions (
      business_id, amount, credits_added, payment_method,
      qpay_invoice_id, qpay_payment_id, status, transaction_type, paid_at
    ) VALUES (
      ${transaction.business_id},
      ${transaction.amount},
      ${transaction.credits_added},
      ${transaction.payment_method},
      ${transaction.qpay_invoice_id ?? null},
      ${transaction.qpay_payment_id ?? null},
      ${transaction.status},
      ${transaction.transaction_type ?? null},
      ${transaction.paid_at ?? null}
    )
  `;
  return { error: null };
}
