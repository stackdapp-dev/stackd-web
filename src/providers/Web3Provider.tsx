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
  setActiveWalletAddress: (address: Address) => void;
};

const Web3Context = createContext<Web3ProviderValue | undefined>(undefined);
const NETWORK = arbitrum;
const ACTIVE_WALLET_KEY = "stackd_active_wallet";

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { wallets, ready } = useWallets();

  const [publicClient] = useState<PublicClient>(() =>
    createPublicClient({
      chain: NETWORK,
      transport: http(),
    })
  );

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  const [savedActiveWallet, setSavedActiveWallet] = useState(
    localStorage.getItem(ACTIVE_WALLET_KEY)
  );

  const activeWallet = useMemo(() => {
    if (!ready || wallets.length === 0) return null;

    // there's an already saved wallet address
    if (savedActiveWallet) {
      console.log(
        "[WALLET] checking for saved active wallet:",
        savedActiveWallet
      );
      console.log("[WALLET] wallets:", wallets);
      const matchingWallet = wallets.find(
        (w) => w.address === savedActiveWallet
      );
      if (matchingWallet) {
        console.log("[WALLET] active wallet found:", matchingWallet.address);
        return matchingWallet;
      } else {
        console.log(
          "[WALLET] active wallet not found, defaulting to first wallet"
        );
      }
    }

    // no saved wallet address, or saved wallet address has no match
    if (wallets.length > 1 && typeof window !== "undefined") {
      // save persistently if more than 1 wallet
      localStorage.setItem(ACTIVE_WALLET_KEY, wallets[0].address);
    }
    console.log("[WALLET] active wallet is first wallet:", wallets[0].address);
    return wallets[0];
  }, [ready, wallets, savedActiveWallet]);

  useEffect(() => {
    const initWalletClient = async () => {
      if (!activeWallet) {
        return;
      }

      try {
        const provider = await activeWallet.getEthereumProvider();
        setWalletClient(
          createWalletClient({
            account: activeWallet.address as Hex,
            chain: NETWORK,
            transport: custom(provider),
          })
        );
      } catch (error) {
        console.error("Failed to initialize wallet client:", error);
      }
    };

    initWalletClient();
  }, [activeWallet]);

  const setActiveWalletAddress = (address: Address) => {
    const matchingWallet = wallets.find((w) => w.address === address);
    if (!matchingWallet) return;
    setSavedActiveWallet(address);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_WALLET_KEY, address);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        publicClient,
        walletClient,
        wallets,
        activeWalletAddress: activeWallet?.address as `0x${string}`,
        setActiveWalletAddress,
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
