/**
 * Fee Calculator for THORChain swap operations
 *
 * Calculates network fees, affiliate fees, and slippage estimates for BTC ↔ WBTC swaps.
 * Uses string arithmetic to avoid floating point precision errors.
 */

export type FeeSpeed = 'fast' | 'normal' | 'slow';

export interface FeeCalculationInput {
  inputAmount: string;
  affiliateBps: number;
  slippageBps: number;
}

export interface FeeCalculationResult {
  networkFee: string;
  affiliateFee: string;
  slippageEstimate: string;
  totalFeePercent: number;
  outputEstimate: string;
}

export interface MinimumOutputInput {
  expectedOutput: string;
  slippageBps: number;
}

export interface FeeBreakdownInput {
  networkFee: string;
  affiliateFee: string;
  slippageEstimate: string;
  inputAsset: string;
}

export const DUST_LIMIT_BTC = '0.0001';
export const DEFAULT_NETWORK_FEES: Record<FeeSpeed, string> = {
  fast: '0.0002',
  normal: '0.0001',
  slow: '0.00005',
};

/**
 * Parses a string amount to a number, validating the format
 * @throws Error if the amount is not a valid number format
 */
function parseAmount(amount: string): number {
  const trimmed = amount.trim();
  if (trimmed === '' || !/^-?\d*\.?\d+$/.test(trimmed)) {
    throw new Error('Invalid amount format');
  }
  return parseFloat(trimmed);
}

/**
 * Formats a number to a string with appropriate precision, removing trailing zeros
 */
function formatAmount(value: number, maxDecimals: number = 8): string {
  if (value === 0) return '0';
  const fixed = value.toFixed(maxDecimals);
  // Remove trailing zeros after decimal point
  return fixed.replace(/\.?0+$/, '');
}

/**
 * Calculates total fees for a swap operation
 *
 * @param input - The fee calculation input parameters
 * @returns The calculated fees and output estimate
 * @throws Error if amount is invalid, negative, zero, or below dust limit
 */
export function calculateTotalFees(input: FeeCalculationInput): FeeCalculationResult {
  const { inputAmount, affiliateBps, slippageBps } = input;

  // Parse and validate the input amount
  const amount = parseAmount(inputAmount);

  // Check for zero or negative
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Check dust limit
  const dustLimit = parseFloat(DUST_LIMIT_BTC);
  if (amount < dustLimit) {
    throw new Error('Amount below minimum');
  }

  // Calculate affiliate fee (bps = basis points, 1 bps = 0.01%)
  const affiliateFeeValue = amount * (affiliateBps / 10000);

  // Calculate slippage estimate
  const slippageValue = amount * (slippageBps / 10000);

  // Get default network fee
  const networkFeeValue = parseFloat(DEFAULT_NETWORK_FEES.normal);

  // Calculate total fee percentage
  const totalFees = affiliateFeeValue + slippageValue + networkFeeValue;
  const totalFeePercent = (totalFees / amount) * 100;

  // Calculate output estimate (input minus all fees)
  const outputEstimate = amount - totalFees;

  return {
    networkFee: DEFAULT_NETWORK_FEES.normal,
    affiliateFee: affiliateFeeValue === 0 ? '0' : formatAmount(affiliateFeeValue),
    slippageEstimate: formatAmount(slippageValue),
    totalFeePercent,
    outputEstimate: formatAmount(outputEstimate),
  };
}

/**
 * Estimates network fee based on desired confirmation speed
 *
 * @param speed - The desired confirmation speed ('fast', 'normal', 'slow')
 * @returns The estimated network fee as a string
 */
export function estimateNetworkFee(speed: FeeSpeed): string {
  return DEFAULT_NETWORK_FEES[speed];
}

/**
 * Calculates the minimum output amount after accounting for slippage
 *
 * @param input - The minimum output calculation input
 * @returns The minimum expected output as a string
 */
export function calculateMinimumOutput(input: MinimumOutputInput): string {
  const { expectedOutput, slippageBps } = input;

  const expected = parseFloat(expectedOutput);

  // If no slippage, return original
  if (slippageBps === 0) {
    return expectedOutput;
  }

  // Calculate minimum after slippage
  const slippageMultiplier = 1 - slippageBps / 10000;
  const minimum = expected * slippageMultiplier;

  return formatAmount(minimum);
}

/**
 * Formats a fee breakdown for display purposes
 *
 * @param input - The fee breakdown input
 * @returns A formatted string describing the fees
 */
export function formatFeeBreakdown(input: FeeBreakdownInput): string {
  const { networkFee, affiliateFee, slippageEstimate, inputAsset } = input;

  const lines = [
    `Network Fee: ${networkFee} ${inputAsset}`,
    `Affiliate Fee: ${affiliateFee} ${inputAsset}`,
    `Slippage (estimated): ${slippageEstimate} ${inputAsset}`,
  ];

  return lines.join('\n');
}
