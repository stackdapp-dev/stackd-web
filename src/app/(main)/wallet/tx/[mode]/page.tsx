"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import TransactionOverview from "@/components/wallet/TransactionOverview";
import useTxMode from "@/hooks/useTxMode";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TxModePage() {
  const params = useParams();
  const modeParam = (params?.mode || "borrow") as string;
  const mode = modeParam === "repay" ? "repay" : "borrow";

  const tx = useTxMode(mode === "repay" ? "repay" : "borrow");
  const { amount, availableForRepay, setAmount, isProcessing, available, handleMax, handleAction, title, btnText, previewAmount, warning } = tx;

  const { setPreviewAmount } = useLoanCalculationsContext();

  useEffect(() => {
    setPreviewAmount(previewAmount);
  }, [previewAmount, setPreviewAmount]);

  const [ackChecked, setAckChecked] = useState(false);

  // Parse amount for numeric comparisons (empty string becomes 0)
  const parsedAmount = parseFloat(amount) || 0;

  // Button is disabled when:
  // - No available amount (for borrow: no borrowable amount from collateral, for repay: no USDT in wallet)
  // - Amount is zero or negative
  // - Transaction is processing
  // - User hasn't acknowledged the risks
  // - Amount exceeds available limit
  // - For borrow mode: amount is less than 1 USDT but greater than 0
  const isDisabled = available <= 0 || parsedAmount <= 0 || isProcessing || !ackChecked || parsedAmount > available || (mode === "borrow" && parsedAmount < 1);

  return (
    <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title={title} />

      <div className="flex flex-col gap-2">
        <InputAmountCard
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          tokenSymbol="USDT"
          usdValue={parsedAmount}
          availableAmount={available}
          onMaxPress={handleMax}
          editable={!isProcessing}
        />
        {mode === "borrow" && (
          parsedAmount > available ? (
            <Text className="text-destructive">Amount exceeds your maximum borrowable amount.</Text>
          ) : parsedAmount > 0 && parsedAmount < 1 ? (
            <Text className="text-destructive">Minimum borrow amount is 1 USDT.</Text>
          ) : null
        )}
      </div>

      <TransactionOverview previewAmount={previewAmount} warning={warning} />

      <div className="flex items-start justify-center gap-3">
        <input type="checkbox" id="ack" checked={ackChecked} onChange={() => setAckChecked((v) => !v)} aria-checked={ackChecked} className="mt-1" />
        <label htmlFor="ack" className="text-sm text-white/70 cursor-pointer">
          {mode === "repay" ? "I confirm that I've reviewed the repayment details above." : "I acknowledge the risks involved."}
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
