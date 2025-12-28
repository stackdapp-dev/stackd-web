"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallBanner } from "@/components/common/InstallBanner";
import { PrivyProvider } from "@privy-io/react-auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { arbitrum } from "viem/chains";
import { TokenPriceProvider } from "./TokenPriceProvider";
import { UserProvider } from "./UserProvider";
import { Web3Provider } from "./Web3Provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: arbitrum,
        supportedChains: [arbitrum],
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
  );
}
