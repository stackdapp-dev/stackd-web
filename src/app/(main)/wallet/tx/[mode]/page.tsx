"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import TransactionOverview from "@/components/wallet/TransactionOverview";
import useTxMode from "@/hooks/useTxMode";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function TxModePage() {
  const params = useParams();
  const modeParam = (params?.mode || "borrow") as string;
  const mode = modeParam === "repay" ? "repay" : "borrow";

  const tx = useTxMode(mode === "repay" ? "repay" : "borrow");
  const { amount, availableForRepay, setAmount, isProcessing, available, handleMax, handleAction, title, btnText, previewAmount } = tx;

  const [ackChecked, setAckChecked] = useState(false);

  const isDisabled = Number(availableForRepay) <= 0 || Number(amount) <= 0 || isProcessing || !ackChecked || Number(amount) > available;

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title={title} backHref="/wallet" />

      <InputAmountCard label="Amount" value={amount} onChangeText={setAmount} tokenSymbol="USDT" usdValue={Number(amount || 0)} availableAmount={availableForRepay} onMaxPress={handleMax} editable={!isProcessing} />

      <TransactionOverview previewAmount={previewAmount} />

      <div className="flex items-center justify-center gap-3">
        <input type="checkbox" id="ack" checked={ackChecked} onChange={() => setAckChecked((v) => !v)} aria-checked={ackChecked} />
        <label htmlFor="ack" className="text-sm text-muted cursor-pointer">
          I acknowledge the risks involved.
        </label>
      </div>

      <div>
        <Button onClick={handleAction} className="w-full" disabled={isDisabled}>
          {isProcessing ? "Processing..." : btnText}
        </Button>
      </div>
    </div>
  );
}
