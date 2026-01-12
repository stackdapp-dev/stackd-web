/**
 * Transaction utility functions
 */

type PriceGetter = (symbol: string) => number;

/**
 * Calculate the USD value of a transaction amount using the market price.
 *
 * @param amount - The token amount (can be negative for sends)
 * @param symbol - The token symbol (e.g., "WBTC", "USDT", "ETH")
 * @param getPrice - A function that returns the USD price for a given token symbol
 * @returns The USD value of the amount
 */
export function calculateTransactionUsdValue(
  amount: number,
  symbol: string,
  getPrice: PriceGetter
): number {
  // For stablecoins, the amount is essentially the USD value
  if (symbol === "USDT" || symbol === "USDC") {
    return amount;
  }

  // For all other tokens, multiply by the market price
  const price = getPrice(symbol);
  return amount * price;
}
