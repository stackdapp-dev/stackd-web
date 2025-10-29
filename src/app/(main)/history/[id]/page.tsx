"use client";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";
import { formatAmount } from "@/lib/utils";
import { ChevronLeft, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

const statusBadge = (status: Status) => (status === "Pending" ? "bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold" : "bg-emerald-500 text-black px-2 py-0.5 rounded-full text-xs font-semibold");

export default function Page({ params }: { params: { id: string } }) {
  const tx = sampleData.find((t) => t.id === params.id);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key);
        window.setTimeout(() => setCopied(null), 1800);
      },
      () => {
        /* ignore */
      }
    );
  };

  if (!tx) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
        <div className="relative flex items-center h-12">
          <Link href="/history" className="p-2 rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold">Order Details</h1>
        </div>
        <div className="p-6 text-sm">Transaction not found.</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title="Order Details" />

      <Card appearance="container" className="rounded-xl overflow-hidden mb-4">
        <div className="relative">
          <div className="flex items-start justify-between">
            <Text weight="semibold">{tx.title}</Text>
            <span className={statusBadge(tx.status)}>{tx.status}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <Text tone="muted">
              Withdraw Amount
            </Text>
            <Text className="text-right">
              {Math.abs(tx.amount)} {tx.currency}
            </Text>

            <Text tone="muted">
              Amount to Receive
            </Text>
            <Text className="text-right">
              {formatAmount(tx.amount * -1 * 58.32)} PHP
            </Text>

            <Text tone="muted">
              Exchange Rate
            </Text>
            <Text className="text-right">
              1 USDT ≈ 58.32 PHP
            </Text>

            <Text tone="muted">
              Order ID
            </Text>
            <div className="flex items-center justify-end gap-2">
              <Text className="text-right">
                OTC-{tx.id}-4732
              </Text>
              <button type="button" aria-label="Copy order id" className="p-1 rounded" onClick={() => handleCopy(`OTC-${tx.id}-4732`, "order")}>
                <Copy className={`h-4 w-4 ${copied === "order" ? "text-amber-400" : "text-neutral-400"}`} />
              </button>
            </div>

            <Text tone="muted">
              Last Updated
            </Text>
            <Text className="text-right">
              {tx.date}
            </Text>
          </div>
        </div>
      </Card>

      <div>
        <Text className="text-amber-400 text-sm">Recipient Details</Text>
        <Card appearance="container" className="rounded-xl overflow-hidden mt-2">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <Text tone="muted">
                Reference #
              </Text>
              <div className="flex items-center gap-2">
                <Text>908092309</Text>
                <button type="button" aria-label="Copy reference" className="p-1 rounded" onClick={() => handleCopy("908092309", "ref")}>
                  <Copy className={`h-4 w-4 ${copied === "ref" ? "text-amber-400" : "text-neutral-400"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <Text tone="muted">
                E-wallet Name
              </Text>
              <Text>Gcash</Text>
            </div>
            <div className="flex justify-between">
              <Text tone="muted">
                Account Name
              </Text>
              <Text>Juan Dela Cruz</Text>
            </div>
            <div className="flex justify-between">
              <Text tone="muted">
                Mobile Number
              </Text>
              <Text>091712345678</Text>
            </div>
            <div className="flex justify-between">
              <Text tone="muted">
                E-mail Address
              </Text>
              <Text>juan@gmail.com</Text>
            </div>
            <div className="flex justify-between">
              <Text tone="muted">
                Alias
              </Text>
              <Text>Work BPI</Text>
            </div>
          </div>
        </Card>
      </div>

      <Button className="w-full">Order Again</Button>
    </div>
  );
}
