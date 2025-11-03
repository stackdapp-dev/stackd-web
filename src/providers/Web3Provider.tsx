import { ConnectedWallet, useWallets } from "@privy-io/react-auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Address,
  Hex,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "viem";
import { arbitrum } from "viem/chains";

declare global {
  interface Window {
    arbitrum?: any;
  }
}

type Web3ProviderValue = {
  publicClient: PublicClient;
  walletClient: WalletClient | null;
  wallets: ConnectedWallet[];
  activeWalletAddress: Address;
  activeWalletIndex: number;
  setActiveWalletIndex: (index: number) => void;
};

const Web3Context = createContext<Web3ProviderValue | undefined>(undefined);
const NETWORK = arbitrum;
const ACTIVE_WALLET_INDEX_KEY = "stackd_active_wallet_index";

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [publicClient] = useState<PublicClient>(() =>
    createPublicClient({
      chain: NETWORK,
      transport: http(),
    })
  );
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [activeWalletIndex, setActiveWalletIndexState] = useState<number>(
    () => {
      // Load from localStorage on initialization
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(ACTIVE_WALLET_INDEX_KEY);
        return stored ? parseInt(stored, 10) : 0;
      }
      return 0;
    }
  );

  const { wallets } = useWallets();

  const wallet = useMemo(
    () => wallets?.[activeWalletIndex],
    [wallets, activeWalletIndex]
  );

  useEffect(() => {
    console.log("Privy wallets:", wallets);
  }, [wallets]);

  // Persist activeWalletIndex to localStorage
  const setActiveWalletIndex = (index: number) => {
    setActiveWalletIndexState(index);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_WALLET_INDEX_KEY, index.toString());
    }
  };

  React.useEffect(() => {
    const initWalletClient = async () => {
      if (!wallet) {
        return;
      }

      try {
        const provider = await wallet.getEthereumProvider();
        setWalletClient(
          createWalletClient({
            account: wallet.address as Hex,
            chain: NETWORK,
            transport: custom(provider),
          })
        );
      } catch (error) {
        console.error("Failed to initialize wallet client:", error);
      }
    };

    initWalletClient();
  }, [wallet]);

  return (
    <Web3Context.Provider
      value={{
        publicClient,
        walletClient,
        wallets,
        activeWalletAddress: wallet?.address as `0x${string}`,
        activeWalletIndex,
        setActiveWalletIndex,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ProviderValue => {
  const ctx = useContext(Web3Context);
  if (!ctx) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return ctx;
};

export default Web3Provider;
