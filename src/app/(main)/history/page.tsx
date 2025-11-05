"use client";

import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { formatAmount, formatDate } from "@/lib/utils";
import { useTransactions } from "@/providers/TransactionsProvider";
import { DisplayStatus, Status, TransactionType } from "@/types/transaction";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";

const getTransactionTitle = (type: TransactionType): string => {
  switch (type) {
    case "otc_withdrawal":
      return "OTC Withdrawal";
    case "otc_refund":
      return "OTC Refund";
    case "deposit":
      return "Deposit";
    case "transfer":
      return "Transfer";
    default:
      return "Transaction";
  }
};

const mapStatus = (status: Status): DisplayStatus => {
  switch (status) {
    case "pending":
      return "Pending";
    case "completed":
      return "Fulfilled";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
};

const statusBadge = (status: DisplayStatus) => {
  switch (status) {
    case "Pending":
      return "bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs";
    case "Fulfilled":
      return "bg-emerald-500 text-black px-2 py-0.5 rounded-full text-xs";
    case "Failed":
      return "bg-rose-500 text-black px-2 py-0.5 rounded-full text-xs";
  }
};



const History = () => {
  const { transactions, loading } = useTransactions();
  const [filter, setFilter] = useState<"All" | DisplayStatus>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return transactions;

    return transactions.filter((t) => mapStatus(t.status) === filter);
  }, [filter, transactions]);

  if (loading) {
    return (
      <Modal
        isOpen={true}
        onClose={() => {}}
        title=""
        message="Loading transactions..."
        showCloseButton={false}
        showActionButtons={false}
      />
    );
  }

  return (
    <div className="p-6 flex flex-col gap-8">
      {/* <div className="relative flex items-center">
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">History</h1>
        <div className="ml-auto flex items-center gap-3">
          <button aria-label="search" className="rounded-full p-2 hover:bg-white/5">
            <Search className="h-5 w-5" />
          </button>

          <button aria-label="filter" className="rounded-full p-2 hover:bg-white/5">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div> */}
      <h1 className="text-center text-2xl font-bold">History</h1>

      <div className="flex gap-2 justify-start items-center">
        {(["All", "Fulfilled", "Pending"] as const).map((s) => {
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              aria-pressed={active}
              className={`cursor-pointer select-none transition-all text-sm ${active ? "bg-amber-500 text-black px-4 py-0.5 rounded-full font-semibold" : "bg-transparent border border-amber-500 text-amber-500 px-4 py-0.5 rounded-full font-medium"}`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Text tone="muted">No transactions found</Text>
          </div>
        ) : (
          filtered.map((tx) => {
            const displayStatus = mapStatus(tx.status);
            const amount = parseFloat(formatUnits(BigInt(tx.amount), 6));
            const isNegative = tx.type === "otc_withdrawal" || tx.type === "transfer";

            return (
              <Link key={tx.id} href={`/history/${tx.id}`} className="block">
                <Card appearance="container" padding="none" className="rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-4 gap-y-1 w-full">
                    <div className="flex flex-col justify-center">
                      <Text weight="semibold" className="leading-tight">
                        {getTransactionTitle(tx.type)}
                      </Text>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <span className={statusBadge(displayStatus)}>{displayStatus}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>

                    <div className="flex items-center">
                      <Text>{formatDate(tx.date)}</Text>
                    </div>

                    <div className="flex items-center justify-end">
                      <Text className={isNegative ? "text-rose-500" : "text-emerald-400"}>
                        {isNegative ? "-" : "+"}{formatAmount(amount)} USDT
                      </Text>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default History;
