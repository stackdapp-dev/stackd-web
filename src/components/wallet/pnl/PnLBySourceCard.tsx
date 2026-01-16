"use client";

import { usePnLCalculations } from "@/hooks/usePnLCalculations";
import { formatCurrency, cn } from "@/lib/utils";
import { Wallet, Landmark, Users } from "lucide-react";

/**
 * Format currency value for display
 */
function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "$0.00";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(value), 2, "$", false)}`;
}

/**
 * Get color class based on value
 */
function getColorClass(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) {
    return "text-white/60";
  }
  return value > 0 ? "text-green-500" : "text-red-500";
}

interface SourceRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description?: string;
}

function SourceRow({ icon, label, value, description }: SourceRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/5">
          {icon}
        </div>
        <div>
          <span className="text-white font-medium">{label}</span>
          {description && (
            <p className="text-white/40 text-xs">{description}</p>
          )}
        </div>
      </div>
      <span className={cn("font-medium", getColorClass(value))}>
        {formatValue(value)}
      </span>
    </div>
  );
}

export function PnLBySourceCard() {
  const { bySource, isLoading } = usePnLCalculations();

  if (isLoading) {
    return (
      <div
        data-testid="pnl-by-source-card"
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <div data-testid="source-pnl-loading-skeleton" className="space-y-4">
          <div className="h-4 w-28 bg-white/10 rounded skeleton-shimmer" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg skeleton-shimmer" />
                <div className="h-4 w-24 bg-white/10 rounded skeleton-shimmer" />
              </div>
              <div className="h-4 w-20 bg-white/10 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalBySource = (bySource?.holdings ?? 0) + (bySource?.lending ?? 0) + (bySource?.referrals ?? 0);

  return (
    <div
      data-testid="pnl-by-source-card"
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
    >
      <h3 className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-4">
        PnL by Source
      </h3>

      <div className="divide-y divide-white/5">
        <SourceRow
          icon={<Wallet className="w-5 h-5 text-amber-500" />}
          label="Holdings"
          value={bySource?.holdings ?? 0}
          description="Wallet asset appreciation"
        />
        <SourceRow
          icon={<Landmark className="w-5 h-5 text-blue-400" />}
          label="Lending"
          value={bySource?.lending ?? 0}
          description="Collateral earnings"
        />
        <SourceRow
          icon={<Users className="w-5 h-5 text-purple-400" />}
          label="Referrals"
          value={bySource?.referrals ?? 0}
          description="Referral program earnings"
        />
      </div>

      {/* Total Summary */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Total</span>
          <span className={cn("font-semibold text-lg", getColorClass(totalBySource))}>
            {formatValue(totalBySource)}
          </span>
        </div>
      </div>
    </div>
  );
}
