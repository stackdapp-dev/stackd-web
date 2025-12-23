"use client";

import MaskedValue from "@/components/ui/maskedValue";
import { MoreVertical, Search } from "lucide-react";

interface BalanceProps {
  amount: number;
  visible?: boolean;
  onToggleVisibility?: () => void;
}

export default function Balance({ amount, visible, onToggleVisibility }: BalanceProps) {
  return (
    <div className="w-full px-4 pt-8 pb-4">
      <div className="flex items-start justify-between">
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

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Search className="w-5 h-5 text-white/60" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}
