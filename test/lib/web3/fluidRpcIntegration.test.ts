/**
 * Integration Tests for Fluid VaultResolver RPC Calls
 *
 * These tests make LIVE RPC calls to Ethereum mainnet to verify:
 * 1. The ABI structure matches the actual contract response
 * 2. borrowRateVault is correctly extracted from nested structs
 * 3. The APR value is in a reasonable range (catches ABI mismatches)
 *
 * If these tests fail, it likely means the ABI definition doesn't match
 * the on-chain contract structure (like the bug we fixed where borrowRateVault
 * was being misread due to incorrect struct definitions).
 *
 * NOTE: These tests are skipped in CI by default because they depend on
 * external RPC endpoints which can be unreliable. Set ETHEREUM_RPC_URL
 * environment variable to run these tests with a dedicated RPC endpoint.
 */
import { describe, it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import {
  FLUID_VAULT_RESOLVER_ADDR,
  FLUID_VAULT_RESOLVER_ABI,
} from '@/lib/config/abis';
import {
  bpsRateToAprPercentage,
  bpsRateToPerSecondRate,
} from '@/lib/web3/fluid';

// XAUT/USDT vault on Ethereum mainnet
const XAUT_USDT_VAULT = '0xEce156BeD5aF2621b80b87ff4fE8fD3A929E3644';

// Skip these tests in CI unless a dedicated RPC URL is provided
// Public RPC endpoints are unreliable and can cause flaky test failures
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
const shouldSkip = process.env.CI === 'true' && !ETHEREUM_RPC_URL;

// Create a public client for Ethereum mainnet
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(ETHEREUM_RPC_URL),
});

// Use describe.skipIf to conditionally skip in CI without dedicated RPC
const describeIntegration = shouldSkip ? describe.skip : describe;

