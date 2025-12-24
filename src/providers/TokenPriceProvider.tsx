"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TOKEN_METADATA } from "../constants/Tokens";

type TokenPrices = Record<string, { usd: number }>;

interface TokenPriceContextType {
  tokenPrices: TokenPrices;
  refetchTokenPrices: () => Promise<void>;
}

const TokenPriceContext = createContext<TokenPriceContextType | undefined>(undefined);

export const useTokenPrices = () => {
  const context = useContext(TokenPriceContext);
  if (!context) {
    throw new Error("useTokenPrices must be used within TokenPriceProvider");
  }
  return context;
};

/**
 * Hook to get a price getter function
 */
export const useGetTokenPrice = () => {
  const { tokenPrices } = useTokenPrices();
  return (symbol: string) => tokenPrices?.[symbol as keyof typeof tokenPrices]?.usd || 0;
};

interface TokenPriceProviderProps {
  children: React.ReactNode;
}

// CoinGecko API ID mapping
const COINGECKO_IDS: Record<string, string> = {
  WBTC: "bitcoin",      // WBTC tracks BTC price
  USDT: "tether",
  ETH: "ethereum",
};

// CoinGecko free public API (no API key required)
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";

export const TokenPriceProvider: React.FC<TokenPriceProviderProps> = ({ children }) => {
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});

  const fetchTokenPrices = useCallback(async () => {
    try {
      // Get all CoinGecko IDs from our tokens
      const tokenSymbols = Object.keys(TOKEN_METADATA);
      const coinIds = tokenSymbols
        .map(symbol => COINGECKO_IDS[symbol])
        .filter(Boolean)
        .join(",");

      if (!coinIds) {
        console.error("[TokenPrice] No valid CoinGecko IDs found");
        return;
      }

      // Fetch all prices in a single request
      const response = await fetch(
        `${COINGECKO_API_URL}?ids=${coinIds}&vs_currencies=usd`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[TokenPrice] CoinGecko response:", data);

      // Map CoinGecko response to our token symbols
      const prices: TokenPrices = {};
      for (const symbol of tokenSymbols) {
        const coinId = COINGECKO_IDS[symbol];
        if (coinId && data[coinId]?.usd) {
          prices[symbol] = { usd: data[coinId].usd };
        }
      }

      console.log("[TokenPrice] Mapped prices:", prices);
      setTokenPrices(prices);
    } catch (error) {
      console.error("[TokenPrice] Error fetching prices:", error);
    }
  }, []);

  const refetchTokenPrices = useCallback(() => {
    return fetchTokenPrices();
  }, [fetchTokenPrices]);

  useEffect(() => {
    fetchTokenPrices();

    // CoinGecko free tier allows ~10-30 requests/minute, so 60s refresh is safe
    const interval = setInterval(fetchTokenPrices, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTokenPrices]);

  return <TokenPriceContext.Provider value={{ tokenPrices, refetchTokenPrices }}>{children}</TokenPriceContext.Provider>;
};

