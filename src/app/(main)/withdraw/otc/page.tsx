"use client";

import InputAmountCard from "@/components/common/InputAmountCard";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";
import { formatAmount, formatDate } from "@/lib/utils";
import { useUser } from "@/providers/UserProvider";
import {
  MIN_PHP_AMOUNT_NO_FEE,
  MIN_USDT_WITHDRAW_AMOUNT,
  PHP_WITHDRAW_FEE,
  useWithdrawOTC,
} from "@/providers/WithrawOTCProvider";
import { ArrowLongDownIcon } from "@heroicons/react/16/solid";
import { TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const { paymentMethods } = useUser();

  const router = useRouter();

  const choosePayMethod = () => {
    console.log("paymentMethods", paymentMethods);
    if (paymentMethods.length > 0) {
      router.push("/withdraw/otc/pay-methods");
    } else {
      router.push("/withdraw/otc/pay-methods/add");
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)] flex flex-col gap-8">
      <PageHeader title="Withdraw via OTC" />

      <div className="flex flex-col gap-4">
        {exchangeRate?.data ? (
          <span className="text-sm text-muted">
            1 USDT ≈ {formatAmount(Number(exchangeRate.data))} PHP as of{" "}
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
              {Number(amount) > available
                ? "Withdraw amount exceeds your available balance"
                : "Withdraw amount must be at least " +
                MIN_USDT_WITHDRAW_AMOUNT +
                " USDT"}
            </span>
          )}
        </div>
        <div>
          <div className="flex justify-center">
            <ArrowLongDownIcon className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-muted">To</div>
            <Card
              className="flex flex-row justify-between"
              appearance="container"
            >
              <input
                type="text"
                disabled
                placeholder="0.00"
                value={formatAmount(Number(convertedAmount))}
              />
              <label className="font-semibold">PHP</label>
            </Card>
            {Number(convertedAmount) > 0 &&
              Number(convertedAmount) < MIN_PHP_AMOUNT_NO_FEE && (
                <p className="text-xs">
                  <b>Note:</b> A {formatAmount(PHP_WITHDRAW_FEE)} PHP flat fee
                  applies to withdrawals below{" "}
                  {formatAmount(MIN_PHP_AMOUNT_NO_FEE)} PHP.
                </p>
              )}
          </div>
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
            Transactions are handled by ArCa licensed OTC partner for secure
            conversion and settlement.
          </li>
          <li>
            Once submitted, withdrawal requests cannot be modified or cancelled.
          </li>
        </ul>
      </div>

      <Button disabled={!isValidAmount} onClick={choosePayMethod}>
        Choose Payment Method
      </Button>
    </div>
  );
};

export default WithdrawViaOTC;
