"use client";

import { useState, useEffect, useCallback } from "react";
import { useTokenPrices } from "@/providers/TokenPriceProvider";

interface PriceHistoryData {
  price24hAgo: number;
  price7dAgo: number;
  price30dAgo: number;
}

interface PriceHistory {
  data: Record<string, PriceHistoryData | null>;
  isLoading: boolean;
}

/**
 * Hook to get historical price data for tokens.
 * For now, this derives historical prices from current prices and 24h change percentage.
 * In a production environment, this would fetch from a price history API.
 */
export function usePriceHistory(): PriceHistory {
  const { tokenPrices } = useTokenPrices();

  // Derive historical prices from current prices and 24h change
  // This is a simplified approach - in production, we'd fetch actual historical data
  const calculateHistoricalPrices = useCallback((): PriceHistory => {
    if (!tokenPrices || Object.keys(tokenPrices).length === 0) {
      return { data: {}, isLoading: true };
    }

    const data: Record<string, PriceHistoryData | null> = {};

    Object.entries(tokenPrices).forEach(([symbol, priceData]) => {
      if (!priceData) {
        data[symbol] = null;
        return;
      }

      const currentPrice = priceData.usd ?? 0;
      const change24h = (priceData as Record<string, number>).usd_24h_change ?? 0;

      // Calculate price 24h ago based on current price and 24h change
      // If price went up 5%, then price24hAgo = currentPrice / 1.05
      const price24hAgo = change24h !== 0
        ? currentPrice / (1 + change24h / 100)
        : currentPrice;

      // Estimate 7d and 30d prices (simplified - in production use actual API data)
      // Using multipliers that simulate typical volatility
      const price7dAgo = price24hAgo * 0.98;  // ~2% difference from 24h
      const price30dAgo = price24hAgo * 0.95; // ~5% difference from 24h

      data[symbol] = {
        price24hAgo,
        price7dAgo,
        price30dAgo,
      };
    });

    return { data, isLoading: false };
  }, [tokenPrices]);

  const [priceHistory, setPriceHistory] = useState<PriceHistory>({ data: {}, isLoading: true });

  useEffect(() => {
    const history = calculateHistoricalPrices();
    setPriceHistory(history);
  }, [calculateHistoricalPrices]);

  return priceHistory;
}
