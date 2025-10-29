"use client";

import Card from "@/components/ui/card";
import Text from "@/components/ui/text";
import { formatAmount } from "@/lib/utils";
import { ChevronRight, Filter, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Status = "Pending" | "Fulfilled";

type Transaction = {
  id: string;
  title: string;
  date: string;
  status: Status;
  amount: number;
  currency?: string;
};

const sampleData: Transaction[] = [
  { id: "1", title: "OTC Withdrawal", date: "2025/10/24 14:14:50", status: "Pending", amount: -100, currency: "USDT" },
  { id: "2", title: "OTC Withdrawal", date: "2025/10/23 11:11:10", status: "Pending", amount: -200, currency: "USDT" },
  { id: "3", title: "OTC Withdrawal", date: "2025/10/21 12:24:20", status: "Fulfilled", amount: -100.5, currency: "USDT" },
  { id: "4", title: "OTC Withdrawal", date: "2025/10/20 14:14:50", status: "Fulfilled", amount: -1100, currency: "USDT" },
];

const statusBadge = (status: Status) => (status === "Pending" ? "bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs" : "bg-emerald-500 text-black px-2 py-0.5 rounded-full text-xs");

const History = () => {
  const [filter, setFilter] = useState<"All" | Status>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return sampleData;

    return sampleData.filter((t) => t.status === filter);
  }, [filter]);

  return (
    <div className="p-6 flex flex-col gap-8">
      <div className="relative flex items-center">
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">History</h1>
        <div className="ml-auto flex items-center gap-3">
          <button aria-label="search" className="rounded-full p-2 hover:bg-white/5">
            <Search className="h-5 w-5" />
          </button>

          <button aria-label="filter" className="rounded-full p-2 hover:bg-white/5">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

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
        {filtered.map((tx) => (
          <Link key={tx.id} href={`/history/${tx.id}`} className="block">
            <Card appearance="container" padding="none" className="rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-4 gap-y-1 w-full">
                <div className="flex flex-col justify-center">
                  <Text weight="semibold" className="leading-tight">
                    {tx.title}
                  </Text>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <span className={tx.status === "Pending" ? statusBadge("Pending") : statusBadge("Fulfilled")}>{tx.status}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>

                <div className="flex items-center">
                  <Text>{tx.date}</Text>
                </div>

                <div className="flex items-center justify-end">
                  <Text className={tx.amount < 0 ? "text-rose-500" : "text-emerald-400"}>
                    {formatAmount(tx.amount)} {tx.currency ?? "USDT"}
                  </Text>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default History;
