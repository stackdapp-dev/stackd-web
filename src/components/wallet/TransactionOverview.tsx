"use client";

import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { AlertTriangle, ArrowLeftRight, ArrowRight } from "lucide-react";
import { useState } from "react";

type TxItem = {
  icon?: string;
  label: string;
  value: string | string[];
};

interface TransactionOverviewProps {
  previewAmount?: number;
  warning: string;
}

export default function TransactionOverview({
  previewAmount = 0,
  warning,
}: TransactionOverviewProps) {
  const [showAmount, setshowAmount] = useState(false);
  const { loanCalcs } = useLoanCalculationsContext();

  const {
    wbtc,
    usdt,
    borrowable,
    ltvRange,
    maxLtv,
    borrowCapacity,
    liquidationRatio,
    liquidationPoint,
    borrowApr,
  } = loanCalcs;

  const showWarning = ltvRange[1] > 0.93 * maxLtv;
  const commonItems: TxItem[] = [
    { icon: "WBTC", label: "WBTC Collateral", value: formatCurrency(wbtc) },
    { icon: "USDT", label: "USDT Loan", value: [formatCurrency(usdt[0]), formatCurrency(usdt[1])] },
    { label: "Borrow APR", value: formatPercent(borrowApr) },
  ];

  // percent
  const pctItems: TxItem[] = [
    { label: "Loan-to-Value ratio", value: [formatPercent(ltvRange[0]), formatPercent(ltvRange[1])] },
    { label: "Max LTV", value: formatPercent(maxLtv, 1) },
    { label: "Liquidation ratio", value: formatPercent(liquidationRatio, 1) },
  ];

  // amount
  const amtItems: TxItem[] = [
    { label: "Borrowable Amount", value: [formatCurrency(borrowable[0]), formatCurrency(borrowable[1])] },
    { label: "Borrow Capacity", value: formatCurrency(borrowCapacity) },
    { label: "Liquidation Point", value: formatCurrency(liquidationPoint) },
  ];

  const itemsToRender = showAmount ? [...commonItems, ...amtItems] : [...commonItems, ...pctItems];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Text>Transaction overview</Text>
        <button
          onClick={() => setshowAmount((v) => !v)}
          className="mr-4 text-muted cursor-pointer"
        >
          <ArrowLeftRight size={12} />
        </button>
      </div>

      <Card appearance="container">
        <div className="space-y-3 w-full">
          {itemsToRender.map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0">
                {item.icon ? (
                  <TokenIcon symbol={item.icon} width={22} height={22} />
                ) : null}
                <div className="text-sm truncate">{item.label}</div>
              </div>
              <div className="flex-shrink-0 text-sm text-muted whitespace-nowrap text-right">
                {Array.isArray(item.value) ? (
                  previewAmount !== 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <Text tone="white">{item.value[0]}</Text>
                      <ArrowRight size={10} className="text-muted" />
                      <Text>{item.value[1]}</Text>
                    </div>
                  ) : (
                    <Text>{item.value[0]}</Text>
                  )
                ) : (
                  <Text>{item.value}</Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showWarning && (
        <div className="mt-8 p-3 rounded bg-red-950/80 text-white flex items-center gap-2">
          <AlertTriangle size={18} className="flex-shrink-0 text-red-400" aria-hidden />
          <Text size="xs" className="text-red-200">{warning}</Text>
        </div>
      )}
    </div>
  );
}
