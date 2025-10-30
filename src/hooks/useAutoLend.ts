import { getTokenMetadata } from "@/constants/Tokens";
import { useCompound } from "@/hooks/useCompound";
import { useCallback, useRef, useState } from "react";
import { parseUnits } from "viem";

interface UseAutoLendProps {
  wbtcBalance: number;
  onError?: (error: Error) => void;
}

export function useAutoLend({ wbtcBalance, onError }: UseAutoLendProps) {
  const [lendProcessing, setLendProcessing] = useState(false);
  const { approve, supply, allowance } = useCompound();

  const runningRef = useRef(false);
  const lastBalanceRef = useRef<number>(0);

  const startLend = useCallback(async (): Promise<boolean> => {

    runningRef.current = true;
    setLendProcessing(true);

    try {
      const tokenMeta = getTokenMetadata("WBTC");
      if (!tokenMeta) throw new Error("WBTC metadata not found");

      const amountBigInt = parseUnits(wbtcBalance.toString(), tokenMeta.decimals);

      // Check allowance and approve only if needed
      const currentAllowance = allowance ? await allowance(tokenMeta.address as `0x${string}`) : null;
      if (currentAllowance === null || currentAllowance < amountBigInt) {
        const approveResult = await approve(tokenMeta.address as `0x${string}`, amountBigInt);
        if (approveResult?.error) throw new Error(`Approval failed: ${approveResult.error}`);
      }

      const supplyResult = await supply(tokenMeta.address as `0x${string}`, amountBigInt);
      if (supplyResult?.error) throw new Error(`Supply failed: ${supplyResult.error}`);

      lastBalanceRef.current = wbtcBalance;
      return true;
    } catch (err) {
      console.error("Lend failed:", err);
      onError?.(err as Error);
      return false;
    } finally {
      runningRef.current = false;
      setLendProcessing(false);
    }
  }, [wbtcBalance, approve, supply, onError, allowance]);

  return { lendProcessing, startLend };
}