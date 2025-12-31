"use client";

import Card from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { HealthStatus, SimulationResult } from "@/lib/loans/loanSimulator";
import { Activity, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";

interface SimulatorResultsProps {
  currentResult: SimulationResult;
  simulatedResult: SimulationResult;
  borrowApr: number;
  className?: string;
}

/**
 * Grid of result cards showing simulation metrics:
 * - Borrowable amount
 * - Liquidation price
 * - Health factor
 * - Monthly cost
 */
export default function SimulatorResults({
  currentResult,
  simulatedResult,
  borrowApr,
  className,
}: SimulatorResultsProps) {
  const hasChanges = (current: number, simulated: number): boolean => {
    return Math.abs(current - simulated) > 0.01;
  };

  const getHealthStatusColor = (status: HealthStatus): string => {
    switch (status) {
      case "safe":
        return "text-green-400";
      case "warning":
        return "text-orange-400";
      case "danger":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  const getHealthStatusLabel = (status: HealthStatus): string => {
    switch (status) {
      case "safe":
        return "Safe";
      case "warning":
        return "Warning";
      case "danger":
        return "At Risk";
      default:
        return "Unknown";
    }
  };

  const formatHealthFactor = (hf: number): string => {
    if (!isFinite(hf)) return "N/A";
    return hf.toFixed(2);
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {/* Borrowable Amount Card */}
      <Card appearance="glassDark" padding="default" data-testid="borrowable-card">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-amber-500" />
          <p className="text-white/50 text-sm">Borrowable</p>
        </div>
        <div className="flex flex-col">
          {hasChanges(currentResult.borrowableAmount, simulatedResult.borrowableAmount) && (
            <span className="text-white/40 text-sm line-through">
              {formatCurrency(currentResult.borrowableAmount)}
            </span>
          )}
          <p className="text-white font-bold text-xl" data-testid="borrowable-amount">
            {formatCurrency(simulatedResult.borrowableAmount)}
          </p>
        </div>
      </Card>

      {/* Liquidation Price Card */}
      <Card appearance="glassDark" padding="default" data-testid="liquidation-card">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <p className="text-white/50 text-sm">Liquidation Price</p>
        </div>
        <div className="flex flex-col">
          {hasChanges(currentResult.liquidationPrice, simulatedResult.liquidationPrice) && (
            <span className="text-white/40 text-sm line-through">
              {formatCurrency(currentResult.liquidationPrice, 0)}
            </span>
          )}
          <p className="text-white font-bold text-xl" data-testid="liquidation-price">
            {simulatedResult.liquidationPrice > 0
              ? formatCurrency(simulatedResult.liquidationPrice, 0)
              : "N/A"}
          </p>
        </div>
      </Card>

      {/* Health Factor Card */}
      <Card appearance="glassDark" padding="default" data-testid="health-card">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-amber-500" />
          <p className="text-white/50 text-sm">Health Factor</p>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "font-bold text-xl",
              getHealthStatusColor(simulatedResult.healthStatus)
            )}
            data-testid="health-factor"
          >
            {formatHealthFactor(simulatedResult.healthFactor)}
          </p>
          <span
            className={cn(
              "text-sm px-2 py-0.5 rounded-full",
              simulatedResult.healthStatus === "safe"
                ? "bg-green-500/20 text-green-400"
                : simulatedResult.healthStatus === "warning"
                ? "bg-orange-500/20 text-orange-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {getHealthStatusLabel(simulatedResult.healthStatus)}
          </span>
        </div>
      </Card>

      {/* Yearly Interest Card */}
      <Card appearance="glassDark" padding="default" data-testid="yearly-interest-card">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-amber-500" />
          <p className="text-white/50 text-sm">Yearly Interest</p>
        </div>
        <div className="flex flex-col">
          {hasChanges(currentResult.yearlyInterest, simulatedResult.yearlyInterest) && (
            <span className="text-white/40 text-sm line-through">
              ~{formatCurrency(currentResult.yearlyInterest, 2)}
            </span>
          )}
          <p className="text-white font-bold text-xl" data-testid="yearly-interest">
            {borrowApr.toFixed(1)}% APR
          </p>
          <p className="text-white/40 text-xs mt-1">
            ~{formatCurrency(simulatedResult.yearlyInterest, 2)}/year
          </p>
        </div>
      </Card>
    </div>
  );
}
