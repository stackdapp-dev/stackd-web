"use client";

import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { useLoanCalculations } from "@/hooks/useLoanCalculations";
import { formatAmount, formatCurrency, formatPercent, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";

type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

interface LoanInfoProps {
  assets?: any[];
  supplied?: Asset[];
  borrowed?: Asset[];
  ltv?: number;
  borrowApr?: number;
  borrowableAmount?: number;
  liquidationPrice?: number;
  onBorrow?: () => void;
  onRepay?: () => void;
}

export default function LoanInfo({ assets = [], supplied = [], borrowed = [], onBorrow, onRepay }: LoanInfoProps) {
  const visibility = useVisibility();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const wbtcBalance = useMemo(() => assets.find((a) => a.symbol === "WBTC")?.amount || 0, [assets]);

  const { ltv, borrowApr, borrowableAmount, liquidationPrice, netLoanValue } = useLoanCalculations(supplied, borrowed);

  const hasBorrowed = borrowed.some(b => b.symbol === "USDT" && b.amount > 0);

  const handleBorrow = () => {
    if (wbtcBalance > 0 || borrowableAmount > 0) {
      if (onBorrow) {
        onBorrow();
      } else {
        router.push("/wallet/tx/borrow");
      }
    } else {
      setShowModal(true);
    }
  };


  return (
    <div className={`w-full`}>
      <div className="grid grid-cols-3 items-center mb-1">
        <div className="text-center">
          <Text size="sm" weight="semibold" case="upper">
            LOAN INFO
          </Text>
        </div>
        <div className="text-left pl-6" />
        <div className="text-center">
          <MaskedValue value={netLoanValue} mask="long" className="text-sm font-semibold" />
        </div>
      </div>

      <Card>
        <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text size="sm" weight="semibold" case="upper">
              SUPPLIED
            </Text>
            <div className="flex flex-col gap-2">
              {supplied.map((s) => (
                <div key={s.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={s.symbol} width={22} height={22} />
                    <Text size="sm" weight="semibold">
                      {s.symbol}
                    </Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text size="sm" weight="semibold" className="mt-0">
                      {maskString(formatAmount(s.amount), visibility.visible, MASK_SHORT)}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text size="sm" weight="semibold" className="mt-0 text-right">
                      {maskString(formatCurrency(s.usdValue), visibility.visible, MASK_LONG)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            <Text size="sm" weight="semibold" case="upper" className="mt-2">
              BORROWED
            </Text>
            <div className="flex flex-col gap-2">
              {borrowed.map((b) => (
                <div key={b.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={b.symbol} width={22} height={22} />
                    <Text size="sm" weight="semibold">
                      {b.symbol}
                    </Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text size="sm" weight="semibold" className="mt-0">
                      {maskString(formatAmount(b.amount), visibility.visible, MASK_SHORT)}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text size="sm" weight="semibold" className="mt-0 text-right">
                      {maskString(formatCurrency(b.usdValue), visibility.visible, MASK_LONG)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="mb-2" tone="white">
                LTV
              </Text>
              <Text size="sm" weight="semibold" className="mb-3">
                {maskString(`${formatPercent(ltv)}`, visibility.visible, MASK_SHORT)}
              </Text>

              <Text className="mb-2" tone="white">
                Borrowable Amount
              </Text>
              <Text size="sm" weight="semibold">
                {maskString(formatCurrency(borrowableAmount), visibility.visible, MASK_LONG)}
              </Text>
            </div>

            <div>
              <Text className="mb-2 text-right" tone="white">
                Borrow APR
              </Text>
              <Text size="sm" weight="semibold" className="mb-4 text-right">
                {maskString(`${formatPercent(borrowApr)}`, visibility.visible, MASK_SHORT)}
              </Text>

              <Text className="mb-2 text-right" tone="white">
                Liquidation Price
              </Text>
              <Text size="sm" weight="semibold" className="text-right">
                {maskString(formatCurrency(liquidationPrice), visibility.visible, MASK_LONG)}
              </Text>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3 w-full">
          <Button onClick={handleBorrow} className="flex-1" type="button">
            Borrow
          </Button>
          <Button onClick={onRepay ?? (() => router.push("/wallet/tx/repay"))} className="flex-1" type="button" disabled={!hasBorrowed}>
            Repay
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Insufficient Collateral"
        message={
          <>
            <Text tone="muted" className="mb-3">
              Your WBTC collateral is below the required amount for this action.
            </Text>
            <Text tone="muted" className="mb-6">
              Please deposit more WBTC to borrow USDT.
            </Text>
          </>
        }
        icon={<AlertTriangle className="text-amber-400" size={28} />}
        primaryButtonText="Deposit"
        primaryButtonAction={() => {
          router.push("/wallet/deposit?symbol=WBTC");
        }}
        secondaryButtonText="Go back"
        secondaryButtonAction={() => {
          setShowModal(false);
          router.push("/wallet");
        }}
      />
    </div>
  );
}
