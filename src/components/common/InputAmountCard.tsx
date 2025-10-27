"use client";

import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface InputAmountCardProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  tokenSymbol: string;
  usdValue: number;
  availableAmount: number;
  onMaxPress: () => void;
  editable?: boolean;
}

export default function InputAmountCard({
  label,
  value,
  onChangeText,
  tokenSymbol,
  usdValue,
  availableAmount,
  onMaxPress,
  editable = true,
}: InputAmountCardProps) {
  return (
    <div>
      <div className="text-sm text-muted mb-2">{label}</div>
      <Card className="mb-4" appearance="container">
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 min-w-0">
            <input
              value={value}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              disabled={!editable}
              className="w-full bg-transparent border-0 text-white text-2xl font-semibold outline-none"
            />
            <div className="mt-1 text-sm text-muted">{formatCurrency(Number(usdValue || 0))}</div>
          </div>

          <div className="flex flex-col items-end gap-2 ml-4 min-w-[6.5rem]">
            <div className="flex items-center gap-3">
              <TokenIcon symbol={tokenSymbol} />
              <div className="text-sm font-semibold">{tokenSymbol}</div>
            </div>
            <div className="text-sm text-muted flex items-center gap-3">
              <div>Available {availableAmount.toFixed(0)}</div>
              <button onClick={onMaxPress} className="text-primary">
                MAX
              </button>
            </div>
          </div>
        </div>

      </Card>
    </div>
  );
}
