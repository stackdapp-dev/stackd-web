"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import { Button } from "@/components/ui/button";
import TransactionOverview from "@/components/wallet/TransactionOverview";
import useTxMode from "@/hooks/useTxMode";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function TxModePage() {
  const router = useRouter();
  const params = useParams();
  const modeParam = (params?.mode || "borrow") as string;
  const mode = modeParam === "repay" ? "repay" : "borrow"; 

  const tx = useTxMode(mode === "repay" ? "repay" : "borrow");
  const { amount, setAmount, isProcessing, available, handleMax, handleAction, title, btnText, warning, txItems } = tx;

  const [ackChecked, setAckChecked] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-white mb-4">←</button>
        <h2 className="text-center text-xl font-bold">{title}</h2>
      </div>

      <InputAmountCard
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        tokenSymbol="USDT"
        usdValue={Number(amount || 0)}
        availableAmount={available}
        onMaxPress={handleMax}
        editable={!isProcessing}
      />

      <TransactionOverview txItems={txItems} />

      <div className="mb-4 p-3 rounded bg-red-800 text-white">{warning}</div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <input
          type="checkbox"
          id="ack"
          checked={ackChecked}
          onChange={() => setAckChecked((v) => !v)}
          aria-checked={ackChecked}
        />
        <label htmlFor="ack" className="text-sm text-muted cursor-pointer">
          I acknowledge the risks involved.
        </label>
      </div>

      <div>
        <Button onClick={handleAction} className="w-full" disabled={Number(available) <= 0 || Number(amount) <= 0 || isProcessing || !ackChecked}>
          {isProcessing ? "Processing..." : btnText}
        </Button>
      </div>
    </div>
  );
}
