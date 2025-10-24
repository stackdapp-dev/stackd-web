import { getTokenMetadata } from "@/constants/Tokens";
import { useCompound } from "@/hooks/useCompound";
import { formatCurrency, formatPercent } from "@/lib/utils";
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

  const ltv = totalSuppliedUsd > 0 ? (totalBorrowedUsd / totalSuppliedUsd) * 100 : 0;
  const borrowAprValue = borrowApr;
  const borrowableAmount = Math.max(0, totalSuppliedUsd * (maxLtv / 100) - totalBorrowedUsd);
  const liquidationPrice = totalBorrowedUsd > 0 ? totalBorrowedUsd * (100 / liquidationRatio) : 0;

  // Preview calculations
  const newBorrowValue = previewBorrowAmount * getPrice("USDT");
  const newTotalBorrow = totalBorrowedUsd + newBorrowValue;
  const newLtv = totalSuppliedUsd > 0 ? (newTotalBorrow / totalSuppliedUsd) * 100 : 0;
  const effectiveNewLtv = Math.min(newLtv, maxLtv);

  // Formatted display values
  const wbtcValue = formatCurrency(totalSuppliedUsd, 0);
  const usdtRange = `${formatCurrency(totalBorrowedUsd, 0)} → ${formatCurrency(newTotalBorrow, 0)}`;
  const ltvRange = `${formatPercent(ltv, 1)} → ${formatPercent(effectiveNewLtv, 1)}`;
  const maxLtvValue = formatPercent(maxLtv, 1);
  const liquidationRatioValue = formatPercent(liquidationRatio, 1);
  const borrowAprValueStr = formatPercent(borrowAprValue, 2);
  const netLoanValue = totalSuppliedUsd - totalBorrowedUsd;

  const txItems = [
    { key: "wbtc", icon: "WBTC", label: "WBTC Collateral", value: wbtcValue, split: false },
    { key: "usdt", icon: "USDT", label: `${getTokenMetadata("USDT")?.symbol || "USDT"} Loan`, value: usdtRange, split: false },
    { key: "ltv", label: "Loan-to-Value ratio", value: ltvRange, split: true },
    { key: "maxLtv", label: "Max LTV", value: maxLtvValue, split: true },
    { key: "liq", label: "Liquidation ratio", value: liquidationRatioValue, split: true },
    { key: "apr", label: "Borrow APR", value: borrowAprValueStr, split: true },
  ];

  return {
    ltv,
    borrowAprValue,
    borrowableAmount,
    liquidationPrice,
    txItems,
    netLoanValue,
  };
};
