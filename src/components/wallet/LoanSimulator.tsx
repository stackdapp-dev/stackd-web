"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Text from "@/components/ui/text";
import { Loading } from "@/components/ui/loading";
import TokenIcon from "@/components/common/TokenIcon";
import SimulatorGauge from "@/components/wallet/SimulatorGauge";
import SimulatorResults from "@/components/wallet/SimulatorResults";
import { simulateLoan, type SimulationResult } from "@/lib/loans/loanSimulator";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { useCollateralBreakdown } from "@/hooks/useCollateralBreakdown";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useCompound } from "@/hooks/useCompound";
import { useFluid } from "@/hooks/useFluid";
import { useXautBalance } from "@/hooks/useXautBalance";
import { getTokenMetadata } from "@/constants/Tokens";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";
import { formatAmount, formatCurrency, cn } from "@/lib/utils";
import { RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { parseUnits, formatUnits } from "viem";
import { showSuccessToast } from "@/components/ui/custom-toast";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/providers/Web3Provider";

export type SimulatorMode = "borrow" | "addCollateral" | "repay" | "withdrawCollateral" | "simulate";
export type CollateralType = "WBTC" | "XAUT";

interface LoanSimulatorProps {
  mode?: SimulatorMode;
  collateralType?: CollateralType;
  onComplete?: () => void;
}

/**
 * LoanSimulator - Unified simulator component for borrow, add collateral, and repay
 *
 * Modes:
 * - borrow: Withdraw USDT from Compound/Fluid (increases debt)
 * - addCollateral: Supply WBTC/XAUT to Compound/Fluid (increases collateral)
 * - repay: Supply USDT to Compound/Fluid (decreases debt)
 * - withdrawCollateral: Withdraw WBTC/XAUT from Compound/Fluid (decreases collateral)
 *
 * collateralType:
 * - WBTC: Uses Compound protocol on Arbitrum
 * - XAUT: Uses Fluid protocol on Ethereum mainnet
 */
export default function LoanSimulator({ mode = "borrow", collateralType = "WBTC", onComplete }: LoanSimulatorProps) {
  const router = useRouter();
  const { refetchBalances, wbtcBalance, usdtBalance } = useWalletBalanceContext();
  const { loanCalcs, refetchLoanData } = useLoanCalculationsContext();
  const getPrice = useGetTokenPrice();
  const compound = useCompound();
  const fluid = useFluid();
  const { xautBalance } = useXautBalance();
  const { breakdown } = useCollateralBreakdown();

  // Determine which protocol to use based on collateralType
  const isXaut = collateralType === "XAUT";
  const collateralSymbol = collateralType;
  const collateralName = isXaut ? "Tether Gold" : "Wrapped Bitcoin";
  const collateralDecimals = isXaut ? 6 : 8;

  // Sandbox mode state for collateral type selection
  const [sandboxCollateralType, setSandboxCollateralType] = useState<CollateralType>("WBTC");
  const effectiveCollateralType = mode === "simulate" ? sandboxCollateralType : collateralType;
  const effectiveIsXaut = effectiveCollateralType === "XAUT";
  const effectiveCollateralSymbol = effectiveCollateralType;
  const effectiveCollateralName = effectiveIsXaut ? "Tether Gold" : "Wrapped Bitcoin";
  const effectiveCollateralDecimals = effectiveIsXaut ? 6 : 8;

  // Modal and processing state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showEthAlert, setShowEthAlert] = useState(false);

  // Web3 for ETH balance check
  const { ethereumPublicClient, activeWalletAddress } = useWeb3();

  // Conditionally source data from Compound (loanCalcs) or Fluid based on collateralType
  const suppliedAssets = isXaut ? fluid.suppliedAssets : loanCalcs.suppliedAssets;
  const borrowedAssets = isXaut ? fluid.borrowedAssets : loanCalcs.borrowedAssets;
  const maxLtv = isXaut ? fluid.maxLtv : loanCalcs.maxLtv;
  const liquidationRatio = isXaut ? fluid.liquidationRatio : loanCalcs.liquidationRatio;
  const borrowApr = isXaut ? fluid.borrowApr : loanCalcs.borrowApr;

  // Effective protocol data for simulate mode (respects sandbox collateral type selection)
  const effectiveMaxLtv = effectiveIsXaut ? fluid.maxLtv : loanCalcs.maxLtv;
  const effectiveLiquidationRatio = effectiveIsXaut ? fluid.liquidationRatio : loanCalcs.liquidationRatio;
  const effectiveBorrowApr = effectiveIsXaut ? fluid.borrowApr : loanCalcs.borrowApr;

  // Get current values - use collateralSymbol based on collateralType prop
  const currentCollateral = suppliedAssets.find((a) => a.symbol === collateralSymbol);
  const currentBorrowed = borrowedAssets.find((a) => a.symbol === "USDT");
  const collateralPrice = getPrice(collateralSymbol);

  // Effective collateral price for simulate mode (uses sandbox-selected collateral type)
  const effectiveCollateralPrice = getPrice(effectiveCollateralSymbol);

  const currentCollateralAmount = currentCollateral?.amount || 0;
  const currentBorrowedAmount = currentBorrowed?.usdValue || 0;

  // Calculate available withdrawal for XAUT (based on Fluid position data)
  const xautAvailableToWithdraw = useMemo(() => {
    if (!isXaut) return 0;
    const xautCollateral = fluid.suppliedAssets.find(a => a.symbol === "XAUT");
    const totalXaut = xautCollateral?.amount || 0;
    const borrowedUsd = fluid.borrowedAssets.reduce((sum, a) => sum + a.usdValue, 0);
    const xautPrice = getPrice("XAUT");

    // Calculate locked XAUT based on borrowed amount and max LTV
    const lockedXautUsd = borrowedUsd > 0 && fluid.maxLtv > 0
      ? borrowedUsd / (fluid.maxLtv / 100)
      : 0;
    const lockedXaut = xautPrice > 0 ? lockedXautUsd / xautPrice : 0;

    return Math.max(0, totalXaut - lockedXaut) * 0.99; // 1% safety buffer
  }, [isXaut, fluid.suppliedAssets, fluid.borrowedAssets, fluid.maxLtv, getPrice]);

  // Mode-specific configuration
  const modeConfig = useMemo(() => {
    switch (mode) {
      case "addCollateral":
        return {
          title: "Add Collateral",
          inputLabel: `Collateral Amount (${collateralSymbol})`,
          tokenSymbol: collateralSymbol,
          actionButtonText: "Add Collateral",
          // For XAUT, use wallet XAUT balance from Ethereum mainnet
          // For WBTC, use wallet WBTC balance from Arbitrum
          maxValue: isXaut ? xautBalance : wbtcBalance,
          isRiskReducing: true,
          warningText: "This will increase your collateral and reduce liquidation risk.",
          successIcon: true,
          useSlider: false,
        };
      case "repay":
        return {
          title: "Repay Loan",
          inputLabel: "Repay Amount (USDT)",
          tokenSymbol: "USDT",
          actionButtonText: "Repay Loan",
          // Max is borrowed amount for simulation - wallet balance checked at action time
          maxValue: currentBorrowedAmount,
          isRiskReducing: true,
          warningText: "This will reduce your borrowed amount and liquidation risk.",
          successIcon: true,
          useSlider: true, // Enable slider for repay mode
        };
      case "withdrawCollateral":
        return {
          title: "Withdraw Collateral",
          inputLabel: `Withdraw Amount (${collateralSymbol})`,
          tokenSymbol: collateralSymbol,
          actionButtonText: "Withdraw",
          // Use XAUT available for XAUT, or BTC breakdown for WBTC  
          maxValue: isXaut ? xautAvailableToWithdraw : breakdown.availableToWithdrawBtc * 0.99,
          isRiskReducing: false,
          warningText: "This will reduce your collateral and increase liquidation risk.",
          successIcon: false,
          useSlider: true,
        };
      default: // borrow
        return {
          title: "Borrow",
          inputLabel: "Borrow Amount (USDT)",
          tokenSymbol: "USDT" as const,
          actionButtonText: "Borrow",
          maxValue: 0, // Calculated dynamically based on borrowCapacity
          isRiskReducing: false,
          warningText: "This will increase your LTV and the risk of liquidation.",
          successIcon: false,
          useSlider: true, // Enable slider for borrow mode
        };
    }
  }, [mode, wbtcBalance, usdtBalance, currentBorrowedAmount, breakdown.availableToWithdrawBtc, collateralSymbol, isXaut, xautAvailableToWithdraw, xautBalance]);

  // Simulator state - store input as string
  const [inputValue, setInputValue] = useState(mode === "borrow" ? String(currentBorrowedAmount) : "0");

  // Sandbox mode - custom collateral input (empty string allows placeholder to show)
  const [sandboxCollateral, setSandboxCollateral] = useState("");

  // Parse input value for calculations
  const parsedInput = parseFloat(inputValue) || 0;
  const parsedSandboxCollateral = parseFloat(sandboxCollateral) || 0;

  // Calculate simulated values based on mode
  const { simulatedCollateral, simulatedBorrow } = useMemo(() => {
    switch (mode) {
      case "addCollateral":
        return {
          simulatedCollateral: currentCollateralAmount + parsedInput,
          simulatedBorrow: currentBorrowedAmount,
        };
      case "repay":
        return {
          simulatedCollateral: currentCollateralAmount,
          simulatedBorrow: Math.max(0, currentBorrowedAmount - parsedInput),
        };
      case "withdrawCollateral":
        return {
          simulatedCollateral: Math.max(0, currentCollateralAmount - parsedInput),
          simulatedBorrow: currentBorrowedAmount,
        };
      case "simulate":
        return {
          simulatedCollateral: parsedSandboxCollateral,
          simulatedBorrow: parsedInput,
        };
      default: // borrow
        return {
          simulatedCollateral: currentCollateralAmount,
          simulatedBorrow: parsedInput,
        };
    }
  }, [mode, currentCollateralAmount, currentBorrowedAmount, parsedInput, parsedSandboxCollateral]);

  // Calculate current simulation result
  const currentResult = useMemo((): SimulationResult => {
    // In simulate mode, start from blank state with effective (sandbox-selected) values
    if (mode === "simulate") {
      return simulateLoan({
        collateralWbtc: 0,
        borrowedUsd: 0,
        btcPrice: effectiveCollateralPrice,
        maxLtv: effectiveMaxLtv,
        liquidationRatio: effectiveLiquidationRatio,
        borrowApr: effectiveBorrowApr,
      });
    }
    return simulateLoan({
      collateralWbtc: currentCollateralAmount,
      borrowedUsd: currentBorrowedAmount,
      btcPrice: collateralPrice,
      maxLtv,
      liquidationRatio,
      borrowApr,
    });
  }, [mode, currentCollateralAmount, currentBorrowedAmount, collateralPrice, maxLtv, liquidationRatio, borrowApr, effectiveCollateralPrice, effectiveMaxLtv, effectiveLiquidationRatio, effectiveBorrowApr]);

  // Calculate simulated result
  const simulatedResult = useMemo((): SimulationResult => {
    // In simulate mode, use effective (sandbox-selected) values
    if (mode === "simulate") {
      return simulateLoan({
        collateralWbtc: simulatedCollateral,
        borrowedUsd: simulatedBorrow,
        btcPrice: effectiveCollateralPrice,
        maxLtv: effectiveMaxLtv,
        liquidationRatio: effectiveLiquidationRatio,
        borrowApr: effectiveBorrowApr,
      });
    }
    return simulateLoan({
      collateralWbtc: simulatedCollateral,
      borrowedUsd: simulatedBorrow,
      btcPrice: collateralPrice,
      maxLtv,
      liquidationRatio,
      borrowApr,
    });
  }, [mode, simulatedCollateral, simulatedBorrow, collateralPrice, maxLtv, liquidationRatio, borrowApr, effectiveCollateralPrice, effectiveMaxLtv, effectiveLiquidationRatio, effectiveBorrowApr]);

  // Calculate max borrow with safety buffer for borrow mode
  const maxBorrow = useMemo(() => {
    if (mode === "borrow") {
      return simulatedResult.borrowCapacity * 0.99;
    }
    if (mode === "simulate") {
      // Max borrow based on sandbox collateral value - use EFFECTIVE price/LTV for sandbox mode
      const collateralUsd = parsedSandboxCollateral * effectiveCollateralPrice;
      return collateralUsd * (effectiveMaxLtv / 100) * 0.99;
    }
    return modeConfig.maxValue;
  }, [mode, simulatedResult.borrowCapacity, modeConfig.maxValue, parsedSandboxCollateral, effectiveCollateralPrice, effectiveMaxLtv]);

  // Check if value has changed
  const hasChanges = useMemo(() => {
    switch (mode) {
      case "borrow":
        return Math.abs(parsedInput - currentBorrowedAmount) > 0.01;
      case "addCollateral":
      case "repay":
      case "withdrawCollateral":
        return parsedInput > 0;
      case "simulate":
        return parsedSandboxCollateral > 0 || parsedInput > 0;
      default:
        return false;
    }
  }, [mode, parsedInput, currentBorrowedAmount, parsedSandboxCollateral]);

  // Calculate amount for transaction
  const transactionAmount = useMemo(() => {
    switch (mode) {
      case "borrow":
        return Math.max(0, parsedInput - currentBorrowedAmount);
      case "addCollateral":
      case "repay":
      case "withdrawCollateral":
        return parsedInput;
      default:
        return 0;
    }
  }, [mode, parsedInput, currentBorrowedAmount]);

  // Check allowance for supply operations
  useEffect(() => {
    const checkAllowance = async () => {
      if ((mode === "addCollateral" || mode === "repay") && transactionAmount > 0) {
        const tokenSymbol = modeConfig.tokenSymbol;
        let tokenAddress: `0x${string}`;
        let decimals: number;

        if (isXaut) {
          // Use Ethereum mainnet addresses for Fluid
          if (tokenSymbol === "XAUT") {
            tokenAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT as `0x${string}`;
            decimals = 6;
          } else if (tokenSymbol === "USDT") {
            tokenAddress = ETHEREUM_TOKEN_ADDRESSES.USDT as `0x${string}`;
            decimals = 6;
          } else {
            return;
          }
          const currentAllowance = await fluid.allowance(tokenAddress);
          const amountBigInt = parseUnits(String(transactionAmount), decimals);
          setNeedsApproval(currentAllowance !== null && currentAllowance < amountBigInt);
        } else {
          // Use Arbitrum addresses for Compound
          const tokenMeta = getTokenMetadata(tokenSymbol);
          if (!tokenMeta || !compound.allowance) return;

          tokenAddress = tokenMeta.address as `0x${string}`;
          const currentAllowance = await compound.allowance(tokenAddress);
          const amountBigInt = parseUnits(String(transactionAmount), tokenMeta.decimals);
          setNeedsApproval(currentAllowance !== null && currentAllowance < amountBigInt);
        }
      } else {
        setNeedsApproval(false);
      }
    };

    void checkAllowance();
  }, [mode, transactionAmount, compound.allowance, fluid.allowance, isXaut, modeConfig.tokenSymbol]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  // Reset to initial values
  const handleReset = useCallback(() => {
    setInputValue(mode === "borrow" ? String(currentBorrowedAmount) : "0");
    if (mode === "simulate") {
      setSandboxCollateral("");
    }
  }, [mode, currentBorrowedAmount]);

  // Set to max value
  const handleSetMax = useCallback(() => {
    setInputValue(String(maxBorrow));
  }, [maxBorrow]);

  // Show confirmation modal
  const handleApply = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  // Handle approval
  const handleApprove = useCallback(async () => {
    if (isApproving) return;

    setIsApproving(true);
    try {
      // For XAUT, use Ethereum mainnet token addresses
      const tokenSymbol = modeConfig.tokenSymbol;
      let tokenAddress: `0x${string}`;

      if (isXaut) {
        // Use Ethereum mainnet addresses for Fluid
        if (tokenSymbol === "XAUT") {
          tokenAddress = ETHEREUM_TOKEN_ADDRESSES.XAUT as `0x${string}`;
        } else if (tokenSymbol === "USDT") {
          tokenAddress = ETHEREUM_TOKEN_ADDRESSES.USDT as `0x${string}`;
        } else {
          throw new Error(`Unknown token ${tokenSymbol} for Fluid`);
        }
      } else {
        // Use Arbitrum addresses for Compound
        const tokenMeta = getTokenMetadata(tokenSymbol);
        if (!tokenMeta) throw new Error(`${tokenSymbol} metadata not found`);
        tokenAddress = tokenMeta.address as `0x${string}`;
      }

      // Approve max uint256 for convenience
      const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      const result = isXaut
        ? await fluid.approve(tokenAddress, maxAmount)
        : await compound.approve(tokenAddress, maxAmount);

      if (result.error) throw new Error(result.error);

      setNeedsApproval(false);
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setIsApproving(false);
    }
  }, [isApproving, compound, fluid, isXaut, modeConfig.tokenSymbol]);

  // Execute transaction
  const handleConfirm = useCallback(async () => {
    if (isProcessing || transactionAmount <= 0) return;

    // Capture mode at the start to ensure error messages reflect the actual operation
    // that was attempted, even if the mode prop changes during the async operation
    const operationMode = mode;

    // For XAUT operations, check ETH balance for gas fees (sponsorship disabled)
    if (isXaut && activeWalletAddress && ethereumPublicClient) {
      try {
        const ethBalance = await ethereumPublicClient.getBalance({
          address: activeWalletAddress as `0x${string}`
        });
        // Require at least 0.00005 ETH for gas
        const minEthRequired = parseUnits("0.00005", 18);
        if (ethBalance < minEthRequired) {
          console.log("[FLUID] Insufficient ETH for gas:", formatUnits(ethBalance, 18), "ETH");
          setShowEthAlert(true);
          return;
        }
      } catch (err) {
        console.error("[FLUID] ETH balance check failed:", err);
        // Continue anyway if balance check fails
      }
    }

    setIsProcessing(true);
    try {
      const tokenMeta = getTokenMetadata(modeConfig.tokenSymbol);
      if (!tokenMeta) throw new Error(`${modeConfig.tokenSymbol} metadata not found`);

      const tokenAddress = tokenMeta.address as `0x${string}`;
      const amountBigInt = parseUnits(String(transactionAmount), tokenMeta.decimals);

      let result;

      if (isXaut) {
        // Use Fluid protocol for XAUT
        if (mode === "borrow") {
          result = await fluid.borrow(amountBigInt);
        } else if (mode === "withdrawCollateral") {
          result = await fluid.withdraw(amountBigInt);
        } else if (mode === "addCollateral") {
          result = await fluid.supply(amountBigInt);
        } else if (mode === "repay") {
          result = await fluid.repay(amountBigInt);
        }
      } else {
        // Use Compound protocol for WBTC
        if (mode === "borrow" || mode === "withdrawCollateral") {
          // Borrow = withdraw USDT from Compound
          // Withdraw collateral = withdraw WBTC from Compound
          result = await compound.withdraw(tokenAddress, amountBigInt);
        } else {
          // Add collateral or repay = supply to Compound
          result = await compound.supply(tokenAddress, amountBigInt);
        }
      }

      if (result?.error) throw new Error(result.error);

      await Promise.all([refetchBalances(), refetchLoanData(), isXaut ? fluid.refetch() : Promise.resolve()]);

      // Show success toast based on mode
      const successMessages: Record<SimulatorMode, string> = {
        borrow: `Successfully borrowed ${formatCurrency(transactionAmount)}`,
        addCollateral: `Successfully added ${formatAmount(transactionAmount, 6)} ${collateralSymbol}`,
        repay: `Successfully repaid ${formatCurrency(transactionAmount)}`,
        withdrawCollateral: `Successfully withdrew ${formatAmount(transactionAmount, 6)} ${collateralSymbol}`,
        simulate: "",
      };
      if (successMessages[mode]) {
        showSuccessToast(successMessages[mode]);
      }

      setShowConfirmModal(false);

      // Reset input and call completion callback
      if (mode === "borrow") {
        setInputValue(String(parsedInput));
      } else {
        setInputValue("0");
      }

      onComplete?.();

      // Navigate to wallet for withdrawCollateral mode
      if (mode === "withdrawCollateral") {
        router.push("/wallet");
      }
    } catch (err) {
      console.error(`${operationMode} failed:`, err);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, transactionAmount, mode, modeConfig.tokenSymbol, compound, fluid, isXaut, refetchBalances, refetchLoanData, parsedInput, onComplete, collateralSymbol, router]);

  // Format display values based on mode
  const formatInputDisplay = useCallback((value: number) => {
    if (mode === "addCollateral") {
      return `${formatAmount(value, 8)} ${collateralSymbol}`;
    }
    return formatCurrency(value, 2);
  }, [mode, collateralSymbol]);

  return (
    <div className="flex flex-col gap-6">
      {/* LTV Gauge with Input */}
      <Card appearance="glassDark" padding="default">
        <SimulatorGauge
          currentLtv={currentResult.ltv}
          simulatedLtv={simulatedResult.ltv}
          maxLtv={maxLtv}
          liquidationRatio={liquidationRatio}
        />

        {/* Input Field */}
        <div className="mt-6">
          {mode === "simulate" ? (
            /* Sandbox Mode - Collateral Type Selector + Collateral Input + Borrow Slider */
            <div className="flex flex-col gap-6">
              {/* Collateral Type Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSandboxCollateralType("WBTC")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border flex-1 justify-center transition-all",
                    sandboxCollateralType === "WBTC"
                      ? "bg-amber-500/20 border-amber-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <TokenIcon symbol="WBTC" width={20} height={20} />
                  <span className="text-white/80 text-sm font-medium">WBTC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSandboxCollateralType("XAUT")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border flex-1 justify-center transition-all",
                    sandboxCollateralType === "XAUT"
                      ? "bg-amber-500/20 border-amber-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <TokenIcon symbol="XAUT" width={20} height={20} />
                  <span className="text-white/80 text-sm font-medium">XAUT</span>
                </button>
              </div>

              {/* Collateral Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={effectiveCollateralSymbol} width={24} height={24} />
                    <span className="text-white/70 text-sm">Collateral Amount ({effectiveCollateralSymbol})</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={sandboxCollateral}
                    onChange={(e) => setSandboxCollateral(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg",
                      "bg-white/5 border border-white/10",
                      "text-white font-semibold text-right pr-20",
                      "focus:outline-none focus:border-purple-500/50",
                      "placeholder:text-white/30"
                    )}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">{effectiveCollateralSymbol}</span>
                </div>
                <p className="text-white/40 text-xs mt-1 text-right">
                  ≈ {formatCurrency(parsedSandboxCollateral * getPrice(effectiveCollateralSymbol))}
                </p>
              </div>

              {/* Borrow Amount Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol="USDT" width={24} height={24} />
                    <span className="text-white/70 text-sm">Borrow Amount (USDT)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInputValue(String(maxBorrow))}
                    className="text-amber-500 text-xs hover:text-amber-400 transition-colors"
                  >
                    Max: {formatCurrency(maxBorrow, 0, "$", false)}
                  </button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center mb-3">
                  <span className="text-white font-semibold text-2xl">
                    {formatCurrency(parsedInput, 0, "$", false)}
                  </span>
                </div>
                <div className="px-1">
                  <input
                    type="range"
                    min="0"
                    max={maxBorrow || 1}
                    step={maxBorrow / 100 || 1}
                    value={parsedInput}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={maxBorrow <= 0}
                    className={cn(
                      "w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10",
                      "[&::-webkit-slider-thumb]:appearance-none",
                      "[&::-webkit-slider-thumb]:w-5",
                      "[&::-webkit-slider-thumb]:h-5",
                      "[&::-webkit-slider-thumb]:rounded-full",
                      "[&::-webkit-slider-thumb]:bg-amber-500",
                      "[&::-webkit-slider-thumb]:shadow-lg",
                      "[&::-webkit-slider-thumb]:border-2",
                      "[&::-webkit-slider-thumb]:border-white/20",
                      "[&::-moz-range-thumb]:w-5",
                      "[&::-moz-range-thumb]:h-5",
                      "[&::-moz-range-thumb]:rounded-full",
                      "[&::-moz-range-thumb]:bg-amber-500",
                      "[&::-moz-range-thumb]:border-2",
                      "[&::-moz-range-thumb]:border-white/20",
                      "disabled:opacity-50"
                    )}
                    style={{
                      background: maxBorrow > 0
                        ? `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) 100%)`
                        : "rgba(255,255,255,0.1)"
                    }}
                  />
                  <div className="flex justify-between text-white/40 text-xs mt-2">
                    <span>$0</span>
                    <span>{formatCurrency(maxBorrow, 0, "$", false)}</span>
                  </div>
                </div>
                {maxBorrow <= 0 && parsedSandboxCollateral === 0 && (
                  <p className="text-white/40 text-xs mt-2 text-center">
                    Enter collateral amount to enable borrowing
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={modeConfig.tokenSymbol} width={24} height={24} />
                  <span className="text-white/70 text-sm">{modeConfig.inputLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-amber-500 text-xs hover:text-amber-400 transition-colors"
                >
                  Max: {mode === "addCollateral" || mode === "withdrawCollateral"
                    ? `${formatAmount(maxBorrow, 6)} ${collateralSymbol}`
                    : formatCurrency(maxBorrow, 0, "$", false)
                  }
                </button>
              </div>

              {modeConfig.useSlider ? (
                /* Editable Input + Slider for withdrawCollateral */
                <div className="flex flex-col gap-4">
                  {/* Editable Amount Input */}
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg",
                        "bg-white/5 border border-white/10",
                        "text-white font-semibold text-2xl text-center",
                        "focus:outline-none focus:border-amber-500/50",
                        "placeholder:text-white/30"
                      )}
                      placeholder="0"
                      data-testid="simulator-input"
                    />
                    <p className="text-white/40 text-sm mt-1 text-center">
                      {mode === "repay" || mode === "borrow"
                        ? `≈ ${formatCurrency(parsedInput)} • USDT`
                        : `≈ ${formatCurrency(parsedInput * collateralPrice)} • ${collateralSymbol}`}
                    </p>
                  </div>

                  {/* Slider */}
                  <div className="px-1">
                    <input
                      type="range"
                      min="0"
                      max={maxBorrow}
                      step={maxBorrow / 100}
                      value={parsedInput}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer
                    bg-white/10
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-amber-500
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white/20
                    [&::-moz-range-thumb]:w-5
                    [&::-moz-range-thumb]:h-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-amber-500
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-white/20"
                      style={{
                        background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                      data-testid="simulator-slider"
                    />
                    <div className="flex justify-between text-white/40 text-xs mt-2">
                      <span>0 {collateralSymbol}</span>
                      <span>{formatAmount(maxBorrow, 4)} {collateralSymbol}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Input with optional Slider for borrow/repay */
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg",
                        "bg-white/5 border border-white/10",
                        "text-white font-semibold text-right pr-16",
                        "focus:outline-none focus:border-amber-500/50",
                        "placeholder:text-white/30"
                      )}
                      placeholder="0"
                      data-testid="simulator-input"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                      {mode === "addCollateral" ? collateralSymbol : "USD"}
                    </span>
                  </div>

                  {/* Slider for borrow, repay, and addCollateral modes */}
                  {(mode === "borrow" || mode === "repay" || mode === "addCollateral") && maxBorrow > 0 && (
                    <div className="px-1">
                      <input
                        type="range"
                        min={mode === "borrow" ? currentBorrowedAmount : 0}
                        max={maxBorrow}
                        step={maxBorrow / 100}
                        value={parsedInput}
                        onChange={(e) => setInputValue(e.target.value)}
                        className={cn(
                          "w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10",
                          "[&::-webkit-slider-thumb]:appearance-none",
                          "[&::-webkit-slider-thumb]:w-5",
                          "[&::-webkit-slider-thumb]:h-5",
                          "[&::-webkit-slider-thumb]:rounded-full",
                          "[&::-webkit-slider-thumb]:shadow-lg",
                          "[&::-webkit-slider-thumb]:border-2",
                          "[&::-webkit-slider-thumb]:border-white/20",
                          mode === "borrow"
                            ? "[&::-webkit-slider-thumb]:bg-amber-500"
                            : mode === "addCollateral"
                              ? "[&::-webkit-slider-thumb]:bg-purple-500"
                              : "[&::-webkit-slider-thumb]:bg-blue-500",
                          "[&::-moz-range-thumb]:w-5",
                          "[&::-moz-range-thumb]:h-5",
                          "[&::-moz-range-thumb]:rounded-full",
                          "[&::-moz-range-thumb]:border-2",
                          "[&::-moz-range-thumb]:border-white/20",
                          mode === "borrow"
                            ? "[&::-moz-range-thumb]:bg-amber-500"
                            : mode === "addCollateral"
                              ? "[&::-moz-range-thumb]:bg-purple-500"
                              : "[&::-moz-range-thumb]:bg-blue-500"
                        )}
                        style={{
                          background: mode === "borrow"
                            ? `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${((parsedInput - currentBorrowedAmount) / (maxBorrow - currentBorrowedAmount)) * 100}%, rgba(255,255,255,0.1) ${((parsedInput - currentBorrowedAmount) / (maxBorrow - currentBorrowedAmount)) * 100}%, rgba(255,255,255,0.1) 100%)`
                            : mode === "addCollateral"
                              ? `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) 100%)`
                              : `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) ${(parsedInput / maxBorrow) * 100}%, rgba(255,255,255,0.1) 100%)`
                        }}
                        data-testid="simulator-slider"
                      />
                      <div className="flex justify-between text-white/40 text-xs mt-2">
                        <span>
                          {mode === "borrow"
                            ? formatCurrency(currentBorrowedAmount, 0, "$", false)
                            : mode === "addCollateral"
                              ? `0 ${collateralSymbol}`
                              : "$0"}
                        </span>
                        <span>
                          {mode === "addCollateral"
                            ? `${formatAmount(maxBorrow, 4)} ${collateralSymbol}`
                            : formatCurrency(maxBorrow, 0, "$", false)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        {mode === "simulate" ? (
          /* Simulate mode - only Reset button, centered */
          <div className="flex justify-center mt-6">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 px-8",
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
          </div>
        ) : (
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
              onClick={handleApply}
              disabled={!hasChanges || transactionAmount <= 0}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4",
                "rounded-2xl border border-white/10 bg-white/5",
                "hover:bg-white/10 transition-colors",
                "disabled:opacity-40 disabled:hover:bg-white/5"
              )}
              data-testid="apply-button"
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border",
                mode === "borrow" || mode === "withdrawCollateral"
                  ? "bg-amber-500/20 border-amber-500/30"
                  : mode === "addCollateral"
                    ? "bg-purple-500/20 border-purple-500/30"
                    : "bg-blue-500/20 border-blue-500/30"
              )}>
                <svg
                  className={cn(
                    "w-5 h-5",
                    mode === "borrow" || mode === "withdrawCollateral" ? "text-amber-500" : mode === "addCollateral" ? "text-purple-400" : "text-blue-400"
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </div>
              <span className={cn(
                "text-sm",
                mode === "borrow" || mode === "withdrawCollateral" ? "text-amber-500" : mode === "addCollateral" ? "text-purple-400" : "text-blue-400"
              )}>
                {modeConfig.actionButtonText}
              </span>
            </button>
          </div>
        )}
      </Card>

      {/* Collateral Section */}
      {mode !== "simulate" && (
        <div>
          <h2 className="text-white text-sm font-medium uppercase tracking-wider mb-3">
            Collateral
          </h2>
          <Card appearance="glassDark" padding="default">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon symbol={collateralSymbol} width={48} height={48} />
                <div>
                  <p className="text-white font-semibold">{collateralName}</p>
                  <p className="text-white/50 text-sm">{collateralSymbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">
                  {formatAmount(mode === "addCollateral" ? simulatedCollateral : currentCollateralAmount, 4)} {collateralSymbol}
                </p>
                <p className="text-white/50 text-sm">
                  {formatCurrency((mode === "addCollateral" ? simulatedCollateral : currentCollateralAmount) * collateralPrice)}
                </p>
                {mode === "addCollateral" && parsedInput > 0 && (
                  <p className="text-green-400 text-xs mt-1">
                    +{formatAmount(parsedInput, 6)} {collateralSymbol}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

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

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isProcessing && !isApproving && setShowConfirmModal(false)}
        title={isProcessing || isApproving ? "Processing" : `Confirm ${modeConfig.title}`}
        icon={
          isProcessing || isApproving ? (
            <Loading />
          ) : (
            <TokenIcon symbol={modeConfig.tokenSymbol} width={56} height={56} />
          )
        }
        message={
          isProcessing ? (
            <Text tone="muted">
              Please confirm the transaction in your wallet.
            </Text>
          ) : isApproving ? (
            <Text tone="muted">
              Please approve token spending in your wallet.
            </Text>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Amount Display */}
              <div className="rounded-2xl p-4 border border-white/20">
                <p className="text-white/50 text-sm mb-1">{modeConfig.title} Amount</p>
                <p className="text-3xl font-bold text-white">
                  {formatInputDisplay(transactionAmount)}
                </p>
                <p className="text-white/40 text-sm mt-1">{modeConfig.tokenSymbol}</p>
              </div>

              {/* Summary based on mode */}
              {mode === "borrow" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Current Borrowed</span>
                    <span className="text-white">{formatCurrency(currentBorrowedAmount, 2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">New Total</span>
                    <span className="text-amber-400 font-semibold">{formatCurrency(parsedInput, 2)}</span>
                  </div>
                </div>
              )}

              {mode === "addCollateral" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Current Collateral</span>
                    <span className="text-white">{formatAmount(currentCollateralAmount, 4)} {collateralSymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">New Total</span>
                    <span className="text-emerald-400 font-semibold">{formatAmount(simulatedCollateral, 4)} {collateralSymbol}</span>
                  </div>
                </div>
              )}

              {mode === "repay" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Current Borrowed</span>
                    <span className="text-white">{formatCurrency(currentBorrowedAmount, 2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Remaining Debt</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(simulatedBorrow, 2)}</span>
                  </div>
                </div>
              )}

              {mode === "withdrawCollateral" && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Current Collateral</span>
                    <span className="text-white">{formatAmount(currentCollateralAmount, 4)} {collateralSymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Remaining Collateral</span>
                    <span className="text-amber-400 font-semibold">{formatAmount(simulatedCollateral, 4)} {collateralSymbol}</span>
                  </div>
                </div>
              )}

              {/* Warning/Success Banner */}
              <div className={cn(
                "rounded-xl px-4 py-3 flex items-start gap-3",
                modeConfig.successIcon
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-amber-500/10 border border-amber-500/30"
              )}>
                {modeConfig.successIcon ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className={cn(
                  "text-sm",
                  modeConfig.successIcon ? "text-emerald-400" : "text-amber-400"
                )}>
                  {modeConfig.warningText}
                </p>
              </div>
            </div>
          )
        }
        primaryButtonText={
          isProcessing
            ? "Processing..."
            : isApproving
              ? "Approving..."
              : needsApproval
                ? "Approve & Continue"
                : modeConfig.actionButtonText
        }
        primaryButtonAction={needsApproval ? handleApprove : handleConfirm}
        secondaryButtonText="Cancel"
        secondaryButtonAction={() => setShowConfirmModal(false)}
        showCloseButton={!isProcessing && !isApproving}
        showActionButtons={!isProcessing && !isApproving}
      />

      {/* ETH Alert Modal - shown when insufficient ETH for Fluid operations */}
      <Modal
        isOpen={showEthAlert}
        onClose={() => setShowEthAlert(false)}
        title="ETH Required for Gas"
        icon={
          <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
        }
        message={
          <div className="flex flex-col gap-4">
            <Text tone="muted">
              ETH balance required during Beta testing. Gas sponsorship is temporarily disabled for Ethereum mainnet operations.
            </Text>
            <div className="rounded-xl px-4 py-3 bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-400 text-sm">
                Please add at least 0.00005 ETH to your wallet to cover gas fees for this transaction.
              </p>
            </div>
          </div>
        }
        primaryButtonText="Get ETH"
        primaryButtonAction={() => {
          setShowEthAlert(false);
          router.push("/wallet/cash-in");
        }}
        secondaryButtonText="Cancel"
        secondaryButtonAction={() => setShowEthAlert(false)}
        showCloseButton={true}
        showActionButtons={true}
      />
    </div>
  );
}
