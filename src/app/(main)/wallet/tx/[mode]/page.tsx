"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import Text from "@/components/ui/text";
import TransactionOverview from "@/components/wallet/TransactionOverview";
import { useAutoLend } from "@/hooks/useAutoLend";
import useTxMode from "@/hooks/useTxMode";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TxModePage() {
  const params = useParams();
  const modeParam = (params?.mode || "borrow") as string;
  const mode = modeParam === "repay" ? "repay" : "borrow";
  const router = useRouter();

  const tx = useTxMode(mode === "repay" ? "repay" : "borrow");
  const { amount, availableForRepay, setAmount, isProcessing, available, handleMax, handleAction, title, btnText, previewAmount, warning } = tx;

  const { setPreviewAmount } = useLoanCalculationsContext();

  useEffect(() => {
    setPreviewAmount(previewAmount);
  }, [previewAmount, setPreviewAmount]);

  const [ackChecked, setAckChecked] = useState(false);

  const { wbtcBalance } = useWalletBalanceContext();

  const { lendProcessing } = useAutoLend({
    mode,
    wbtcBalance,
    onError: () => router.push("/wallet"),
  });

  const isDisabled = Number(availableForRepay) <= 0 || amount <= 0 || isProcessing || lendProcessing || !ackChecked || amount > available;

  if (lendProcessing) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
        <PageHeader title={title} />
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-8 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
      <PageHeader title={title} />

      <div className="flex flex-col gap-2">
        <InputAmountCard
          label="Amount"
          value={String(amount)}
          onChangeText={(value) => setAmount(Number(value))}
          tokenSymbol="USDT"
          usdValue={amount}
          availableAmount={availableForRepay}
          onMaxPress={handleMax}
          editable={!isProcessing && !lendProcessing}
        />
        {mode === "borrow" && amount > available && (
          <Text className="text-destructive">Amount exceeds your maximum borrowable amount.</Text>
        )}
      </div>

      <TransactionOverview previewAmount={previewAmount} warning={warning} />

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
