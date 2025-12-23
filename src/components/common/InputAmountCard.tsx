"use client";

import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";
import { formatAmount, formatCurrency } from "@/lib/utils";

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

export default function InputAmountCard({ label, value, onChangeText, tokenSymbol, usdValue, availableAmount, onMaxPress, editable = true }: InputAmountCardProps) {
  const handleChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChangeText(num.toString());
    } else {
      onChangeText(val);
    }
  };

  return (
    <div>
      <Text className="mb-2">
        {label}
      </Text>
      <Card appearance="container">
        <div className="flex flex-col gap-2 w-full">
          {/* Row 1: Input + Token */}
          <div className="flex items-center justify-between gap-4">
            <input
              value={value}
              type="number"
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              disabled={!editable}
              min="0"
              className="flex-1 min-w-0 bg-transparent border-0 text-white text-2xl font-semibold outline-none appearance-none [-moz-appearance:textfield]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <TokenIcon width={24} height={24} symbol={tokenSymbol} />
              <Text weight="semibold">
                {tokenSymbol}
              </Text>
            </div>
          </div>
          {/* Row 2: USD Value + Balance/Max */}
          <div className="flex items-center justify-between gap-4">
            <Text className="text-white/50 text-sm">
              {formatCurrency(Number(usdValue || 0))}
            </Text>
            <div className="flex items-center gap-2 shrink-0">
              <Text className="text-white/50 text-sm">
                Balance {formatAmount(availableAmount)}
              </Text>
              <button
                onClick={onMaxPress}
                className="text-amber-500 font-medium cursor-pointer hover:text-amber-400 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

