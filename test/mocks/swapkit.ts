export const mockSwapKitQuoteResponse = {
  expectedOutput: '0.099',
  expectedOutputUSD: '9900',
  minimumOutput: '0.098',
  fees: {
    affiliate: '0.0003',
    outbound: '0.0001',
    liquidity: '0.0002',
  },
  route: {
    providers: ['THORCHAIN'],
    sellAsset: 'BTC.BTC',
    buyAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
  },
  estimatedTime: 600, // 10 minutes
  warnings: [],
};

export const mockDepositAddress = {
  chain: 'BTC',
  address: 'bc1qtest1234567890abcdefghijklmnop',
  router: '',
  gasRate: '10',
  gasRateUnits: 'satsperbyte',
  halted: false,
  haltedChain: false,
  globalTradingPaused: false,
};
