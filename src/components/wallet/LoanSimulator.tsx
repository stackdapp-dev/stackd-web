"use client";

import { useState, useMemo, useCallback } from "react";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { Loading } from "@/components/ui/loading";
import TokenIcon from "@/components/common/TokenIcon";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";
import SimulatorResults from "@/components/wallet/SimulatorResults";
import { simulateLoan, type SimulationResult } from "@/lib/loans/loanSimulator";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useCompound } from "@/hooks/useCompound";
import { getTokenMetadata } from "@/constants/Tokens";
import { formatAmount, formatCurrency, cn } from "@/lib/utils";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { parseUnits } from "viem";

/**
 * LoanSimulator - Main simulator component with collateral and borrow sliders
 *
 * Uses existing useLoanCalculationsContext for current loan data
 * Shows SimulatorGauge and SimulatorResults for visualization
 * "Apply to Loan" button navigates to borrow page
 */
export default function LoanSimulator() {
  const { refetchBalances } = useWalletBalanceContext();
  const { loanCalcs, refetchLoanData } = useLoanCalculationsContext();
  const getPrice = useGetTokenPrice();
  const { withdraw } = useCompound();

  // Modal and processing state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Simulator state - store borrow as string for input
  const [borrowInput, setBorrowInput] = useState(String(currentBorrowedAmount));

  // Parse input value for calculations (collateral is fixed)
  const simulatedBorrow = parseFloat(borrowInput) || 0;

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

  // Calculate simulated result (collateral is fixed, only borrow changes)
  const simulatedResult = useMemo((): SimulationResult => {
    return simulateLoan({
      collateralWbtc: currentCollateralAmount,
      borrowedUsd: simulatedBorrow,
      btcPrice,
      maxLtv,
      liquidationRatio,
      borrowApr,
    });
  }, [currentCollateralAmount, simulatedBorrow, btcPrice, maxLtv, liquidationRatio, borrowApr]);

  // Max borrow is capped at borrow capacity with a 1% safety buffer
  // This prevents transaction failures due to precision differences between
  // JS floating-point calculations and Compound's on-chain uint256 math
  const maxBorrow = simulatedResult.borrowCapacity * 0.99;

  // Check if borrow value has changed
  const hasChanges = Math.abs(simulatedBorrow - currentBorrowedAmount) > 0.01;

  // Handle borrow input change
  const handleBorrowChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBorrowInput(e.target.value);
    },
    []
  );

  // Reset to current values
  const handleReset = useCallback(() => {
    setBorrowInput(String(currentBorrowedAmount));
  }, [currentBorrowedAmount]);

  // Calculate additional borrow amount
  const additionalBorrowAmount = Math.max(0, simulatedBorrow - currentBorrowedAmount);

  // Show confirmation modal
  const handleApplyToLoan = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  // Execute borrow transaction
  const handleConfirmBorrow = useCallback(async () => {
    if (isProcessing || additionalBorrowAmount <= 0) return;

    setIsProcessing(true);
    try {
      const tokenMeta = getTokenMetadata("USDT");
      if (!tokenMeta) throw new Error("USDT metadata not found");

      const tokenAddress = tokenMeta.address as `0x${string}`;
      const amountBigInt = parseUnits(String(additionalBorrowAmount), tokenMeta.decimals);

      const result = await withdraw(tokenAddress, amountBigInt);
      if (result.error) throw new Error(result.error);

      await Promise.all([refetchBalances(), refetchLoanData()]);
      setShowConfirmModal(false);
      setBorrowInput(String(simulatedBorrow)); // Update input to reflect new borrowed amount
    } catch (err) {
      console.error("Borrow failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, additionalBorrowAmount, withdraw, refetchBalances, refetchLoanData, simulatedBorrow]);

  return (
    <div className="flex flex-col gap-6">
      {/* LTV Gauge with Borrow Input */}
      <Card appearance="glassDark" padding="default">
        <SimulatorGauge
          currentLtv={currentResult.ltv}
          simulatedLtv={simulatedResult.ltv}
          maxLtv={maxLtv}
          liquidationRatio={liquidationRatio}
        />

        {/* Borrow Input */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <TokenIcon symbol="USDT" width={24} height={24} />
              <span className="text-white/70 text-sm">Borrow Amount (USDT)</span>
            </div>
            <button
              type="button"
              onClick={() => setBorrowInput(String(maxBorrow))}
              className="text-amber-500 text-xs hover:text-amber-400 transition-colors"
            >
              Max: {formatCurrency(maxBorrow, 0, "$", false)}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={borrowInput}
              onChange={handleBorrowChange}
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-white/5 border border-white/10",
                "text-white font-semibold text-right pr-16",
                "focus:outline-none focus:border-amber-500/50",
                "placeholder:text-white/30"
              )}
              placeholder="0"
              data-testid="borrow-input"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
              USD
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-4",
              "rounded-2xl border border-white/10 bg-white/5",
              "hover:bg-white/10 transition-colors",
              "disabled:opacity-40 disabled:hover:bg-white/5"
            )}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
              <RotateCcw className="w-5 h-5 text-white/70" />
            </div>
            <span className="text-white/70 text-sm">Reset</span>
          </button>
          <button
            onClick={handleApplyToLoan}
            disabled={!hasChanges}
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-4",
              "rounded-2xl border border-white/10 bg-white/5",
              "hover:bg-white/10 transition-colors",
              "disabled:opacity-40 disabled:hover:bg-white/5"
            )}
            data-testid="apply-button"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
              <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
            <span className="text-amber-500 text-sm">Borrow</span>
          </button>
        </div>
      </Card>

      {/* Collateral Section */}
      <div>
        <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
          Collateral
        </h2>
        <Card appearance="glassDark" padding="default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenIcon symbol="WBTC" width={48} height={48} />
              <div>
                <p className="text-white font-semibold">Wrapped Bitcoin</p>
                <p className="text-white/50 text-sm">WBTC</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">
                {formatAmount(currentCollateralAmount, 4)} WBTC
              </p>
              <p className="text-white/50 text-sm">
                {formatCurrency(currentCollateralAmount * btcPrice)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Loan Statistics */}
      <div>
        <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
          Loan Statistics
        </h2>
        <SimulatorResults
          currentResult={currentResult}
          simulatedResult={simulatedResult}
          borrowApr={borrowApr}
        />
      </div>

      {/* Borrow Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isProcessing && setShowConfirmModal(false)}
        title={isProcessing ? "Processing" : "Confirm Borrow"}
        icon={
          isProcessing ? (
            <Loading />
          ) : (
            <div className="bg-amber-500/20 rounded-full p-4">
              <TokenIcon symbol="USDT" width={40} height={40} />
            </div>
          )
        }
        message={
          isProcessing ? (
            <Text tone="muted">
              Please confirm the transaction in your wallet.
            </Text>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Amount Display */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/50 text-sm mb-1">Borrow Amount</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(additionalBorrowAmount, 2)}
                </p>
                <p className="text-white/40 text-sm mt-1">USDT</p>
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Current Borrowed</span>
                <span className="text-white">{formatCurrency(currentBorrowedAmount, 2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">New Total</span>
                <span className="text-amber-400 font-semibold">{formatCurrency(simulatedBorrow, 2)}</span>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-400/80 text-xs">
                  This will increase your LTV and the risk of liquidation.
                </p>
              </div>
            </div>
          )
        }
        primaryButtonText={isProcessing ? "Processing..." : "Borrow"}
        primaryButtonAction={handleConfirmBorrow}
        secondaryButtonText="Cancel"
        secondaryButtonAction={() => setShowConfirmModal(false)}
        showCloseButton={!isProcessing}
        showActionButtons={!isProcessing}
      />
    </div>
  );
}
