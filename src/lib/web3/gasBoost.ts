import type { PublicClient } from "viem";

/** 1.5x multiplier as bigint fraction: multiply by 3, divide by 2 */
export const GAS_BOOST_NUMERATOR = 3n;
export const GAS_BOOST_DENOMINATOR = 2n;

type BoostedGasFees = {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
};

/**
 * Estimates current gas fees and applies a 1.5x multiplier for faster confirmation.
 * Falls back to undefined (letting the provider decide) if estimation fails.
 */
export async function boostGasFees(
  client: PublicClient
): Promise<BoostedGasFees> {
  try {
    const fees = await client.estimateFeesPerGas();
    return {
      maxFeePerGas:
        (fees.maxFeePerGas * GAS_BOOST_NUMERATOR) / GAS_BOOST_DENOMINATOR,
      maxPriorityFeePerGas:
        (fees.maxPriorityFeePerGas! * GAS_BOOST_NUMERATOR) /
        GAS_BOOST_DENOMINATOR,
    };
  } catch (err) {
    console.warn("[GAS] Fee estimation failed, using provider defaults:", err);
    return {};
  }
}
