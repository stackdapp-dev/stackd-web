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
      <Text size="sm" className="mb-2">
        {label}
      </Text>
      <Card appearance="container">
        <div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-4 gap-y-1 w-full">
          <input
            value={value}
            type="number"
            onChange={(e) => handleChange(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            disabled={!editable}
            min="0"
            className="w-full bg-transparent border-0 text-white text-2xl font-semibold outline-none appearance-none [-moz-appearance:textfield]"
          />
          <div className="flex items-center gap-2 justify-end">
            <TokenIcon width={24} height={24} symbol={tokenSymbol} />
            <Text size="sm" weight="semibold">
              {tokenSymbol}
            </Text>
          </div>
          <Text size="sm" tone="muted">
            {formatCurrency(Number(usdValue || 0))}
          </Text>
          <div className="text-sm text-muted flex items-center gap-3 justify-end">
            <Text size="sm" tone="muted">
              Balance {formatAmount(availableAmount)}
            </Text>
            <button onClick={onMaxPress} className="text-primary">
              MAX
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
