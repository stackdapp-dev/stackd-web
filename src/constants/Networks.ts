// Network metadata for displaying network icons

export const NETWORK_METADATA: Record<string, { name: string; icon: string; chainId: number }> = {
  arbitrum: {
    name: "Arbitrum",
    icon: "/assets/networks/arbitrum.png",
    chainId: 42161,
  },
  ethereum: {
    name: "Ethereum",
    icon: "/assets/networks/ethereum.png",
    chainId: 1,
  },
};
