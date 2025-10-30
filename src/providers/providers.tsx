"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { arbitrum } from "viem/chains";
import { TokenPriceProvider } from "./TokenPriceProvider";
import { UserProvider } from "./UserProvider";
import VisibilityProvider from "./visibility";
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
      }}
    >
      <VisibilityProvider>
        <TokenPriceProvider>
          <Web3Provider>
            <UserProvider>{children}</UserProvider>
          </Web3Provider>
        </TokenPriceProvider>
      </VisibilityProvider>
    </PrivyProvider>
  );
}
