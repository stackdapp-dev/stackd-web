export type CollateralType = "WBTC" | "XAUT";
export type Protocol = "compound" | "fluid";
export type Chain = "arbitrum" | "ethereum";

export interface LoanPosition {
  id: string;
  protocol: Protocol;
  chain: Chain;
  collateralToken: string;
  borrowToken: string;
  collateralAmount: number;
  collateralUsd: number;
  borrowAmount: number;
  borrowUsd: number;
  ltv: number;
  apr: number;
  maxLtv: number;
  liquidationRatio: number;
  nftId?: bigint; // For Fluid positions - used for direct link to position
}

export interface CollateralOption {
  type: CollateralType;
  name: string;
  symbol: string;
  network: string;
  chainId: number;
}

export const COLLATERAL_OPTIONS: CollateralOption[] = [
  { type: "WBTC", name: "Bitcoin", symbol: "WBTC", network: "Arbitrum", chainId: 42161 },
  { type: "XAUT", name: "Gold", symbol: "XAUT", network: "Ethereum", chainId: 1 },
];
