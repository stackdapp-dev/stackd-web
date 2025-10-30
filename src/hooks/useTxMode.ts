"use client";

import { getTokenMetadata } from "@/constants/Tokens";
import { useCompound } from "@/hooks/useCompound";
import { useLoanCalculations } from "@/hooks/useLoanCalculations";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseUnits } from "viem";

export type TxMode = "borrow" | "repay";

export function useTxMode(mode: TxMode = "borrow") {
  const [amount, setAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewAmount, setPreviewAmount] = useState(0);

  const { suppliedAssets, borrowedAssets, approve, supply, withdraw, refetch, allowance } = useCompound();
  const { tokenBalances, refetchBalances } = useWalletBalance();
  const getPrice = useGetTokenPrice();
  const autoAttempted = useRef(false);

  const router = useRouter();

  const { borrowableAmount } = useLoanCalculations(suppliedAssets, borrowedAssets, previewAmount);

  const usdtPrice = getPrice("USDT") || 1;
  const availableForBorrow = borrowableAmount / usdtPrice;
  const availableForRepay = tokenBalances["USDT"]?.balance || 0;
  const borrowedAmount = borrowedAssets.find((a) => a.symbol === "USDT")?.amount || 0;
  const available = mode === "repay" ? availableForRepay : availableForBorrow;

  useEffect(() => {
    const t = setTimeout(() => {
      const parsed = amount || 0;
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
      setAmount(maxRepay);
      setPreviewAmount(-maxRepay);
    } else {
      setAmount(available);
      setPreviewAmount(available);
    }
  }, [available, mode, availableForRepay, borrowedAmount]);

  const handleAction = useCallback(async () => {
    if (isProcessing) return;
    const amt = amount || 0;
    if (amt <= 0) return;

    setIsProcessing(true);
    try {
      const tokenMeta = getTokenMetadata("USDT");
      if (!tokenMeta) throw new Error("USDT metadata not found");

      const amountBigInt = parseUnits(String(amt), tokenMeta.decimals);

      if (mode === "repay") {
        // Check allowance and approve only if needed
        const currentAllowance = allowance ? await allowance(tokenMeta.address as `0x${string}`) : null;
        if (currentAllowance === null || currentAllowance < amountBigInt) {
          const approveResult = await approve(tokenMeta.address as `0x${string}`, amountBigInt);
          if (approveResult.error) throw new Error(approveResult.error);
        }

        const supplyResult = await supply(tokenMeta.address as `0x${string}`, amountBigInt);
        if (supplyResult.error) throw new Error(supplyResult.error);
      } else {
        // borrow -> represented by withdraw in this protocol
        const result = await withdraw(tokenMeta.address as `0x${string}`, amountBigInt);
        if (result.error) throw new Error(result.error);
      }

      await Promise.all([refetchBalances(), refetch()]);
      router.push("/wallet");
    } catch (err) {
      console.error(`${mode} failed:`, err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [amount, isProcessing, mode, approve, supply, withdraw, refetchBalances, refetch, router, allowance]);

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
