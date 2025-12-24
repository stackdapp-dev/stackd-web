"use client";

import MaskedValue from "@/components/ui/maskedValue";

interface BalanceProps {
  amount: number;
  visible?: boolean;
  onToggleVisibility?: () => void;
}

export default function Balance({ amount, visible, onToggleVisibility }: BalanceProps) {
  return (
    <div className="w-full px-4 pt-8 pb-4">
      <div>
        {/* Label */}
        <p className="text-white/60 text-sm mb-1">Total balance</p>

        {/* Hero Balance */}
        <MaskedValue
          value={amount || 0}
          mask="long"
          showToggle
          visible={visible}
          onToggle={onToggleVisibility}
          className="text-4xl sm:text-5xl font-bold text-white"
          buttonClassName="ml-2 text-white/40 hover:text-white transition-colors"
        />
      </div>
    </div>
  );
}

