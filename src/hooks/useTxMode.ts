"use client";

import { getTokenMetadata } from "@/constants/Tokens";
import { useCompound } from "@/hooks/useCompound";
import { useLoanCalculations } from "@/hooks/useLoanCalculations";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseUnits } from "viem";

export type TxMode = "borrow" | "repay";

export function useTxMode(mode: TxMode = "borrow") {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewAmount, setPreviewAmount] = useState(0);

  const { suppliedAssets, borrowedAssets, approve, supply, withdraw, refetch } = useCompound();
  const { tokenBalances, refetchBalances } = useWalletBalance();
  const getPrice = useGetTokenPrice();
  const autoAttempted = useRef(false);

  const { borrowableAmount } = useLoanCalculations(suppliedAssets, borrowedAssets, previewAmount);
  
  // compute available based on mode
  const usdtPrice = getPrice("USDT") || 1;
  const availableForBorrow = borrowableAmount / (usdtPrice || 1);

  const availableForRepay = tokenBalances["USDT"]?.balance || 0;
  const borrowedToken = borrowedAssets.find((a) => a.symbol === "USDT");
  const borrowedAmount = borrowedToken?.amount || 0;

  const available = mode === "repay" ? availableForRepay : availableForBorrow;

  useEffect(() => {
    const t = setTimeout(() => {
      const parsed = parseFloat(amount) || 0;
      if (mode === "repay") {
        const capped = Math.min(parsed, borrowedAmount);
        setPreviewAmount(-capped);
      } else {
        setPreviewAmount(parsed);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [amount, mode, borrowedAmount]);

  const handleMax = useCallback(() => {
    if (mode === "repay") {
      const maxRepay = Math.min(availableForRepay, borrowedAmount);
      setAmount(String(maxRepay));
      setPreviewAmount(-maxRepay);
    } else {
      setAmount(String(available));
      setPreviewAmount(available);
    }
  }, [available, mode, availableForRepay, borrowedAmount]);

  const handleAction = useCallback(async () => {
    if (isProcessing) return;
    const amt = parseFloat(amount || "0");
    if (amt <= 0) return;

    setIsProcessing(true);
    try {
      const tokenMeta = getTokenMetadata("USDT");
      if (!tokenMeta) throw new Error("USDT metadata not found");

      const amountBigInt = parseUnits(String(amt), tokenMeta.decimals);

      if (mode === "repay") {
        // approve + supply
        const approveResult = await approve(tokenMeta.address as `0x${string}`, amountBigInt);
        if (approveResult.error) throw new Error(approveResult.error);

        const supplyResult = await supply(tokenMeta.address as `0x${string}`, amountBigInt);
        if (supplyResult.error) throw new Error(supplyResult.error);
      } else {
        // borrow -> represented by withdraw in this protocol
        const result = await withdraw(tokenMeta.address as `0x${string}`, amountBigInt);
        if (result.error) throw new Error(result.error);
      }

      await Promise.all([refetchBalances(), refetch()]);
      setAmount("");
    } catch (err) {
      console.error(`${mode} failed:`, err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [amount, isProcessing, mode, approve, supply, withdraw, refetchBalances, refetch]);

  useEffect(() => {
    if (!autoAttempted.current) autoAttempted.current = true;
  }, []);

  const title = mode === "repay" ? `Repay ${getTokenMetadata("USDT")?.symbol }` : `Borrow ${getTokenMetadata("USDT")?.symbol}`;
  const btnText = mode === "repay" ? `Repay ${getTokenMetadata("USDT")?.symbol}` : `Borrow ${getTokenMetadata("USDT")?.symbol}`;
  const warning = mode === "repay" ? "Repaying will reduce outstanding borrow and change LTV." : "Borrowing this amount will reduce your health factor and increase risk of liquidation.";

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
  } as const;
}

export default useTxMode;
