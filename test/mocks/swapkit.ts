// Mock data for SwapKit API v4 structure
export const mockSwapKitQuoteResponse = {
  quoteId: 'test-quote-123',
  routes: [
    {
      expectedBuyAmount: '0.099',
      expectedBuyAmountMaxSlippage: '0.098',
      fees: [
        { type: 'affiliate', amount: '0.0003', asset: 'BTC.BTC', chain: 'BTC', protocol: 'THORCHAIN' },
        { type: 'outbound', amount: '0.0001', asset: 'BTC.BTC', chain: 'BTC', protocol: 'THORCHAIN' },
        { type: 'liquidity', amount: '0.0002', asset: 'BTC.BTC', chain: 'BTC', protocol: 'THORCHAIN' },
      ],
      providers: ['THORCHAIN'],
      sellAsset: 'BTC.BTC',
      buyAsset: 'ARB.WBTC-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
      destinationAddress: '0x1234567890123456789012345678901234567890',
      estimatedTime: 600,
      warnings: [],
    },
  ],
};

// Mock data for inbound addresses (v4 API uses snake_case)
export const mockDepositAddress = {
  chain: 'BTC',
  address: 'bc1qtest1234567890abcdefghijklmnop',
  router: '',
  gas_rate: '10',
  gas_rate_units: 'satsperbyte',
  halted: false,
  chain_trading_paused: false,
  global_trading_paused: false,
};
