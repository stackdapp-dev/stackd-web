"use client";

import MaskedValue from "@/components/ui/maskedValue";
import BetaBadge from "@/components/ui/BetaBadge";
import { Eye, EyeOff, ArrowDownToLine, Copy, Check, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { showSuccessToast } from "@/components/ui/custom-toast";
import { useState, useCallback } from "react";

interface BalanceProps {
  amount: number;
  visible?: boolean;
  onToggleVisibility?: () => void;
  walletAddress: string;
  isLoading?: boolean;
}

export default function Balance({
  amount,
  visible = true,
  onToggleVisibility,
  walletAddress,
  isLoading = false,
}: BalanceProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = useCallback(async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(walletAddress);
      } else {
        // Fallback for older browsers / iOS Safari
        const textArea = document.createElement("textarea");
        textArea.value = walletAddress;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      // Show visual feedback
      setCopied(true);
      showSuccessToast("Address copied");

      // Reset after animation
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  }, [walletAddress]);

  return (
    <div className="px-4 pt-6">
      {/* BETA Badge */}
      <div className="flex justify-center mb-4">
        <BetaBadge />
      </div>

      {/* WALLET Header with Menu Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-semibold">Wallet</h1>
        <button
          onClick={() => router.push("/menu")}
          className="p-2 rounded-full border border-white/20 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Open menu"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Card with gradient border and interior gradient */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/40 via-amber-600/20 to-indigo-500/20">
        {/* Interior gradient background - deep navy with subtle purple tint */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950">
          {/* Subtle left-side glow effect */}
          <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-indigo-900/40 via-indigo-950/20 to-transparent pointer-events-none" />

          {/* Cash In Button - vertically centered in right side */}
          <button
            onClick={() => router.push("/wallet/cash-in")}
            className="absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-colors z-10"
          >
            <ArrowDownToLine className="w-5 h-5 text-white" />
          </button>

          <div className="relative p-5">
            {/* Label */}
            <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-2">
              Total Collateral Balance
            </p>

            {isLoading ? (
              /* Loading Skeleton */
              <div data-testid="balance-loading-skeleton" className="space-y-3">
                <div className="h-12 w-48 bg-white/10 rounded skeleton-shimmer" />
                <div className="h-5 w-40 bg-white/10 rounded skeleton-shimmer" />
              </div>
            ) : (
              <>
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
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