describeIntegration('Fluid VaultResolver RPC Integration', () => {
  describe('getVaultEntireData', () => {
    it('should successfully call getVaultEntireData and extract borrowRateVault', async () => {
      // This test makes a LIVE RPC call to Ethereum mainnet
      const vaultData = await publicClient.readContract({
        address: FLUID_VAULT_RESOLVER_ADDR,
        abi: FLUID_VAULT_RESOLVER_ABI,
        functionName: 'getVaultEntireData',
        args: [XAUT_USDT_VAULT],
      });

      // Verify we got a response with the expected structure
      expect(vaultData).toBeDefined();
      expect(vaultData.vault).toBe(XAUT_USDT_VAULT);

      // Verify exchangePricesAndRates struct exists and has borrowRateVault
      expect(vaultData.exchangePricesAndRates).toBeDefined();
      expect(vaultData.exchangePricesAndRates.borrowRateVault).toBeDefined();
      expect(typeof vaultData.exchangePricesAndRates.borrowRateVault).toBe('bigint');

      // Verify supplyRateVault also exists
      expect(vaultData.exchangePricesAndRates.supplyRateVault).toBeDefined();
      expect(typeof vaultData.exchangePricesAndRates.supplyRateVault).toBe('bigint');
    }, 30000); // 30 second timeout for RPC call

    it('should return borrowRateVault in basis points format (reasonable APR range)', async () => {
      const vaultData = await publicClient.readContract({
        address: FLUID_VAULT_RESOLVER_ADDR,
        abi: FLUID_VAULT_RESOLVER_ABI,
        functionName: 'getVaultEntireData',
        args: [XAUT_USDT_VAULT],
      });

      const borrowRateBps = vaultData.exchangePricesAndRates.borrowRateVault;
      const aprPercent = bpsRateToAprPercentage(borrowRateBps);

      console.log(`[INTEGRATION TEST] borrowRateVault (bps): ${borrowRateBps.toString()}`);
      console.log(`[INTEGRATION TEST] APR: ${aprPercent.toFixed(2)}%`);

      // APR should be in a reasonable range for DeFi lending (0.1% to 50%)
      // If this fails with a very small number (like 0.001%), the ABI is likely wrong
      // If this fails with a huge number, the rate format assumption is wrong
      expect(aprPercent).toBeGreaterThan(0.1);
      expect(aprPercent).toBeLessThan(50);

      // Specifically for XAUT/USDT vault, we expect ~5% APR based on Fluid UI
      // Allow wide range (1-15%) to account for rate fluctuations
      expect(aprPercent).toBeGreaterThan(1);
      expect(aprPercent).toBeLessThan(15);
    }, 30000);

    it('should correctly convert bps rate to per-second rate format', async () => {
      const vaultData = await publicClient.readContract({
        address: FLUID_VAULT_RESOLVER_ADDR,
        abi: FLUID_VAULT_RESOLVER_ABI,
        functionName: 'getVaultEntireData',
        args: [XAUT_USDT_VAULT],
      });

      const borrowRateBps = vaultData.exchangePricesAndRates.borrowRateVault;
      const perSecondRate = bpsRateToPerSecondRate(borrowRateBps);

      // Verify the per-second rate is a positive bigint
      expect(perSecondRate).toBeGreaterThan(BigInt(0));

      // Verify round-trip: per-second rate should convert back to approximately the same APR
      const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
      const calculatedApr = (Number(perSecondRate) / 1e18) * SECONDS_PER_YEAR * 100;
      const directApr = bpsRateToAprPercentage(borrowRateBps);

      // Should be within 0.1% of each other (accounting for precision loss)
      expect(Math.abs(calculatedApr - directApr)).toBeLessThan(0.1);
    }, 30000);

    it('should have valid configs struct with collateralFactor', async () => {
      const vaultData = await publicClient.readContract({
        address: FLUID_VAULT_RESOLVER_ADDR,
        abi: FLUID_VAULT_RESOLVER_ABI,
        functionName: 'getVaultEntireData',
        args: [XAUT_USDT_VAULT],
      });

      // Verify configs struct exists
      expect(vaultData.configs).toBeDefined();
      expect(vaultData.configs.collateralFactor).toBeDefined();
      expect(vaultData.configs.liquidationThreshold).toBeDefined();

      // Collateral factor should be in basis points (e.g., 7500 = 75%)
      const collateralFactorBps = Number(vaultData.configs.collateralFactor);
      const collateralFactorPercent = collateralFactorBps / 100;

      console.log(`[INTEGRATION TEST] Collateral Factor: ${collateralFactorPercent}%`);

      // Should be in reasonable range (50-90%)
      expect(collateralFactorPercent).toBeGreaterThan(50);
      expect(collateralFactorPercent).toBeLessThan(95);
    }, 30000);

    it('should have valid constantVariables struct with token addresses', async () => {
      const vaultData = await publicClient.readContract({
        address: FLUID_VAULT_RESOLVER_ADDR,
        abi: FLUID_VAULT_RESOLVER_ABI,
        functionName: 'getVaultEntireData',
        args: [XAUT_USDT_VAULT],
      });

      // Verify constantVariables struct exists
      expect(vaultData.constantVariables).toBeDefined();
      expect(vaultData.constantVariables.supplyToken).toBeDefined();
      expect(vaultData.constantVariables.borrowToken).toBeDefined();

      // Token addresses should be valid (not zero address or malformed)
      const supplyToken = vaultData.constantVariables.supplyToken;
      const borrowToken = vaultData.constantVariables.borrowToken;

      // Should be valid Ethereum addresses (42 chars including 0x)
      expect(supplyToken.length).toBe(42);
      expect(borrowToken.length).toBe(42);
      expect(supplyToken).not.toBe('0x0000000000000000000000000000000000000000');
      expect(borrowToken).not.toBe('0x0000000000000000000000000000000000000000');

      console.log(`[INTEGRATION TEST] Supply token (from resolver): ${supplyToken}`);
      console.log(`[INTEGRATION TEST] Borrow token (from resolver): ${borrowToken}`);
    }, 30000);
  });

  describe('ABI structure validation', () => {
    it('should not throw "Bytes value is not a valid boolean" error', async () => {
      // This specific error was caused by incorrect boolean fields in the ABI
      // If the ABI has wrong field types, viem will throw this error during decoding

      // This should NOT throw
      await expect(
        publicClient.readContract({
          address: FLUID_VAULT_RESOLVER_ADDR,
          abi: FLUID_VAULT_RESOLVER_ABI,
          functionName: 'getVaultEntireData',
          args: [XAUT_USDT_VAULT],
        })
      ).resolves.toBeDefined();
    }, 30000);

    it('should match the expected nested struct layout', async () => {
      const vaultData = await publicClient.readContract({
        address: FLUID_VAULT_RESOLVER_ADDR,
        abi: FLUID_VAULT_RESOLVER_ABI,
        functionName: 'getVaultEntireData',
        args: [XAUT_USDT_VAULT],
      });

      // Verify all expected top-level structs exist
      expect(vaultData.vault).toBeDefined();
      expect(vaultData.constantVariables).toBeDefined();
      expect(vaultData.configs).toBeDefined();
      expect(vaultData.exchangePricesAndRates).toBeDefined();
      expect(vaultData.totalSupplyAndBorrow).toBeDefined();
      expect(vaultData.limitsAndAvailability).toBeDefined();
      expect(vaultData.vaultState).toBeDefined();
      expect(vaultData.liquidityUserSupplyData).toBeDefined();
      expect(vaultData.liquidityUserBorrowData).toBeDefined();

      // Verify nested struct within vaultState
      expect(vaultData.vaultState.currentBranchState).toBeDefined();
    }, 30000);
  });
});
