"use client";

import Card from "@/components/ui/card";
import MaskedValue from "@/components/ui/maskedValue";
import Text from "@/components/ui/text";
import { formatCurrency, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { Button } from "../ui/button";

type Item = { symbol: string; amount?: number | string; usdValue?: number | string };

interface LoanInfoProps {
  supplied?: Item[];
  borrowed?: Item[];
  ltv?: number | string;
  borrowApr?: number | string;
  borrowableAmount?: number | string;
  liquidationPrice?: number | string;
  onBorrow?: () => void;
  onRepay?: () => void;
}

export default function LoanInfo({ supplied = [], borrowed = [], ltv, borrowApr, borrowableAmount, liquidationPrice, onBorrow, onRepay }: LoanInfoProps) {
  const visibility = useVisibility();
  const totalSupplied = supplied.reduce((sum, s) => sum + Number(s.usdValue ?? 0), 0);

  return (
    <div className={`w-full`}>
      <div className="grid grid-cols-3 items-center mb-3">
        <div className="text-center">
          <Text size="sm" weight="semibold" case="upper" tone="white">LOAN INFO</Text>
        </div>
        <div className="text-left pl-6"/>
        <div className="text-right">
          <MaskedValue value={totalSupplied} mask="long" className="text-sm font-semibold" />
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Text size="sm" weight="semibold" case="upper" tone="white" className="mb-3">SUPPLIED</Text>
            <div className="flex flex-col gap-2">
              {supplied.map((s) => (
                <div key={s.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted/10 text-sm">{s.symbol[0]}</div>
                    <Text size="sm" weight="semibold" tone="white">{s.symbol}</Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text size="sm" weight="semibold" tone="whiteStrong" className="mt-0">{maskString(s.amount?.toString() || "-", visibility.visible, MASK_SHORT)}</Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text size="sm" weight="semibold" tone="whiteStrong" className="mt-0 text-right">{maskString(formatCurrency(s.usdValue), visibility.visible, MASK_LONG)}</Text>
                  </div>
                </div>
              ))}
            </div>

            <Text size="sm" weight="semibold" case="upper" tone="white" className="mt-4 mb-3">BORROWED</Text>
            <div className="flex flex-col gap-2">
              {borrowed.map((b) => (
                <div key={b.symbol} className="grid grid-cols-3 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-muted/10 text-sm">{b.symbol[0]}</div>
                    <Text size="sm" weight="semibold" tone="white">{b.symbol}</Text>
                  </div>
                  <div className="text-center">
                    <Text>AMOUNT</Text>
                    <Text size="sm" weight="semibold" tone="whiteStrong" className="mt-0">{maskString(b.amount?.toString() || "-", visibility.visible, MASK_SHORT)}</Text>
                  </div>
                  <div className="text-right">
                    <Text>USD VALUE</Text>
                    <Text size="sm" weight="semibold" tone="whiteStrong" className="mt-0 text-right">{maskString(formatCurrency(b.usdValue), visibility.visible, MASK_LONG)}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Text className="mb-2">LTV</Text>
              <Text className="text-lg font-semibold mb-3" tone="whiteStrong">{maskString(`${ltv?.toString() || "-"}%`, visibility.visible, MASK_SHORT)}</Text>

              <Text className="mb-2">Borrowable Amount</Text>
              <Text size="sm" weight="semibold" tone="whiteStrong">{maskString(formatCurrency(borrowableAmount), visibility.visible, MASK_LONG)}</Text>
            </div>

            <div>
              <Text className="mb-2 text-right">Borrow APR</Text>
              <Text className="text-lg font-semibold mb-4 text-right" tone="whiteStrong">{maskString(`${borrowApr?.toString() || "-"}%`, visibility.visible, MASK_SHORT)}</Text>

              <Text className="mb-2 text-right">Liquidation Price</Text>
              <Text size="sm" weight="semibold" tone="whiteStrong" className="text-right">{maskString(formatCurrency(liquidationPrice), visibility.visible, MASK_LONG)}</Text>
            </div>
          </div>

          <div className="mt-4 flex gap-3 w-full">
            <Button onClick={onBorrow} className="flex-1" type="button">
              Borrow
            </Button>
            <Button onClick={onRepay} className="flex-1" type="button">
              Repay
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
