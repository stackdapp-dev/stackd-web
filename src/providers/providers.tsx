"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
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
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: arbitrum,
        supportedChains: [arbitrum],
        appearance: { walletChainType: "ethereum-only", theme: "#171717" },
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
              {children}
              <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar
                newestOnTop
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable={false}
                pauseOnHover
              />
            </UserProvider>
          </Web3Provider>
        </TokenPriceProvider>
      </TooltipProvider>
    </PrivyProvider>
  );
}
