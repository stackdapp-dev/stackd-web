"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import TransactionOverview from "@/components/wallet/TransactionOverview";
import { useAutoLend } from "@/hooks/useAutoLend";
import useTxMode from "@/hooks/useTxMode";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function TxModePage() {
  const params = useParams();
  const modeParam = (params?.mode || "borrow") as string;
  const mode = modeParam === "repay" ? "repay" : "borrow";
  const router = useRouter();

  const tx = useTxMode(mode === "repay" ? "repay" : "borrow");
  const { amount, availableForRepay, setAmount, isProcessing, available, handleMax, handleAction, title, btnText, previewAmount } = tx;

  const [ackChecked, setAckChecked] = useState(false);

  const { assets } = useWalletBalance();
  const wbtcBalance = assets.find((a) => a.symbol === "WBTC")?.amount || 0;

  const { lendProcessing } = useAutoLend({
    mode,
    wbtcBalance,
    onError: () => router.push("/wallet"),
  });

  const isDisabled = Number(availableForRepay) <= 0 || amount <= 0 || isProcessing || lendProcessing || !ackChecked || amount > available;

  if (lendProcessing) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
        <PageHeader title={title} backHref="/wallet" />
        <div className="flex justify-center items-center h-64">
          <Loading size="lg"/>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title={title} backHref="/wallet" />

      <InputAmountCard label="Amount" value={String(amount)} onChangeText={(value) => setAmount(Number(value))} tokenSymbol="USDT" usdValue={amount} availableAmount={availableForRepay} onMaxPress={handleMax} editable={!isProcessing && !lendProcessing} />

      <TransactionOverview previewAmount={previewAmount} />

      <div className="flex items-center justify-center gap-3">
        <input type="checkbox" id="ack" checked={ackChecked} onChange={() => setAckChecked((v) => !v)} aria-checked={ackChecked} />
        <label htmlFor="ack" className="text-sm text-muted cursor-pointer">
          I acknowledge the risks involved.
        </label>
      </div>

      <div>
        <Button onClick={handleAction} className="w-full" disabled={isDisabled}>
          {isProcessing || lendProcessing ? "Processing..." : btnText}
        </Button>
      </div>
    </div>
  );
}
