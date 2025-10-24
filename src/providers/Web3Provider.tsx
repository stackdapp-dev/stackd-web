import { useWallets } from "@privy-io/react-auth";
import React, { createContext, useContext, useState } from "react";
import { Hex, PublicClient, WalletClient, createPublicClient, createWalletClient, custom, http } from "viem";
import { arbitrum } from "viem/chains";

declare global {
  interface Window {
    arbitrum?: any;
  }
}

type Web3ProviderValue = {
  publicClient: PublicClient;
  walletClient: WalletClient | null;
};

const Web3Context = createContext<Web3ProviderValue | undefined>(undefined);
const NETWORK = arbitrum;

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publicClient] = useState<PublicClient>(() =>
    createPublicClient({
      chain: NETWORK,
      transport: http(),
    })
  );
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  const { wallets } = useWallets();
  const wallet = wallets?.[0];

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

  return <Web3Context.Provider value={{ publicClient, walletClient }}>{children}</Web3Context.Provider>;
};

export const useWeb3 = (): Web3ProviderValue => {
  const ctx = useContext(Web3Context);
  if (!ctx) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return ctx;
};

export default Web3Provider;
