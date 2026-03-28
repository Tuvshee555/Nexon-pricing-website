import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type TransactionKind = "topup" | "subscription" | "message_pack" | "manual";

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

interface TransactionLike {
  amount?: number | null;
  credits_added?: number | null;
  payment_method?: string | null;
  transaction_type?: string | null;
}

export async function insertTransaction(
  supabase: SupabaseClient,
  transaction: TransactionInsertData
) {
  const { error } = await supabase.from("transactions").insert(transaction);

  if (!error || !transaction.transaction_type || !isMissingTransactionTypeColumnError(error)) {
    return { error };
  }

  const legacyTransaction = { ...transaction };
  delete legacyTransaction.transaction_type;
  return supabase.from("transactions").insert(legacyTransaction);
}

export function inferTransactionType(transaction: TransactionLike): TransactionKind {
  if (isTransactionKind(transaction.transaction_type)) {
    return transaction.transaction_type;
  }

  if (transaction.payment_method === "qpay") {
    return (transaction.credits_added || 0) > 0 ? "message_pack" : "topup";
  }

  if ((transaction.amount || 0) > 0) {
    return "topup";
  }

  return "manual";
}

function isMissingTransactionTypeColumnError(error: PostgrestError) {
  return error.code === "PGRST204" && error.message.includes("transaction_type");
}

function isTransactionKind(value: string | null | undefined): value is TransactionKind {
  return (
    value === "topup" ||
    value === "subscription" ||
    value === "message_pack" ||
    value === "manual"
  );
}
