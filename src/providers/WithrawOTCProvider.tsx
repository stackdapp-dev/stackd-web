"use client";

import { TOKEN_ADDRESSES } from "@/constants/addresses";
import { getTokenMetadata } from "@/constants/Tokens";
import { getExchangeRate, RateData } from "@/lib/api/rates";
import { UserPaymentMethod, UserPaymentMethodInput } from "@/lib/api/user";
import { useWeb3 } from "@/providers/Web3Provider";
import { createContext, useContext, useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";

export const MIN_USDT_WITHDRAW_AMOUNT = 1;
export const MIN_PHP_AMOUNT_NO_FEE = 10000;
export const PHP_WITHDRAW_FEE = 10;

type WithdrawOTCValue = {
  exchangeRate: RateData | undefined;
  amount: string;
  setAmount: (amount: string) => void;
  convertedAmount: string;
  isValidAmount: boolean;
  available: number; // available USDT to withdraw
  handleMax: () => void;
  transferTxHash: string | null;
  setTransferTxHash: (txHash: string) => void;
  paymentMethod: UserPaymentMethodInput | UserPaymentMethod | null;
  setPaymentMethod: (
    paymentMethod: UserPaymentMethodInput | UserPaymentMethod
  ) => void;
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
  const [exchangeRate, setExchangeRate] = useState<RateData | undefined>(
    undefined
  );
  const [paymentMethod, setPaymentMethod] = useState<
    UserPaymentMethodInput | UserPaymentMethod | null
  >(null);
  const [transferTxHash, setTransferTxHash] = useState<string | null>(null);

  const { publicClient, activeWalletAddress } = useWeb3();

  const handleMax = () => {
    setAmount(available.toString());
  };

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
    if (!publicClient || !activeWalletAddress) return;

    const fetchUSDTBalance = async () => {
      const balance = await publicClient.readContract({
        abi: erc20Abi,
        functionName: "balanceOf",
        address: TOKEN_ADDRESSES.USDT,
        args: [activeWalletAddress as `0x${string}`],
      });
      setAvailable(
        Number(formatUnits(balance, getTokenMetadata("USDT").decimals))
      );
    };

    fetchUSDTBalance();
  }, [activeWalletAddress, publicClient]);

  useEffect(() => {
    if (amount === "") {
      setConvertedAmount("");
      setIsValidAmount(false);
    } else {
      setIsValidAmount(
        Number(amount) <= available &&
          Number(amount) >= MIN_USDT_WITHDRAW_AMOUNT
      );
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
        transferTxHash,
        setTransferTxHash,
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
