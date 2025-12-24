"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

export const TokenPriceProvider: React.FC<TokenPriceProviderProps> = ({ children }) => {
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});

  const fetchTokenPrices = useCallback(async () => {
    try {
      // Use our local API route to avoid CORS issues
      const response = await fetch("/api/token-prices");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const prices = await response.json();
      console.log("[TokenPrice] Prices from API:", prices);
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

    // Refresh every 60 seconds
    const interval = setInterval(fetchTokenPrices, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTokenPrices]);

  return <TokenPriceContext.Provider value={{ tokenPrices, refetchTokenPrices }}>{children}</TokenPriceContext.Provider>;
};


