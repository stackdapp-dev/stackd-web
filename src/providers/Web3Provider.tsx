import { ConnectedWallet, usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
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
import { arbitrum, mainnet } from "viem/chains";

declare global {
  interface Window {
    arbitrum?: any;
    // E2E Test mode properties
    __PRIVY_TEST_MODE__?: boolean;
    __PRIVY_MOCK_AUTHENTICATED__?: boolean;
    __PRIVY_MOCK_WALLET__?: {
      address: string;
      walletClientType: string;
      chainId?: number;
    };
  }
}

type SendTransactionParams = {
  to: Address;
  data?: Hex;
  value?: bigint;
  chainId?: number;
};

type Web3ProviderValue = {
  publicClient: PublicClient;
  ethereumPublicClient: PublicClient;
  getPublicClient: (chainId: number) => PublicClient;
  walletClient: WalletClient | null;
  wallets: ConnectedWallet[];
  activeWalletAddress: Address;
  setActiveWalletAddress: (address: Address) => void;
  ensureCorrectNetwork: () => Promise<void>;
  switchToNetwork: (chainId: number) => Promise<void>;
  clearWalletState: () => void;
  sendSponsoredTransaction: (params: SendTransactionParams) => Promise<{ hash: string | null; error: string | null }>;
  isSendingTransaction: boolean;
  isExternalWallet: boolean;
};

const Web3Context = createContext<Web3ProviderValue | undefined>(undefined);
const NETWORK = arbitrum;
const ACTIVE_WALLET_KEY = "stackd_active_wallet";

// Supported chains mapping
const SUPPORTED_CHAINS = {
  [arbitrum.id]: arbitrum,
  [mainnet.id]: mainnet,
} as const;

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { wallets: privyWallets, ready } = useWallets();
  const { authenticated: privyAuthenticated } = usePrivy();

  // Test mode support for E2E testing - use state to allow re-render after script injection
  const [isInTestMode, setIsInTestMode] = useState(false);
  const [testMockWallet, setTestMockWallet] = useState<typeof window.__PRIVY_MOCK_WALLET__>(undefined);
  const [testMockAuth, setTestMockAuth] = useState(false);

  // Check for test mode on mount and when window changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.__PRIVY_TEST_MODE__) {
      console.log("[TEST MODE] Detected! Setting up mock wallet...");
      setIsInTestMode(true);
      setTestMockWallet(window.__PRIVY_MOCK_WALLET__);
      setTestMockAuth(window.__PRIVY_MOCK_AUTHENTICATED__ ?? false);
    }
  }, []);

  // Override with test mode values if in test mode
  const authenticated = isInTestMode ? testMockAuth : privyAuthenticated;

  // Create mock wallet for test mode
  const wallets = useMemo(() => {
    if (isInTestMode && testMockWallet) {
      console.log("[TEST MODE] Using mock wallet:", testMockWallet.address);
      return [{
        address: testMockWallet.address as `0x${string}`,
        walletClientType: testMockWallet.walletClientType,
        chainId: testMockWallet.chainId || 42161,
        getEthereumProvider: async () => ({
          request: async ({ method }: { method: string }) => {
            if (method === "eth_chainId") return "0xa4b1";
            if (method === "eth_accounts") return [testMockWallet.address];
            return null;
          },
        }),
      }] as unknown as ConnectedWallet[];
    }
    return privyWallets;
  }, [isInTestMode, testMockWallet, privyWallets]);

  // Privy's sponsored transaction hook
  const { sendTransaction: privySendTransaction } = useSendTransaction();
  const [isSending, setIsSending] = useState(false);

  // Arbitrum public client (default/primary)
  const [publicClient] = useState<PublicClient>(() =>
    createPublicClient({
      chain: NETWORK,
      transport: http(),
    })
  );

  // Ethereum mainnet public client
  const [ethereumPublicClient] = useState<PublicClient>(() =>
    createPublicClient({
      chain: mainnet,
      transport: http(),
    })
  );

  // Get public client for a specific chain
  const getPublicClient = (chainId: number): PublicClient => {
    if (chainId === mainnet.id) {
      return ethereumPublicClient;
    }
    // Default to Arbitrum for any unsupported chain or Arbitrum
    return publicClient;
  };

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  const [savedActiveWallet, setSavedActiveWallet] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem(ACTIVE_WALLET_KEY)
      : null
  );

  const activeWallet = useMemo(() => {
    // Debug: log all conditions
    console.log("[WALLET] Checking conditions - ready:", ready, "wallets.length:", wallets.length, "authenticated:", authenticated);

    // Only set active wallet if user is authenticated
    if (!ready || wallets.length === 0 || !authenticated) {
      console.log("[WALLET] Conditions not met, returning null");
      return null;
    }

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
  }, [ready, wallets, savedActiveWallet, authenticated]);

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

  const ensureCorrectNetwork = async () => {
    if (!activeWallet) {
      throw new Error("No active wallet connected");
    }

    try {
      // Get current chain ID from wallet client
      const provider = await activeWallet.getEthereumProvider();
      const walletChainId = await provider.request({
        method: "eth_chainId",
      });

      const currentChainId = parseInt(walletChainId as string, 16);

      if (currentChainId === NETWORK.id) {
        console.log(`[NETWORK] Already on ${NETWORK.name} network`);
        return;
      }

      console.log(
        `[NETWORK] Switching from chain ${currentChainId} to ${NETWORK.id} (${NETWORK.name})`
      );

      await activeWallet.switchChain(NETWORK.id);

      console.log(`[NETWORK] Successfully switched to ${NETWORK.name}`);
    } catch (error) {
      console.error("[NETWORK] Failed to switch network:", error);
      throw new Error(
        `Please switch your wallet to the ${NETWORK.name} network to continue`
      );
    }
  };

  const clearWalletState = () => {
    console.log("[WALLET] Clearing wallet state...");

    // Clear wallet client
    setWalletClient(null);

    // Clear saved active wallet
    setSavedActiveWallet(null);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_WALLET_KEY);
    }

    console.log("[WALLET] Wallet state cleared");
  };

  // Ensure wallet is on the correct network for a transaction
  const ensureNetworkForTransaction = async (targetChainId: number) => {
    if (!activeWallet) {
      throw new Error("No active wallet connected");
    }

    const targetChain = SUPPORTED_CHAINS[targetChainId as keyof typeof SUPPORTED_CHAINS];
    if (!targetChain) {
      throw new Error(`Unsupported chain ID: ${targetChainId}`);
    }

    const provider = await activeWallet.getEthereumProvider();
    const walletChainId = await provider.request({
      method: "eth_chainId",
    });

    const currentChainId = parseInt(walletChainId as string, 16);

    if (currentChainId === targetChainId) {
      console.log(`[NETWORK] Already on ${targetChain.name} network`);
      return;
    }

    console.log(
      `[NETWORK] Switching from chain ${currentChainId} to ${targetChainId} (${targetChain.name})`
    );

    const isEmbeddedWallet = activeWallet.walletClientType === "privy";

    // For embedded wallets, use Privy's switchChain directly
    if (isEmbeddedWallet) {
      try {
        await activeWallet.switchChain(targetChainId);
        console.log(`[NETWORK] Successfully switched to ${targetChain.name}`);
        return;
      } catch (error) {
        console.error("[NETWORK] Failed to switch network:", error);
        throw new Error(
          `Please switch your wallet to the ${targetChain.name} network to continue`
        );
      }
    }

    // For external wallets (Rabby, MetaMask, etc.), use EIP-3326 wallet_switchEthereumChain
    // and fall back to wallet_addEthereumChain if the chain isn't configured
    try {
      // First, try to switch to the chain
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      console.log(`[NETWORK] Successfully switched to ${targetChain.name}`);
    } catch (switchError: unknown) {
      // Error code 4902 means the chain hasn't been added to the wallet yet
      // Some wallets may use different error codes or structures
      const errorCode = (switchError as { code?: number })?.code;
      const errorMessage = (switchError as { message?: string })?.message?.toLowerCase() || "";

      const isChainNotAdded =
        errorCode === 4902 ||
        errorMessage.includes("unrecognized chain") ||
        errorMessage.includes("chain not added") ||
        errorMessage.includes("unknown chain");

      if (isChainNotAdded) {
        console.log(`[NETWORK] Chain ${targetChainId} not configured in wallet, attempting to add it...`);

        try {
          // Add the chain to the wallet using wallet_addEthereumChain (EIP-3085)
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: {
                  name: targetChain.nativeCurrency.name,
                  symbol: targetChain.nativeCurrency.symbol,
                  decimals: targetChain.nativeCurrency.decimals,
                },
                rpcUrls: [targetChain.rpcUrls.default.http[0]],
                blockExplorerUrls: targetChain.blockExplorers?.default
                  ? [targetChain.blockExplorers.default.url]
                  : undefined,
              },
            ],
          });
          console.log(`[NETWORK] Successfully added and switched to ${targetChain.name}`);
        } catch (addError) {
          console.error("[NETWORK] Failed to add chain:", addError);
          throw new Error(
            `Please add the ${targetChain.name} network to your wallet and try again`
          );
        }
      } else {
        // User rejected the switch or other error
        console.error("[NETWORK] Failed to switch network:", switchError);
        throw new Error(
          `Please switch your wallet to the ${targetChain.name} network to continue`
        );
      }
    }
  };

  // Send transaction - sponsored for embedded wallets, regular for external wallets
  const sendSponsoredTransaction = async (
    params: SendTransactionParams
  ): Promise<{ hash: string | null; error: string | null }> => {
    if (!activeWallet) {
      return { hash: null, error: "No active wallet connected" };
    }

    // Default to Arbitrum for backward compatibility
    const targetChainId = params.chainId ?? NETWORK.id;

    try {
      setIsSending(true);
      await ensureNetworkForTransaction(targetChainId);

      console.log("[TX] Sending transaction:", params);
      console.log("[TX] Using wallet address:", activeWallet.address);
      console.log("[TX] Wallet client type:", activeWallet.walletClientType);
      console.log("[TX] Target chain ID:", targetChainId);

      // Check if this is an embedded wallet (supports gas sponsorship)
      const isEmbeddedWallet = activeWallet.walletClientType === "privy";

      if (isEmbeddedWallet) {
        // Use Privy's sendTransaction with gas sponsorship for embedded wallets
        console.log("[TX] Using sponsored transaction (embedded wallet)");
        const txReceipt = await privySendTransaction(
          {
            to: params.to,
            data: params.data,
            value: params.value ? BigInt(params.value) : undefined,
            chainId: targetChainId,
          },
          {
            // Enable gas sponsorship (requires dashboard configuration)
            sponsor: true,
            // Specify the wallet to use for the transaction
            address: activeWallet.address as `0x${string}`,
            uiOptions: {
              description: "Approve this sponsored transaction",
              buttonText: "Sign",
            },
          }
        );

        console.log("[TX] Sponsored transaction hash:", txReceipt.hash);
        setIsSending(false);
        return { hash: txReceipt.hash, error: null };
      } else {
        // For external wallets, use Privy's sendTransaction without sponsorship
        // Privy will show the transaction prompt where user can pay their own gas
        console.log("[TX] Using regular transaction (external wallet)");
        const txReceipt = await privySendTransaction(
          {
            to: params.to,
            data: params.data,
            value: params.value ? BigInt(params.value) : undefined,
            chainId: targetChainId,
          },
          {
            // No sponsorship for external wallets - user pays gas
            sponsor: false,
            address: activeWallet.address as `0x${string}`,
            uiOptions: {
              description: "Confirm transaction",
              buttonText: "Confirm",
            },
          }
        );

        console.log("[TX] External wallet transaction hash:", txReceipt.hash);
        setIsSending(false);
        return { hash: txReceipt.hash, error: null };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown transaction error";
      console.error("[TX] Transaction failed:", err);
      setIsSending(false);
      return { hash: null, error: errorMessage };
    }
  };

  return (
    <Web3Context.Provider
      value={{
        publicClient,
        ethereumPublicClient,
        getPublicClient,
        walletClient,
        wallets,
        activeWalletAddress: activeWallet?.address as `0x${string}`,
        setActiveWalletAddress,
        ensureCorrectNetwork,
        switchToNetwork: ensureNetworkForTransaction,
        clearWalletState,
        sendSponsoredTransaction,
        isSendingTransaction: isSending,
        // Only true when there's an active wallet AND it's not embedded (privy)
        isExternalWallet: Boolean(activeWallet && activeWallet.walletClientType !== "privy"),
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
