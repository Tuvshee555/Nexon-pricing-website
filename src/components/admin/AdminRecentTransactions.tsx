"use client";

import { useState } from "react";
import { inferTransactionType } from "@/lib/transaction-utils";

const TX_TYPE_LABEL: Record<string, string> = {
  topup: "Үлдэгдэл нэмэх",
  subscription: "Сарын захиалга",
  manual: "Гараар",
};

interface Transaction {
  id: string;
  businesses?: { name: string };
  amount: number;
  credits_added: number;
  transaction_type?: string;
  payment_method: string;
  paid_at: string | null;
}

const PAGE_SIZE = 10;

export default function AdminRecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center text-text-secondary text-sm">
        Одоогоор төлбөр байхгүй байна.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted font-medium px-5 py-3">Бизнес</th>
              <th className="text-left text-muted font-medium px-5 py-3">Төрөл</th>
              <th className="text-right text-muted font-medium px-5 py-3">Дүн</th>
              <th className="text-left text-muted font-medium px-5 py-3">Огноо</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-2/50">
                <td className="px-5 py-3 text-text-primary font-medium">
                  {tx.businesses?.name || "—"}
                </td>
                <td className="px-5 py-3 text-text-secondary text-xs">
                  {TX_TYPE_LABEL[inferTransactionType(tx)] || tx.payment_method}
                </td>
                <td className="px-5 py-3 text-right text-success font-medium">
                  {tx.amount > 0 ? `${tx.amount.toLocaleString()}₮` : "—"}
                </td>
                <td className="px-5 py-3 text-text-secondary text-xs">
                  {tx.paid_at ? new Date(tx.paid_at).toLocaleDateString("mn-MN") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="p-4 border-t border-border text-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Цааш харах ({transactions.length - visibleCount} үлдсэн) →
          </button>
        </div>
      )}
    </>
  );
}
