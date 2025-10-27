"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useWithdrawOTC } from "@/providers/WithrawOTCProvider";
import { ArrowLongDownIcon } from "@heroicons/react/16/solid";
import { TriangleAlertIcon } from "lucide-react";

const WithdrawViaOTC = () => {
  const {
    exchangeRate,
    amount,
    setAmount,
    convertedAmount,
    isValidAmount,
    available,
    handleMax,
  } = useWithdrawOTC();

  return (
    <div className="p-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Withdraw via OTC" backHref="/withdraw" />

      <div className="flex flex-col gap-4">
        {exchangeRate.data ? (
          <span className="text-sm text-muted">
            1 USDT ≈ {exchangeRate.data} PHP as of{" "}
            {exchangeRate.updatedAt && formatDate(exchangeRate.updatedAt)}
          </span>
        ) : (
          <span className="text-sm text-muted">Fetching latest rate...</span>
        )}
        <div className="flex flex-col gap-2">
          <InputAmountCard
            label="From"
            value={amount}
            onChangeText={setAmount}
            tokenSymbol="USDT"
            usdValue={Number(amount || 0)}
            availableAmount={available}
            onMaxPress={handleMax}
          />
          {!isValidAmount && amount !== "" && (
            <span className="text-xs text-destructive">
              Withdraw amount exceeds your available balance
            </span>
          )}
        </div>
        <div className="mx-auto">
          <ArrowLongDownIcon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm text-muted mb-2">To</div>
          <Card
            className="flex flex-row justify-between"
            appearance="container"
          >
            <input
              type="text"
              disabled
              placeholder="0.00"
              value={formatCurrency(Number(convertedAmount), 2, "", false)}
            />
            <label className="font-semibold">PHP</label>
          </Card>
        </div>
      </div>

      <div>
        <h4 className="flex gap-1 items-center">
          <TriangleAlertIcon className="w-4 h-4" /> OTC Withdrawal Reminders:
        </h4>
        <ul className="text-xs list-disc pl-4">
          <li>
            Fiat settlement typically takes 1–3 business days after crypto
            transfer confirmation.
          </li>
          <li>
            Exchange rates are updated daily at 10:00 AM (GMT+8) and may vary
            based on market conditions.
          </li>
          <li>
            Processing time may vary depending on bank clearing hours and
            network congestion.
          </li>
          <li>Ensure your bank account name is correct.</li>
          <li>
            Transactions are handled by Stack’d licensed OTC partner for secure
            conversion and settlement.
          </li>
          <li>
            Once submitted, withdrawal requests cannot be modified or cancelled.
          </li>
        </ul>
      </div>

      <Button disabled={!isValidAmount}>Choose Payment Method</Button>
    </div>
  );
};

export default WithdrawViaOTC;
