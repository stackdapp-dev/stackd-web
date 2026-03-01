import { describe, it, expect, vi, beforeEach } from "vitest";

// We'll test the gas boost utility that applies a 1.5x multiplier to gas fees
// The utility takes a PublicClient-like object and returns boosted gas parameters

describe("boostGasFees", () => {
  // Mock public client with estimateFeesPerGas
  const createMockClient = (fees: {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }) => ({
    estimateFeesPerGas: vi.fn().mockResolvedValue(fees),
  });

  it("should multiply maxFeePerGas by 1.5x", async () => {
    const { boostGasFees } = await import("@/lib/web3/gasBoost");
    const client = createMockClient({
      maxFeePerGas: 20_000_000_000n, // 20 gwei
      maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
    });

    const result = await boostGasFees(client as any);

    // 20 gwei * 1.5 = 30 gwei
    expect(result.maxFeePerGas).toBe(30_000_000_000n);
  });

  it("should multiply maxPriorityFeePerGas by 1.5x", async () => {
    const { boostGasFees } = await import("@/lib/web3/gasBoost");
    const client = createMockClient({
      maxFeePerGas: 20_000_000_000n,
      maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
    });

    const result = await boostGasFees(client as any);

    // 2 gwei * 1.5 = 3 gwei
    expect(result.maxPriorityFeePerGas).toBe(3_000_000_000n);
  });

  it("should handle odd numbers with integer division (floor)", async () => {
    const { boostGasFees } = await import("@/lib/web3/gasBoost");
    const client = createMockClient({
      maxFeePerGas: 10_000_000_001n, // odd wei value
      maxPriorityFeePerGas: 1_000_000_001n,
    });

    const result = await boostGasFees(client as any);

    // 10_000_000_001 * 3 / 2 = 15_000_000_001 (integer division floors for bigint)
    expect(result.maxFeePerGas).toBe(15_000_000_001n);
    // 1_000_000_001 * 3 / 2 = 1_500_000_001
    expect(result.maxPriorityFeePerGas).toBe(1_500_000_001n);
  });

  it("should handle zero gas fees gracefully", async () => {
    const { boostGasFees } = await import("@/lib/web3/gasBoost");
    const client = createMockClient({
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
    });

    const result = await boostGasFees(client as any);

    expect(result.maxFeePerGas).toBe(0n);
    expect(result.maxPriorityFeePerGas).toBe(0n);
  });

  it("should handle very large gas fees", async () => {
    const { boostGasFees } = await import("@/lib/web3/gasBoost");
    const client = createMockClient({
      maxFeePerGas: 500_000_000_000n, // 500 gwei (spike scenario)
      maxPriorityFeePerGas: 50_000_000_000n,
    });

    const result = await boostGasFees(client as any);

    expect(result.maxFeePerGas).toBe(750_000_000_000n);
    expect(result.maxPriorityFeePerGas).toBe(75_000_000_000n);
  });

  it("should return undefined fields if estimation fails", async () => {
    const { boostGasFees } = await import("@/lib/web3/gasBoost");
    const client = {
      estimateFeesPerGas: vi.fn().mockRejectedValue(new Error("RPC error")),
    };

    const result = await boostGasFees(client as any);

    // On failure, return empty object so tx falls back to provider defaults
    expect(result.maxFeePerGas).toBeUndefined();
    expect(result.maxPriorityFeePerGas).toBeUndefined();
  });
});

describe("GAS_BOOST_MULTIPLIER", () => {
  it("should export a multiplier of 1.5 (represented as 3n/2n for bigint math)", async () => {
    const { GAS_BOOST_NUMERATOR, GAS_BOOST_DENOMINATOR } = await import(
      "@/lib/web3/gasBoost"
    );
    expect(GAS_BOOST_NUMERATOR).toBe(3n);
    expect(GAS_BOOST_DENOMINATOR).toBe(2n);
  });
});
