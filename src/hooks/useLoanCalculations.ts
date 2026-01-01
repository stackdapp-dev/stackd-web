import { useCompound } from "@/hooks/useCompound";
import { useGetTokenPrice } from "@/providers/TokenPriceProvider";

type Asset = {
  symbol: string;
  amount: number;
  usdValue: number;
  decimals: number;
};

export const useLoanCalculations = (suppliedAssets: Asset[], borrowedAssets: Asset[], previewBorrowAmount: number = 0) => {
  const { maxLtv, liquidationRatio, borrowApr } = useCompound();
  const getPrice = useGetTokenPrice();

  const totalSuppliedUsd = suppliedAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
  const totalBorrowedUsd = borrowedAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
  const wbtcCollateral = suppliedAssets.find((a) => a.symbol === "WBTC")?.amount || 0;

  // Current calculations
  const ltv = totalSuppliedUsd > 0 ? (totalBorrowedUsd / totalSuppliedUsd) * 100 : 0;
  const borrowableAmount = Math.max(0, totalSuppliedUsd * (maxLtv / 100) - totalBorrowedUsd);
  // Liquidation price = BTC price at which liquidation would occur
  // Formula: (borrowedUsd / liquidationRatio) / collateralWbtc
  const liquidationCollateralValue = totalBorrowedUsd / (liquidationRatio / 100);
  const liquidationPrice = wbtcCollateral > 0 && totalBorrowedUsd > 0
    ? liquidationCollateralValue / wbtcCollateral
    : 0;
  const borrowCapacity = totalSuppliedUsd * (maxLtv / 100);
  const liquidationPoint = totalBorrowedUsd > 0 ? totalBorrowedUsd / (liquidationRatio / 100) : 0;

  // Preview calculations
  const newBorrowValue = previewBorrowAmount * getPrice("USDT");
  const newTotalBorrow = Math.max(0, totalBorrowedUsd + newBorrowValue);
  const newLtv = totalSuppliedUsd > 0 ? (newTotalBorrow / totalSuppliedUsd) * 100 : 0;
  const newEffectiveLTV = Math.min(newLtv, maxLtv);
  const newBorrowableAmount = Math.max(0, totalSuppliedUsd * (maxLtv / 100) - newTotalBorrow);
  const newLiquidationPoint = newTotalBorrow > 0 ? newTotalBorrow / (liquidationRatio / 100) : 0;

  // Formatted values for display
  const wbtc = totalSuppliedUsd;
  const usdt = [totalBorrowedUsd, newTotalBorrow];
  const borrowable = [borrowableAmount, newBorrowableAmount];
  const ltvRange = [ltv, newEffectiveLTV];
  const liquidationRange = [liquidationPoint, newLiquidationPoint];
  const netLoanValue = totalSuppliedUsd - totalBorrowedUsd;
  const hasBorrowed = borrowedAssets.some((b) => b.symbol === "USDT" && b.amount > 0);

  return {
    ltv,
    borrowableAmount,
    liquidationPrice,
    borrowCapacity,
    liquidationRange,
    wbtc,
    usdt,
    borrowable,
    ltvRange,
    netLoanValue,
    hasBorrowed,
    maxLtv,
    liquidationRatio,
    borrowApr,
    suppliedAssets,
    borrowedAssets,
  };
};
