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

  const calculateTotalUsd = (assets: Asset[]) => assets.reduce((sum, asset) => sum + asset.amount * getPrice(asset.symbol), 0);

  const totalSuppliedUsd = calculateTotalUsd(suppliedAssets);
  const totalBorrowedUsd = calculateTotalUsd(borrowedAssets);

  // Current calculations
  const ltv = totalSuppliedUsd > 0 ? (totalBorrowedUsd / totalSuppliedUsd) * 100 : 0;
  const borrowableAmount = Math.max(0, totalSuppliedUsd * (maxLtv / 100) - totalBorrowedUsd);
  const liquidationPrice = totalBorrowedUsd > 0 ? totalBorrowedUsd * (100 / liquidationRatio) : 0;
  const borrowCapacity = totalSuppliedUsd * (maxLtv / 100);
  const liquidationPoint = totalSuppliedUsd * (liquidationRatio / 100);

  // Preview calculations
  const newBorrowValue = previewBorrowAmount * getPrice("USDT");
  const newTotalBorrow = totalBorrowedUsd + newBorrowValue;
  const newLtv = totalSuppliedUsd > 0 ? (newTotalBorrow / totalSuppliedUsd) * 100 : 0;
  const effectiveNewLtv = Math.min(newLtv, maxLtv);
  const borrowableAmountNew = Math.max(0, totalSuppliedUsd * (maxLtv / 100) - newTotalBorrow);

  // Formatted values for display
  const wbtc = totalSuppliedUsd;
  const usdt = [totalBorrowedUsd, newTotalBorrow];
  const borrowable = [borrowableAmount, borrowableAmountNew];
  const ltvRange = [ltv, effectiveNewLtv];
  const netLoanValue = totalSuppliedUsd - totalBorrowedUsd;


  return {
    ltv,
    borrowableAmount,
    liquidationPrice,
    netLoanValue,
    wbtc,
    usdt,
    borrowable,
    ltvRange,
    maxLtv,
    borrowCapacity,
    liquidationRatio,
    liquidationPoint,
    borrowApr,
  };
};
