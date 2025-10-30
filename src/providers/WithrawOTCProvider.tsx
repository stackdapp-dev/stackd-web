"use client";

import { getTokenMetadata, TOKEN_ADDRESSES } from "@/constants/Tokens";
import { getExchangeRate, RateData } from "@/lib/api/rates";
import { UserPaymentMethodInput } from "@/lib/api/user";
import { useWeb3 } from "@/providers/Web3Provider";
import { useWallets } from "@privy-io/react-auth";
import { createContext, useContext, useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";

type WithdrawOTCValue = {
  exchangeRate: RateData | undefined;
  amount: string;
  setAmount: (amount: string) => void;
  convertedAmount: string;
  isValidAmount: boolean;
  available: number; // available USDT to withdraw
  handleMax: () => void;
  paymentMethod: UserPaymentMethodInput | string | null;
  setPaymentMethod: (paymentMethod: UserPaymentMethodInput | string) => void;
};

const WithdrawOTCContext = createContext<WithdrawOTCValue | undefined>(
  undefined
);

export const WithdrawOTCProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [isValidAmount, setIsValidAmount] = useState<boolean>(false);
  const [available, setAvailable] = useState<number>(0);
  const [handleMax] = useState<() => void>(() => () => {});
  const [exchangeRate, setExchangeRate] = useState<RateData | undefined>(
    undefined
  );
  const [paymentMethod, setPaymentMethod] = useState<
    UserPaymentMethodInput | string | null
  >(null);

  const { publicClient } = useWeb3();
  const { wallets } = useWallets();
  const walletAddress = wallets.length > 0 ? wallets[0].address : undefined;

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getExchangeRate("USDT", "PHP");
        setExchangeRate(rate);
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    if (!publicClient || !walletAddress) return;

    const fetchUSDTBalance = async () => {
      const balance = await publicClient.readContract({
        abi: erc20Abi,
        functionName: "balanceOf",
        address: TOKEN_ADDRESSES.USDT,
        args: [walletAddress as `0x${string}`],
      });
      setAvailable(
        Number(formatUnits(balance, getTokenMetadata("USDT").decimals))
      );
    };

    fetchUSDTBalance();
  }, [walletAddress, publicClient]);

  useEffect(() => {
    if (amount === "") {
      setIsValidAmount(false);
    } else {
      setIsValidAmount(Number(amount) <= available);
      if (exchangeRate) {
        setConvertedAmount(
          (Number(amount) * Number(exchangeRate.data)).toFixed(2)
        );
      }
    }
  }, [amount, available, exchangeRate]);

  return (
    <WithdrawOTCContext.Provider
      value={{
        exchangeRate,
        amount,
        setAmount,
        convertedAmount,
        isValidAmount,
        available,
        handleMax,
        paymentMethod,
        setPaymentMethod,
      }}
    >
      {children}
    </WithdrawOTCContext.Provider>
  );
};

export const useWithdrawOTC = (): WithdrawOTCValue => {
  const ctx = useContext(WithdrawOTCContext);
  if (!ctx) {
    throw new Error("useWithdrawOTC must be used within a WithdrawOTC");
  }
  return ctx;
};

export default WithdrawOTCProvider;
