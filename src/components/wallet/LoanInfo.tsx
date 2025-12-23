"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import MaskedValue from "@/components/ui/maskedValue";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { useAutoLend } from "@/hooks/useAutoLend";
import { formatAmount, formatCurrency, formatPercent, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useVisibility } from "@/providers/visibility";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";

export default function LoanInfo() {
  const visibility = useVisibility();
  const router = useRouter();
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const MIN_BORROWABLE_AMOUNT = 1;

  const { wbtcBalance, refetchBalances } = useWalletBalanceContext();

  const { loanCalcs, refetchLoanData } = useLoanCalculationsContext();
  const { ltv, borrowApr, borrowableAmount, liquidationPrice, netLoanValue, suppliedAssets, borrowedAssets, hasBorrowed } = loanCalcs;

  const { lendProcessing, startLend } = useAutoLend({
    wbtcBalance,
    onError: () => {
      console.error("Auto lend error");
    },
  });

  /* If there is borrowable amount but there's also WBTC to lend, lend first.
     If no borrowable amount but have WBTC to lend, lend. 
     If both are zero, show no collateral modal.
  */
  const handleBorrow = async () => {
    try {
      if (wbtcBalance > 0) {
        const hasLent = await startLend();
        if (hasLent) {
          await Promise.all([refetchBalances(), refetchLoanData()]);
          router.push("/wallet/tx/borrow");
        }
      } else if (borrowableAmount > MIN_BORROWABLE_AMOUNT) {
        router.push("/wallet/tx/borrow");
      } else {
        console.error(`Minimum Borrowable Amount(USD): ${MIN_BORROWABLE_AMOUNT}.`);
        setShowCollateralModal(true);
      }
    } catch (error) {
      console.error("Error during borrow process:", error);
    }
  };

  return (
    <div className={`w-full`}>
      {lendProcessing ? (
        <Modal
          isOpen={true}
          onClose={() => { }}
          title={"Confirm Transaction"}
          message={
            <>
              <Text tone="muted" className="mb-3">
                Please confirm the transaction in your wallet.
              </Text>
              <Loading />
            </>
          }
          icon={<AlertTriangle className="text-amber-400" size={28} />}
        />
      ) : null}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-sm font-medium uppercase tracking-wider">Loan Info</h2>
        <MaskedValue
          value={netLoanValue}
          mask="long"
          className="text-white/60 text-sm"
        />
      </div>

      <Card>
        <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text weight="semibold" case="upper">
              SUPPLIED
            </Text>
            <div className="flex flex-col gap-2">
              {suppliedAssets.map((s) => (
                <div key={s.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={s.symbol} width={22} height={22} />
                    <Text weight="semibold">{s.symbol}</Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text weight="semibold" className="mt-0">
                      {maskString(formatAmount(s.amount), visibility.visible, MASK_SHORT)}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text weight="semibold" className="mt-0 text-right">
                      {maskString(formatCurrency(s.usdValue), visibility.visible, MASK_LONG)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            <Text weight="semibold" case="upper" className="mt-2">
              BORROWED
            </Text>
            <div className="flex flex-col gap-2">
              {borrowedAssets.map((b) => (
                <div key={b.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={b.symbol} width={22} height={22} />
                    <Text weight="semibold">{b.symbol}</Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text weight="semibold" className="mt-0">
                      {maskString(formatAmount(b.amount), visibility.visible, MASK_SHORT)}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text weight="semibold" className="mt-0 text-right">
                      {maskString(formatCurrency(b.usdValue), visibility.visible, MASK_LONG)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Text tone="white">LTV</Text>
              <Text weight="semibold">
                {maskString(`${formatPercent(ltv)}`, visibility.visible, MASK_SHORT)}
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <Text tone="white">Borrow APR</Text>
              <Text weight="semibold">
                {maskString(`${formatPercent(borrowApr)}`, visibility.visible, MASK_SHORT)}
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <Text tone="white">Borrowable Amount</Text>
              <Text weight="semibold">{maskString(formatCurrency(borrowableAmount), visibility.visible, MASK_LONG)}</Text>
            </div>

            <div className="flex items-center justify-between">
              <Text tone="white">Liquidation Point</Text>
              <Text weight="semibold">
                {maskString(formatCurrency(liquidationPrice), visibility.visible, MASK_LONG)}
              </Text>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3 w-full">
          <Button onClick={handleBorrow} variant="ghost" className="flex-1" type="button">
            Borrow
          </Button>
          <Button onClick={() => router.push("/wallet/tx/repay")} variant="ghost" className="flex-1" type="button" disabled={!hasBorrowed}>
            Repay
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showCollateralModal}
        onClose={() => setShowCollateralModal(false)}
        title="Insufficient Collateral"
        message={
          <>
            <Text className="text-white/70 mb-3">
              Your WBTC collateral is below the required amount for this action.
            </Text>
            <Text className="text-white/70 mb-6">
              Please deposit more WBTC to borrow USDT.
            </Text>
          </>
        }
        icon={
          <div className="bg-amber-500/10 rounded-full p-3 mb-4">
            <AlertTriangle className="text-amber-400" size={28} />
          </div>
        }
        primaryButtonText="Deposit"
        primaryButtonAction={() => {
          setShowCollateralModal(false);
          router.push("/wallet/deposit/WBTC");
        }}
        secondaryButtonText="Go back"
        secondaryButtonAction={() => {
          setShowCollateralModal(false);
          router.push("/wallet");
        }}
      />
    </div>
  );
}
