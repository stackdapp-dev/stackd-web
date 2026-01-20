"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallBanner } from "@/components/common/InstallBanner";
import { ServiceWorkerUpdater } from "@/components/common/ServiceWorkerUpdater";
import { PWANavigationInterceptor } from "@/components/common/PWANavigationInterceptor";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { arbitrum, mainnet } from "viem/chains";
import { TokenPriceProvider } from "./TokenPriceProvider";
import { UserProvider } from "./UserProvider";
import { Web3Provider } from "./Web3Provider";

// Create a stable QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds before data is considered stale
      gcTime: 5 * 60_000, // 5 minutes garbage collection time
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry failed requests once
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          defaultChain: arbitrum,
          supportedChains: [arbitrum, mainnet],
          appearance: { walletChainType: "ethereum-only", theme: "#171717" },
          walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
          loginMethods: ["email", "wallet", "passkey"],
          // Enable gas sponsorship - requires dashboard.privy.io configuration
          fundingMethodConfig: {
            moonpay: {
              useSandbox: true,
            },
          },
        }}
      >
        <TooltipProvider>
          <TokenPriceProvider>
            <Web3Provider>
              <UserProvider>
                <InstallBanner />
                <ServiceWorkerUpdater />
                <PWANavigationInterceptor />
                {children}
                <ToastContainer
                  position="top-center"
                  autoClose={4000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable={false}
                  pauseOnHover
                  theme="dark"
                  style={{ zIndex: 9999 }}
                  toastStyle={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    backdropFilter: "blur(10px)",
                  }}
                />

              </UserProvider>
            </Web3Provider>
          </TokenPriceProvider>
        </TooltipProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
