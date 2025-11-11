import { useLogout } from "@privy-io/react-auth";
import { useWeb3 } from "@/providers/Web3Provider";
import { useState } from "react";

export const useFullLogout = () => {
  const { wallets, clearWalletState } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  const { logout } = useLogout({
    onSuccess: () => {
      // Check if this was a forced logout that needs page reload
      if (typeof window !== "undefined") {
        const forcedLogout = sessionStorage.getItem("privy_force_logout");
        if (forcedLogout) {
          sessionStorage.removeItem("privy_force_logout");
          // Force page reload to clear Privy's cached wallet state
          console.log("[LOGOUT] Forcing page reload to clear wallet cache");
          window.location.href = "/";
          return;
        }
      }
      // Use window.location.href instead of redirect for more reliable navigation
      window.location.href = "/";
    },
  });

  const fullLogout = async () => {
    setIsLoading(true);

    try {
      console.log("Starting full logout process...");
      console.log("Current wallets:", wallets);

      // Step 1: Disconnect from all EOA (external) wallets
      const eoaWallets = wallets.filter((w) => w.connectorType !== "embedded");
      console.log("EOA wallets to disconnect:", eoaWallets);

      for (const wallet of eoaWallets) {
        try {
          console.log(
            `Disconnecting from ${wallet.meta.name} (${wallet.address})`
          );

          // For external wallets, we need to use more aggressive disconnect methods
          if (
            wallet.connectorType === "injected" ||
            wallet.connectorType === "wallet_connect"
          ) {
            // Try to get the ethereum provider and disconnect directly
            const provider = await wallet.getEthereumProvider();

            // For WalletConnect wallets, disconnect the session
            if (wallet.connectorType === "wallet_connect") {
              try {
                // WalletConnect specific disconnect
                if (provider && "disconnect" in provider) {
                  await (provider as any).disconnect();
                }
                // Also try to close the WalletConnect session
                if (provider && "close" in provider) {
                  await (provider as any).close();
                }
              } catch (wcError) {
                console.warn(
                  `WalletConnect disconnect failed for ${wallet.meta.name}:`,
                  wcError
                );
              }
            }

            // For injected wallets (MetaMask, Rabby, etc.)
            if (wallet.connectorType === "injected") {
              try {
                // Request account disconnection via eth_requestAccounts with empty array
                // This doesn't always work but worth trying
                if (provider && "request" in provider) {
                  try {
                    // Some wallets support wallet_revokePermissions
                    await (provider as any).request({
                      method: "wallet_revokePermissions",
                      params: [{ eth_accounts: {} }],
                    });
                  } catch (revokeError) {
                    console.warn(
                      `Permission revoke failed for ${wallet.meta.name}:`,
                      revokeError
                    );
                  }
                }
              } catch (injectedError) {
                console.warn(
                  `Injected wallet disconnect failed for ${wallet.meta.name}:`,
                  injectedError
                );
              }
            }

            // Always call Privy's disconnect method
            await wallet.disconnect();
          } else {
            // For other wallet types, use Privy's disconnect
            await wallet.disconnect();
          }

          console.log(`Successfully disconnected from ${wallet.meta.name}`);
        } catch (error) {
          console.error(
            `Failed to disconnect from ${wallet.meta.name}:`,
            error
          );
          // Continue with other wallets even if one fails
        }
      }

      // Step 2: Clear Web3Provider state and localStorage data
      console.log("Clearing Web3Provider state...");
      clearWalletState();

      // Step 3: Clear any additional wallet-related localStorage data
      console.log("Clearing additional wallet localStorage data...");
      if (typeof window !== "undefined") {
        // Clear any other wallet-related data that might persist
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes("privy") ||
              key.includes("connector") ||
              key.includes("wallet") ||
              key.includes("wc@2") || // WalletConnect v2
              key.includes("wagmi") ||
              key.includes("rainbowkit"))
          ) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          console.log(`Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        });

        // Also clear sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (
            key &&
            (key.includes("privy") ||
              key.includes("connector") ||
              key.includes("wallet") ||
              key.includes("wc@2"))
          ) {
            sessionKeysToRemove.push(key);
          }
        }

        sessionKeysToRemove.forEach((key) => {
          console.log(`Removing sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        });
      }

      // Step 4: Force page reload after logout to clear Privy's cached wallet state
      // This is necessary because Privy's useWallets() doesn't immediately clear
      console.log("Logging out from Privy...");

      // Set a flag to indicate we're doing a forced logout
      if (typeof window !== "undefined") {
        sessionStorage.setItem("privy_force_logout", "true");
      }

      logout();
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoading(false);
      // Still attempt Privy logout even if wallet disconnection fails
      logout();
    }
  };

  return {
    fullLogout,
    isLoading,
  };
};
