"use client";

import Card from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { formatAmount, formatDate } from "@/lib/utils";
import { useTransactions } from "@/providers/TransactionsProvider";
import { DisplayStatus } from "@/types/transaction";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";



const History = () => {
  const { transactions, loading, getTransactionTitle, mapStatus, statusBadge } = useTransactions();
  const [filter, setFilter] = useState<"All" | DisplayStatus>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return transactions;

    return transactions.filter((t) => mapStatus(t.status) === filter);
  }, [filter, transactions, mapStatus]);

  if (loading) {
    return (
      <Modal
        isOpen={true}
        onClose={() => { }}
        title=""
        message="Loading transactions..."
        icon={<Loading size="lg" />}
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

      <div className="flex justify-between items-center">
        {(["All", "Fulfilled", "Pending", "Refunded"] as const).map((s) => {
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              aria-pressed={active}
              className={`cursor-pointer select-none transition-all duration-300 text-sm px-4 py-1.5 rounded-full font-medium ${active
                  ? "bg-gradient-to-br from-[#ffa02d] to-[#ff8c00] text-black shadow-lg hover:shadow-[0_0_20px_rgba(255,160,45,0.5)]"
                  : "backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Text className="text-white/60">No transactions found</Text>
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
