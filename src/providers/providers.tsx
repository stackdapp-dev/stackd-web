"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PrivyProvider } from "@privy-io/react-auth";
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
        appearance: { walletChainType: "ethereum-only", theme: "#171717" },
        // loginMethods: ["email", "sms", "google", "wallet"],
      }}
    >
      <TooltipProvider>
        <TokenPriceProvider>
          <Web3Provider>
            <UserProvider>{children}</UserProvider>
          </Web3Provider>
        </TokenPriceProvider>
      </TooltipProvider>
    </PrivyProvider>
  );
}
