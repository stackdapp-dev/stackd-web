"use client";

import MaskedValue from "@/components/ui/maskedValue";

interface BalanceProps {
  amount: number ;
  visible?: boolean;
  onToggleVisibility?: () => void;
}

export default function Balance({ amount, visible, onToggleVisibility }: BalanceProps) {
  return (
    <div className={`w-full rounded-xl p-3`}>
      <div className="flex items-center justify-center gap-3">
        <MaskedValue
          value={amount || 0}
          mask="long"
          showToggle
          visible={visible}
          onToggle={onToggleVisibility}
          className="text-center text-4xl sm:text-5xl font-bold leading-none"
          buttonClassName="self-center"
        />
      </div>
    </div>
  );
}
