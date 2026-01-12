export interface QuoteRequest {
  sellAsset: string;
  buyAsset: string;
  sellAmount: string;
  senderAddress: string;
  recipientAddress: string;
  streaming?: boolean;
  affiliateAddress?: string;
  affiliateBps?: number;
}

export interface QuoteResponse {
  expectedOutput: string;
  expectedOutputUSD?: string;
  minimumOutput: string;
  estimatedTime: number;
  fees: {
    affiliate: string;
    outbound: string;
    liquidity: string;
  };
  route: {
    providers: string[];
    sellAsset: string;
    buyAsset: string;
  };
  streamingSwap?: {
    interval: number;
    quantity: number;
  };
  warnings: string[];
}

export interface DepositAddress {
  chain: string;
  address: string;
  router: string;
  gasRate: string;
  gasRateUnits: string;
  halted: boolean;
  haltedChain: boolean;
  globalTradingPaused: boolean;
}

export interface SwapMemoParams {
  buyAsset: string;
  recipientAddress: string;
  minOutput: string;
  affiliateAddress?: string;
  affiliateBps?: number;
  streamingInterval?: number;
  streamingQuantity?: number;
}
