"use client";

import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import Text from "@/components/ui/text";
import { useLoanCalculations } from "@/hooks/useLoanCalculations";
import { formatAmount, formatCurrency, formatPercent, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";


type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

interface LoanInfoProps {
  supplied?: Asset[];
  borrowed?: Asset[];
  ltv?: number;
  borrowApr?: number;
  borrowableAmount?: number;
  liquidationPrice?: number;
  onBorrow?: () => void;
  onRepay?: () => void;
}

export default function LoanInfo({ supplied = [], borrowed = [], onBorrow, onRepay }: LoanInfoProps) {
  const visibility = useVisibility();
  const router = useRouter();

  const {
    ltv,
    borrowApr,
    borrowableAmount,
    liquidationPrice,
    netLoanValue,
  } = useLoanCalculations(supplied, borrowed);


  return (
    <div className={`w-full`}>
      <div className="grid grid-cols-3 items-center mb-1">
        <div className="text-center">
          <Text size="sm" weight="semibold" case="upper" >LOAN INFO</Text>
        </div>
        <div className="text-left pl-6"/>
        <div className="text-center">
          <MaskedValue value={netLoanValue} mask="long" className="text-sm font-semibold" />
        </div>
      </div>

      <Card>
        <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text size="sm" weight="semibold" case="upper" >SUPPLIED</Text>
            <div className="flex flex-col gap-2">
              {supplied.map((s) => (
                <div key={s.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={s.symbol} width={22} height={22} />
                    <Text size="sm" weight="semibold" >{s.symbol}</Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text size="sm" weight="semibold"  className="mt-0">{maskString(formatAmount(s.amount), visibility.visible, MASK_SHORT)}</Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text size="sm" weight="semibold"  className="mt-0 text-right">{maskString(formatCurrency(s.usdValue), visibility.visible, MASK_LONG)}</Text>
                  </div>
                </div>
              ))}
            </div>

            <Text size="sm" weight="semibold" case="upper"  className="mt-2">BORROWED</Text>
            <div className="flex flex-col gap-2">
              {borrowed.map((b) => (
                <div key={b.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={b.symbol} width={22} height={22} />
                    <Text size="sm" weight="semibold" >{b.symbol}</Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text size="sm" weight="semibold"  className="mt-0">{maskString(formatAmount(b.amount), visibility.visible, MASK_SHORT)}</Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text size="sm" weight="semibold"  className="mt-0 text-right">{maskString(formatCurrency(b.usdValue), visibility.visible, MASK_LONG)}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

       
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="mb-2" tone="white">LTV</Text>
              <Text size="sm" weight="semibold" className="mb-3" >{maskString(`${formatPercent(ltv)}`, visibility.visible, MASK_SHORT)}</Text>

              <Text className="mb-2" tone="white">Borrowable Amount</Text>
              <Text size="sm" weight="semibold" >{maskString(formatCurrency(borrowableAmount), visibility.visible, MASK_LONG)}</Text>
            </div>

            <div>
              <Text className="mb-2 text-right" tone="white">Borrow APR</Text>
              <Text size="sm" weight="semibold" className="mb-4 text-right" >{maskString(`${formatPercent(borrowApr)}`, visibility.visible, MASK_SHORT)}</Text>

              <Text className="mb-2 text-right" tone="white">Liquidation Price</Text>
              <Text size="sm" weight="semibold"  className="text-right">{maskString(formatCurrency(liquidationPrice), visibility.visible, MASK_LONG)}</Text>
            </div>
          </div>
          
        </div>
        
        <div className="mt-4 flex gap-3 w-full">
          <Button onClick={onBorrow ?? (() => router.push("/wallet/tx/borrow"))} className="flex-1" type="button">
            Borrow
          </Button>
          <Button onClick={onRepay ?? (() => router.push("/wallet/tx/repay"))} className="flex-1" type="button">
            Repay
          </Button>
        </div>
      </Card>
    </div>
  );
}