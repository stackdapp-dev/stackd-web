"use client";

import MaskedValue from "@/components/ui/maskedValue";
import { Eye, EyeOff, ArrowDownToLine, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccessToast } from "@/components/ui/custom-toast";

interface BalanceProps {
  amount: number;
  visible?: boolean;
  onToggleVisibility?: () => void;
  walletAddress: string;
}

export default function Balance({
  amount,
  visible = true,
  onToggleVisibility,
  walletAddress,
}: BalanceProps) {
  const router = useRouter();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    showSuccessToast("Address copied");
  };

  return (
    <div className="px-4 pt-6">
      {/* WALLET Header */}
      <h1 className="text-white text-xl font-semibold mb-4">Wallet</h1>

      {/* Card with gradient border and interior gradient */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/40 via-amber-600/20 to-indigo-500/20">
        {/* Interior gradient background - deep navy with subtle purple tint */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950">
          {/* Subtle left-side glow effect */}
          <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-transparent pointer-events-none" />

          {/* Cash In Button - positioned absolute in top right */}
          <button
            onClick={() => router.push("/wallet/cash-in")}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-colors z-10"
          >
            <ArrowDownToLine className="w-5 h-5 text-white" />
          </button>

          <div className="relative p-5">
            {/* Label */}
            <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-2">
              Total Collateral Balance
            </p>

            {/* Hero Balance with toggle icon */}
            <div className="flex items-center gap-3">
              <MaskedValue
                value={amount || 0}
                mask="long"
                visible={visible}
                className="text-4xl sm:text-5xl font-bold text-white"
              />
              {/* Custom visibility toggle */}
              <button
                onClick={onToggleVisibility}
                className="p-2 rounded-full border border-white/20 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Wallet Address Pill */}
            <div className="mt-3">
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="text-white/60 text-sm font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <Copy className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
