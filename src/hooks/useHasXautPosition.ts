import { useFluid } from "@/hooks/useFluid";
import { useXautBalance } from "@/hooks/useXautBalance";

interface UseHasXautPositionResult {
  /** True if user has XAUT in Fluid or wallet */
  hasXautPosition: boolean;
  /** True if either hook is still loading */
  isLoading: boolean;
}

/**
 * Hook to detect whether a user has any XAUT position.
 *
 * A position is detected if:
 * - XAUT exists in Fluid suppliedAssets with amount > 0, OR
 * - xautBalance > 0 (wallet balance)
 *
 * @returns { hasXautPosition: boolean, isLoading: boolean }
 */
export function useHasXautPosition(): UseHasXautPositionResult {
  const fluid = useFluid();
  const xautBalance = useXautBalance();

  // Check if XAUT is in Fluid supplied assets with amount > 0
  const xautInFluid = fluid.suppliedAssets.find(
    (asset) => asset.symbol === "XAUT" && asset.amount > 0
  );

  // Check if XAUT is in wallet balance
  const xautInWallet = xautBalance.xautBalance > 0;

  // Has position if either condition is true
  const hasXautPosition = Boolean(xautInFluid) || xautInWallet;

  // Loading if either hook is loading
  const isLoading = fluid.isLoading || xautBalance.isLoading;

  return {
    hasXautPosition,
    isLoading,
  };
}
