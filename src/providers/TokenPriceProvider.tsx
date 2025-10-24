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

export const TokenPriceProvider: React.FC<TokenPriceProviderProps> = ({ children }) => {
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});

  const fetchTokenPrices = useCallback(async () => {
    try {
      const prices: TokenPrices = {};
      const fetchPromises = Object.entries(TOKEN_METADATA).map(async ([tokenSymbol, { coingeckoSymbol }]) => {
        const response = await fetch(`https://bv2cfyq9q7.execute-api.us-east-1.amazonaws.com/token_price/${coingeckoSymbol}/usd`);
        if (response.ok) {
          const data = await response.json();
          if (data[coingeckoSymbol]) {
            prices[tokenSymbol] = { usd: data[coingeckoSymbol].usd };
          }
        }
      });
      await Promise.all(fetchPromises);
      setTokenPrices(prices);
    } catch (error) {
      console.error("Error fetching token prices:", error);
    }
  }, []);

  const refetchTokenPrices = useCallback(() => {
    return fetchTokenPrices();
  }, [fetchTokenPrices]);

  useEffect(() => {
    fetchTokenPrices();

    const interval = setInterval(fetchTokenPrices, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTokenPrices]);

  return <TokenPriceContext.Provider value={{ tokenPrices, refetchTokenPrices }}>{children}</TokenPriceContext.Provider>;
};
