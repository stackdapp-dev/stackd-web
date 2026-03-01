/**
 * Regression Tests: Fluid getUserPositions() resilience
 *
 * Reproduces and guards against the bug where a failure in getVaultEntireData
 * (the optional live-rate fetch) would silently push supply=0, borrow=0 for the
 * position, causing the XAUT:USDT loan to disappear from Active Loans.
 *
 * Fix: getVaultEntireData is now wrapped in its own inner try-catch. If it fails,
 * we fall back to KNOWN_VAULTS hardcoded rates but still push the real supply/borrow
 * from positionByNftId. If positionByNftId itself fails, we skip the NFT entirely
 * (no zeros pushed).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PublicClient } from "viem";
import { getUserPositions } from "@/lib/web3/fluid";

// Minimal mock addresses
const USER_ADDRESS = "0x73C411106E4Ce97D439742913b3B34E9B3b3323A" as const;
const VAULT_ADDRESS = "0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644" as const;
const RESOLVER_ADDRESS = "0x93CAB6529aD849b2583EBAe32D13817A2F38cEb4" as const;
const NFT_ID = BigInt(9839);

// Realistic on-chain values for a 0.0339 XAUT position with 50 USDT borrow
const REAL_SUPPLY = BigInt(33900); // 0.0339 XAUT in raw units (6 decimals)
const REAL_BORROW = BigInt(50000000); // 50 USDT in raw units (6 decimals)

/** Build a mock PublicClient that responds to each contract function by address+name */
function buildMockClient(overrides: {
  positionsNftIdOfUser?: () => Promise<bigint[]>;
  vaultByNftId?: () => Promise<string>;
  positionByNftId?: () => Promise<unknown>;
  getVaultEntireData?: () => Promise<unknown>;
}): PublicClient {
  return {
    readContract: vi.fn(async ({ functionName }: { address: string; functionName: string }) => {
      if (functionName === "positionsNftIdOfUser") {
        return overrides.positionsNftIdOfUser
          ? overrides.positionsNftIdOfUser()
          : Promise.resolve([NFT_ID]);
      }
      if (functionName === "vaultByNftId") {
        return overrides.vaultByNftId
          ? overrides.vaultByNftId()
          : Promise.resolve(VAULT_ADDRESS);
      }
      if (functionName === "positionByNftId") {
        return overrides.positionByNftId
          ? overrides.positionByNftId()
          : Promise.resolve({
              nftId: NFT_ID,
              owner: USER_ADDRESS,
              isLiquidated: false,
              isSupplyPosition: false,
              tick: BigInt(0),
              tickId: BigInt(0),
              beforeSupply: BigInt(0),
              beforeBorrow: BigInt(0),
              beforeDustBorrow: BigInt(0),
              supply: REAL_SUPPLY,
              borrow: REAL_BORROW,
              dustBorrow: BigInt(0),
            });
      }
      if (functionName === "getVaultEntireData") {
        return overrides.getVaultEntireData
          ? overrides.getVaultEntireData()
          : Promise.resolve({
              vault: VAULT_ADDRESS,
              constantVariables: {},
              configs: {
                oraclePriceOperate: BigInt("2800000000000000000000000000000"), // ~$2800
                collateralFactor: BigInt(7500),
                liquidationThreshold: BigInt(8000),
              },
              exchangePricesAndRates: {
                borrowRateVault: BigInt(515), // ~5.15% APR
                supplyRateVault: BigInt(0),
              },
              totalSupplyAndBorrow: {},
              limitsAndAvailability: {},
              vaultState: { currentBranchState: {} },
              liquidityUserSupplyData: {},
              liquidityUserBorrowData: {},
            });
      }
      throw new Error(`Unexpected readContract call: ${functionName}`);
    }),
  } as unknown as PublicClient;
}

describe("getUserPositions() resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("REGRESSION: getVaultEntireData failure must not zero position", () => {
    it("returns real supply/borrow even when getVaultEntireData throws", async () => {
      const client = buildMockClient({
        getVaultEntireData: () => Promise.reject(new Error("RPC timeout")),
      });

      const result = await getUserPositions(client, USER_ADDRESS);

      // Must have exactly one position
      expect(result.positions).toHaveLength(1);

      // Supply and borrow must reflect the on-chain values, NOT zero
      expect(result.positions[0].supply).toBe(REAL_SUPPLY);
      expect(result.positions[0].borrow).toBe(REAL_BORROW);
    });

    it("uses fallback vault rates when getVaultEntireData throws", async () => {
      const client = buildMockClient({
        getVaultEntireData: () => Promise.reject(new Error("rate-limited")),
      });

      const result = await getUserPositions(client, USER_ADDRESS);

      // VaultData must still be pushed (so downstream consumers can display the position)
      expect(result.vaultsData).toHaveLength(1);

      // Borrow rate falls back to the KNOWN_VAULTS value (~2% APR)
      const fallbackBorrowRate = BigInt("634195840");
      expect(result.vaultsData[0].borrowRate).toBe(fallbackBorrowRate);
    });

    it("previously would push supply=0 on getVaultEntireData failure (guards the old bug)", async () => {
      // This documents exactly what the old code did wrong:
      // it had a single try-catch that treated getVaultEntireData failure as a position failure.
      // The fix wraps getVaultEntireData in its own inner try-catch.
      const client = buildMockClient({
        getVaultEntireData: () =>
          Promise.reject(new Error("connection refused")),
      });

      const result = await getUserPositions(client, USER_ADDRESS);

      // With the fix, supply must NOT be zero
      expect(result.positions[0].supply).not.toBe(BigInt(0));
      expect(result.positions[0].borrow).not.toBe(BigInt(0));
    });
  });

  describe("positionByNftId failure handling", () => {
    it("skips NFT entirely (no zeros pushed) when positionByNftId throws", async () => {
      const client = buildMockClient({
        positionByNftId: () => Promise.reject(new Error("contract revert")),
      });

      const result = await getUserPositions(client, USER_ADDRESS);

      // Position must be skipped — no entry with zeroed supply
      expect(result.positions).toHaveLength(0);
      expect(result.vaultsData).toHaveLength(0);
    });
  });

  describe("happy path: both calls succeed", () => {
    it("returns live supply/borrow and live vault rates", async () => {
      const liveOraclePrice = BigInt("2800000000000000000000000000000");
      const client = buildMockClient({});

      const result = await getUserPositions(client, USER_ADDRESS);

      expect(result.positions).toHaveLength(1);
      expect(result.positions[0].supply).toBe(REAL_SUPPLY);
      expect(result.positions[0].borrow).toBe(REAL_BORROW);

      expect(result.vaultsData).toHaveLength(1);
      expect(result.vaultsData[0].oraclePrice).toBe(liveOraclePrice);
    });
  });

  describe("no positions for user", () => {
    it("returns empty arrays when user has no NFTs", async () => {
      const client = buildMockClient({
        positionsNftIdOfUser: () => Promise.resolve([]),
      });

      const result = await getUserPositions(client, USER_ADDRESS);

      expect(result.positions).toHaveLength(0);
      expect(result.vaultsData).toHaveLength(0);
    });
  });
});
