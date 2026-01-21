"use client";

import { cn } from "@/lib/utils";

interface SimulatorGaugeProps {
  currentLtv: number;
  simulatedLtv: number;
  maxLtv: number;
  liquidationRatio: number;
  className?: string;
}

/**
 * Visual LTV gauge showing current vs simulated position
 * with markers for maxLtv and liquidationRatio thresholds
 */
export default function SimulatorGauge({
  currentLtv,
  simulatedLtv,
  maxLtv,
  liquidationRatio,
  className,
}: SimulatorGaugeProps) {
  // Calculate positions as percentages of the gauge (0-100%)
  // We'll show the gauge from 0 to liquidationRatio + 10% for visual context
  const gaugeMax = Math.max(liquidationRatio + 10, 100);

  const currentPosition = Math.min((currentLtv / gaugeMax) * 100, 100);
  const simulatedPosition = Math.min((simulatedLtv / gaugeMax) * 100, 100);
  const maxLtvPosition = (maxLtv / gaugeMax) * 100;
  const liquidationPosition = (liquidationRatio / gaugeMax) * 100;

  const hasSimulatedChange = Math.abs(currentLtv - simulatedLtv) > 0.1;

  // Get color based on LTV risk level
  const getLtvColor = (ltv: number): string => {
    if (ltv >= maxLtv) return "bg-red-500";
    if (ltv >= 70) return "bg-orange-500";
    if (ltv >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getGradientColor = (ltv: number): string => {
    if (ltv >= maxLtv) return "from-red-500 to-red-600";
    if (ltv >= 70) return "from-orange-500 to-red-500";
    if (ltv >= 50) return "from-yellow-500 to-orange-500";
    return "from-green-500 to-amber-500";
  };

  return (
    <div className={cn("w-full", className)} data-testid="ltv-gauge">
      {/* LTV Display */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/50 text-sm">Loan-to-Value</span>
        <div className="flex items-center gap-2">
          {hasSimulatedChange && (
            <>
              <span className="text-white/50 text-sm" data-testid="ltv-current">
                {currentLtv.toFixed(1)}%
              </span>
              <span className="text-white/30">→</span>
            </>
          )}
          <span
            className={cn(
              "font-semibold",
              simulatedLtv >= maxLtv
                ? "text-red-400"
                : simulatedLtv >= 70
                ? "text-orange-400"
                : simulatedLtv >= 50
                ? "text-yellow-400"
                : "text-green-400"
            )}
            data-testid="simulated-ltv"
          >
            {simulatedLtv.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Gauge Container */}
      <div className="relative h-4 bg-white/10 rounded-full overflow-visible">
        {/* Filled portion showing simulated LTV */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all duration-300",
            getGradientColor(simulatedLtv)
          )}
          style={{ width: `${simulatedPosition}%` }}
        />

        {/* Current LTV marker (vertical line) */}
        {hasSimulatedChange && currentLtv > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/60 transition-all duration-300"
            style={{ left: `${currentPosition}%` }}
            title={`Current: ${currentLtv.toFixed(1)}%`}
          />
        )}

        {/* Max LTV threshold marker */}
        <div
          className="absolute top-0 h-full"
          style={{ left: `${maxLtvPosition}%` }}
        >
          <div className="w-0.5 h-full bg-amber-500/60" />
          {/* Percentage label - inside bar, to the left of marker */}
          <div className="absolute top-1/2 -translate-y-1/2 right-1 pr-1">
            <span className="text-xs text-amber-500 font-medium" data-testid="ltv-max">
              {maxLtv}%
            </span>
          </div>
          {/* "Max LTV" label - below bar, to the left of marker */}
          <div className="absolute -bottom-5 right-0 pr-1">
            <span className="text-xs text-amber-500/70">Max LTV</span>
          </div>
        </div>

        {/* Liquidation threshold marker */}
        <div
          className="absolute top-0 h-full"
          style={{ left: `${liquidationPosition}%` }}
        >
          <div className="w-0.5 h-full bg-red-500/60" />
          {/* Percentage label - inside bar, to the right of marker */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1 pl-1">
            <span className="text-xs text-red-500 font-medium" data-testid="ltv-liquidation">
              {liquidationRatio}%
            </span>
          </div>
          {/* "Liquidation" label - below bar, to the right of marker */}
          <div className="absolute -bottom-5 left-0 pl-1">
            <span className="text-xs text-red-500/70">Liquidation</span>
          </div>
        </div>
      </div>

      {/* 0% Label */}
      <div className="flex justify-start mt-6 text-xs">
        <span className="text-white/40">0%</span>
      </div>

      {/* Risk Warning */}
      {simulatedLtv >= maxLtv && (
        <div
          className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
          data-testid="ltv-danger"
        >
          <span className="text-red-400 text-sm">
            Near Liquidation - High risk of liquidation
          </span>
        </div>
      )}
      {simulatedLtv >= 70 && simulatedLtv < maxLtv && (
        <div
          className="mt-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg"
          data-testid="ltv-warning"
        >
          <span className="text-orange-400 text-sm">
            High LTV - Consider reducing borrow amount
          </span>
        </div>
      )}
    </div>
  );
}
