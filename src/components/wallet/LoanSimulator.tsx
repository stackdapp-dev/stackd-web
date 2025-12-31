"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TokenIcon from "@/components/common/TokenIcon";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";
import SimulatorResults from "@/components/wallet/SimulatorResults";
import { simulateLoan, type SimulationResult } from "@/lib/loans/loanSimulator";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { formatAmount, formatCurrency, cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

/**
 * LoanSimulator - Main simulator component with collateral and borrow sliders
 *
 * Uses existing useLoanCalculationsContext for current loan data
 * Shows SimulatorGauge and SimulatorResults for visualization
 * "Apply to Loan" button navigates to borrow page
 */
export default function LoanSimulator() {
  const router = useRouter();
  const { wbtcBalance } = useWalletBalanceContext();
  const { loanCalcs } = useLoanCalculationsContext();
  const getPrice = useGetTokenPrice();

  const {
    suppliedAssets,
    borrowedAssets,
    maxLtv,
    liquidationRatio,
    borrowApr,
  } = loanCalcs;

  // Get current values
  const currentCollateral = suppliedAssets.find((a) => a.symbol === "WBTC");
  const currentBorrowed = borrowedAssets.find((a) => a.symbol === "USDT");
  const btcPrice = getPrice("WBTC");

  const currentCollateralAmount = currentCollateral?.amount || 0;
  const currentBorrowedAmount = currentBorrowed?.usdValue || 0;

  // Max collateral = current + wallet balance
  const maxCollateral = currentCollateralAmount + wbtcBalance;

  // Simulator state
  const [simulatedCollateral, setSimulatedCollateral] = useState(currentCollateralAmount);
  const [simulatedBorrow, setSimulatedBorrow] = useState(currentBorrowedAmount);

  // Calculate current simulation
  const currentResult = useMemo((): SimulationResult => {
    return simulateLoan({
      collateralWbtc: currentCollateralAmount,
      borrowedUsd: currentBorrowedAmount,
      btcPrice,
      maxLtv,
      liquidationRatio,
      borrowApr,
    });
  }, [currentCollateralAmount, currentBorrowedAmount, btcPrice, maxLtv, liquidationRatio, borrowApr]);

  // Calculate simulated result
  const simulatedResult = useMemo((): SimulationResult => {
    return simulateLoan({
      collateralWbtc: simulatedCollateral,
      borrowedUsd: simulatedBorrow,
      btcPrice,
      maxLtv,
      liquidationRatio,
      borrowApr,
    });
  }, [simulatedCollateral, simulatedBorrow, btcPrice, maxLtv, liquidationRatio, borrowApr]);

  // Max borrow is capped at borrow capacity
  const maxBorrow = simulatedResult.borrowCapacity;

  // Check if values have changed
  const hasChanges =
    Math.abs(simulatedCollateral - currentCollateralAmount) > 0.0001 ||
    Math.abs(simulatedBorrow - currentBorrowedAmount) > 0.01;

  // Handle collateral slider change
  const handleCollateralChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setSimulatedCollateral(value);

      // Recalculate max borrow based on new collateral
      const newCollateralUsd = value * btcPrice;
      const newMaxBorrow = newCollateralUsd * (maxLtv / 100);

      // If current borrow exceeds new max, cap it
      if (simulatedBorrow > newMaxBorrow) {
        setSimulatedBorrow(newMaxBorrow);
      }
    },
    [btcPrice, maxLtv, simulatedBorrow]
  );

  // Handle borrow slider change
  const handleBorrowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      // Cap at max borrowable
      const cappedValue = Math.min(value, maxBorrow);
      setSimulatedBorrow(cappedValue);
    },
    [maxBorrow]
  );

  // Reset to current values
  const handleReset = useCallback(() => {
    setSimulatedCollateral(currentCollateralAmount);
    setSimulatedBorrow(currentBorrowedAmount);
  }, [currentCollateralAmount, currentBorrowedAmount]);

  // Apply to loan - navigate to borrow page
  const handleApplyToLoan = useCallback(() => {
    // Navigate to borrow page - the actual transaction will be handled there
    router.push("/wallet/tx/borrow");
  }, [router]);

  // Calculate slider values
  const collateralUsdValue = simulatedCollateral * btcPrice;

  return (
    <div className="flex flex-col gap-6">
      {/* Simulator Header */}
      <Card appearance="glassDark" padding="default">
        <h2 className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-4">
          Loan Simulator
        </h2>

        {/* Collateral Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <TokenIcon symbol="WBTC" width={24} height={24} />
              <span className="text-white/70 text-sm">Collateral (WBTC)</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={maxCollateral}
            step={0.0001}
            value={simulatedCollateral}
            onChange={handleCollateralChange}
            className={cn(
              "w-full h-2 rounded-full appearance-none cursor-pointer",
              "bg-white/10",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-4",
              "[&::-webkit-slider-thumb]:h-4",
              "[&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-amber-500",
              "[&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-webkit-slider-thumb]:shadow-lg",
              "[&::-moz-range-thumb]:w-4",
              "[&::-moz-range-thumb]:h-4",
              "[&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-amber-500",
              "[&::-moz-range-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:border-0"
            )}
            data-testid="collateral-slider"
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-white/40 text-xs">0</span>
            <div className="text-right">
              <p className="text-white font-semibold" data-testid="collateral-amount">
                {formatAmount(simulatedCollateral, 8)} WBTC
              </p>
              <p className="text-white/50 text-sm" data-testid="collateral-usd">
                {formatCurrency(collateralUsdValue)}
              </p>
            </div>
            <span className="text-white/40 text-xs">{formatAmount(maxCollateral, 4)}</span>
          </div>
        </div>

        {/* Borrow Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <TokenIcon symbol="USDT" width={24} height={24} />
              <span className="text-white/70 text-sm">Borrow Amount (USDT)</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(maxBorrow, simulatedBorrow)}
            step={1}
            value={simulatedBorrow}
            onChange={handleBorrowChange}
            className={cn(
              "w-full h-2 rounded-full appearance-none cursor-pointer",
              "bg-white/10",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-4",
              "[&::-webkit-slider-thumb]:h-4",
              "[&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-amber-500",
              "[&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-webkit-slider-thumb]:shadow-lg",
              "[&::-moz-range-thumb]:w-4",
              "[&::-moz-range-thumb]:h-4",
              "[&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-amber-500",
              "[&::-moz-range-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:border-0"
            )}
            data-testid="borrow-slider"
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-white/40 text-xs">$0</span>
            <div className="text-right">
              <p className="text-white font-semibold" data-testid="borrow-amount">
                {formatCurrency(simulatedBorrow, 0, "$", false)}
              </p>
            </div>
            <span className="text-white/40 text-xs">
              {formatCurrency(maxBorrow, 0, "$", false)}
            </span>
          </div>
        </div>
      </Card>

      {/* LTV Gauge */}
      <Card appearance="glassDark" padding="default">
        <SimulatorGauge
          currentLtv={currentResult.ltv}
          simulatedLtv={simulatedResult.ltv}
          maxLtv={maxLtv}
          liquidationRatio={liquidationRatio}
        />
      </Card>

      {/* Results Grid */}
      <SimulatorResults
        currentResult={currentResult}
        simulatedResult={simulatedResult}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleReset}
          variant="ghost"
          className="bg-white/5 border border-white/10 hover:bg-white/10"
          disabled={!hasChanges}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleApplyToLoan}
          variant="default"
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          disabled={!hasChanges}
          data-testid="apply-button"
        >
          Apply to Loan
        </Button>
      </div>
    </div>
  );
}
