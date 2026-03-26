/**
 * TDD Tests for useWalletBalance ETH Display
 *
 * These tests verify that ETH is displayed in asset rows for ALL users,
 * not just external wallets. This is needed because passkey/Privy embedded
 * wallets interacting with Tether Gold (XAUT) Fluid loan functions don't
 * use sponsored transactions yet - users need ETH for gas on Ethereum mainnet.
 *
 * The fix should ensure:
 * - ETH is NOT filtered out for internal wallets
 * - ETH balance comes from Ethereum mainnet (not Arbitrum)
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("useWalletBalance - ETH Display for All Users", () => {
  const hookPath = path.resolve(
    process.cwd(),
    "src/hooks/useWalletBalance.ts"
  );

  let hookCode: string;

  beforeAll(() => {
    hookCode = fs.readFileSync(hookPath, "utf-8");
  });

  describe("ETH filter removal", () => {
    it("should NOT filter out ETH based on isExternalWallet", () => {
      // The old code had this filter that excluded ETH for internal wallets:
      // .filter(([key]) => key !== "ETH" || isExternalWallet)
      // This should be removed so ETH shows for all users

      const hasEthExternalWalletFilter = hookCode.includes(
        'key !== "ETH" || isExternalWallet'
      );

      expect(hasEthExternalWalletFilter).toBe(false);
    });

    it("should not have isExternalWallet in assets useMemo dependencies", () => {
      // The assets useMemo should not depend on isExternalWallet
      // Look for the dependency array pattern after the assets useMemo
      const assetsIndex = hookCode.indexOf("const assets: Asset[] = useMemo");
      expect(assetsIndex).toBeGreaterThan(-1);

      // Get the next 500 chars to find the dependency array
      const assetsBlock = hookCode.slice(assetsIndex, assetsIndex + 500);

      // Should NOT contain isExternalWallet in the dependency array
      // The old code had: }, [ethBalance, tokenBalances, tokenPrices, isExternalWallet]);
      expect(assetsBlock).not.toContain("isExternalWallet");
    });
  });

  describe("Ethereum mainnet ETH balance", () => {
    it("should use ethereumData.ethBalance for the top-level ethBalance variable", () => {
      // The top-level ETH balance should come from Ethereum mainnet since that's where
      // gas is needed for Fluid/XAUT operations
      // Note: arbitrumData?.ethBalance may appear in chainBalances for per-chain tracking,
      // but the main ethBalance variable must use ethereumData

      const usesEthereumEth = hookCode.includes("ethereumData?.ethBalance");
      expect(usesEthereumEth).toBe(true);

      // Inside useWalletBalance function, the ethBalance assignment should reference ethereumData
      const hookFnStart = hookCode.indexOf("export function useWalletBalance");
      const hookBody = hookCode.slice(hookFnStart);
      const ethBalanceLine = hookBody.match(/const ethBalance = .+/);
      expect(ethBalanceLine).not.toBeNull();
      expect(ethBalanceLine![0]).toContain("ethereumData");
    });
  });

  describe("ETH in TOKEN_METADATA", () => {
    it("should include ETH in the assets array when iterating TOKEN_METADATA", () => {
      // Verify the code iterates over TOKEN_METADATA which includes ETH
      expect(hookCode).toContain("Object.entries(TOKEN_METADATA)");
    });
  });
});
