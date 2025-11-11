"use client";

import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { getTokenMetadata } from "@/constants/Tokens";
import { useCompound } from "@/hooks/useCompound";
import { useLoanCalculations } from "@/hooks/useLoanCalculations";
import { useLoanCalculationsContext } from "@/providers/LoanCalculationsProvider";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { maxUint256, parseUnits } from "viem";

export type TxMode = "borrow" | "repay";

export function useTxMode(mode: TxMode = "borrow") {
  const [amount, setAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewAmount, setPreviewAmount] = useState(0);

  const { suppliedAssets, borrowedAssets, approve, supply, withdraw, allowance } = useCompound();
  const { assets, refetchBalances } = useWalletBalanceContext();
  const { refetchLoanData } = useLoanCalculationsContext();
  const getPrice = useGetTokenPrice();
  const autoAttempted = useRef(false);

  const router = useRouter();

  const { borrowableAmount } = useLoanCalculations(suppliedAssets, borrowedAssets, previewAmount);
  const usdtPrice = getPrice("USDT") || 1;
  const availableForBorrow = borrowableAmount / usdtPrice;
  const availableForRepay = assets.find((a) => a.symbol === "USDT")?.amount || 0; // USDT balance in wallet
  const borrowedAmount = borrowedAssets.find((a) => a.symbol === "USDT")?.amount || 0;
  const maxRepay = Math.min(availableForRepay, borrowedAmount); // Max repayable amount
  const available = mode === "repay" ? maxRepay : availableForBorrow; // Max amount user can transact

  useEffect(() => {
    const t = setTimeout(() => {
      if (mode === "repay") {
        const capped = Math.min(amount, borrowedAmount);
        setPreviewAmount(-capped);
      } else {
        setPreviewAmount(amount);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [amount, mode, borrowedAmount]);

  const handleMax = useCallback(() => {
    setAmount(available);
    setPreviewAmount(mode === "repay" ? -available : available);
  }, [available, mode]);

  const handleAction = useCallback(async () => {
    if (isProcessing || amount <= 0) return;

    setIsProcessing(true);
    try {
      const tokenMeta = getTokenMetadata("USDT");
      if (!tokenMeta) throw new Error("USDT metadata not found");

      const tokenAddress = tokenMeta.address as `0x${string}`;
      const amountBigInt = parseUnits(String(amount), tokenMeta.decimals);

      if (mode === "repay") {
        const bufferAmount = parseUnits("1", tokenMeta.decimals); // 1 USDT buffer
        const approvalAmount = amountBigInt + bufferAmount;

        // Check allowance and approve only if needed
        const currentAllowance = allowance ? await allowance(tokenAddress) : null;
        if (currentAllowance === null || currentAllowance < approvalAmount) {
          const approveResult = await approve(tokenAddress, approvalAmount);
          if (approveResult.error) throw new Error(approveResult.error);
        }

        // Use maxUint256 when repaying max available amount
        const repayAmount = amount >= available ? maxUint256 : amountBigInt;
        const supplyResult = await supply(tokenAddress, repayAmount);
        if (supplyResult.error) throw new Error(supplyResult.error);
      } else {
        const result = await withdraw(tokenAddress, amountBigInt);
        if (result.error) throw new Error(result.error);
      }

      await Promise.all([refetchBalances(), refetchLoanData()]);
      router.push("/wallet");
    } catch (err) {
      console.error(`${mode} failed:`, err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [amount, isProcessing, mode, approve, supply, withdraw, refetchBalances, refetchLoanData, router, allowance, available]);

  useEffect(() => {
    if (!autoAttempted.current) autoAttempted.current = true;
  }, []);

  const tokenSymbol = getTokenMetadata("USDT")?.symbol;
  const action = mode === "repay" ? "Repay" : "Borrow";
  const title = `${action} ${tokenSymbol}`;
  const btnText = `${action} ${tokenSymbol}`;
  const warning = mode === "repay" ? "" : "Borrowing this amount will increase your LTV and the risk of liquidation";

  return {
    amount,
    setAmount,
    isProcessing,
    previewAmount,
    available,
    handleMax,
    handleAction,
    title,
    btnText,
    warning,
    availableForRepay,
  } as const;
}

export default useTxMode;
