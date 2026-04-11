export type TransactionKind = "topup" | "subscription" | "manual";

export interface TransactionLike {
  amount?: number | null;
  credits_added?: number | null;
  payment_method?: string | null;
  transaction_type?: string | null;
}

function isTransactionKind(value: string | null | undefined): value is TransactionKind {
  return (
    value === "topup" ||
    value === "subscription" ||
    value === "manual"
  );
}

export function inferTransactionType(transaction: TransactionLike): TransactionKind {
  if (isTransactionKind(transaction.transaction_type)) {
    return transaction.transaction_type;
  }
  if (transaction.payment_method === "qpay") {
    return "subscription";
  }
  if ((transaction.amount || 0) > 0) {
    return "topup";
  }
  return "manual";
}
