import { getTokenMetadata } from "@/constants/Tokens";
import { useCompound } from "@/hooks/useCompound";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseUnits } from "viem";

interface UseAutoLendProps {
  mode: "borrow" | "repay";
  wbtcBalance: number;
  onError?: (error: Error) => void;
}

export function useAutoLend({ mode, wbtcBalance, onError }: UseAutoLendProps) {
  const [lendProcessing, setLendProcessing] = useState(false);
  const { approve, supply, refetch } = useCompound();

  const runningRef = useRef(false);
  const lastBalanceRef = useRef<number>(0);

  const lendOnLoad = useCallback(async () => {
    // only auto-lend in borrow mode and when there's a positive WBTC balance
    if (mode !== "borrow" || wbtcBalance <= 0) return;

    if (runningRef.current) return;
    if (lastBalanceRef.current === wbtcBalance) return;

    runningRef.current = true;
    setLendProcessing(true);

    try {
      const tokenMeta = getTokenMetadata("WBTC");
      if (!tokenMeta) throw new Error("WBTC metadata not found");

      const amountBigInt = parseUnits(wbtcBalance.toString(), tokenMeta.decimals);

      const approveResult = await approve(tokenMeta.address as `0x${string}`, amountBigInt);
      if (approveResult.error) throw new Error(`Approval failed: ${approveResult.error}`);

      const supplyResult = await supply(tokenMeta.address as `0x${string}`, amountBigInt);
      if (supplyResult.error) throw new Error(`Supply failed: ${supplyResult.error}`);

      await refetch();

      lastBalanceRef.current = wbtcBalance;
    } catch (err) {
      console.error("Lend failed:", err);
      onError?.(err as Error);
    } finally {
      runningRef.current = false;
      setLendProcessing(false);
    }
  }, [mode, wbtcBalance, approve, supply, refetch, onError]);

  useEffect(() => {
    lendOnLoad();
  }, [lendOnLoad]);

  return { lendProcessing };
}