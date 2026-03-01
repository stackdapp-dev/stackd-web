import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Web3Provider - Gas Boost Integration", () => {
  const web3ProviderCode = readFileSync(
    join(__dirname, "../../src/providers/Web3Provider.tsx"),
    "utf-8"
  );

  it("should import boostGasFees from gas boost utility", () => {
    expect(web3ProviderCode).toMatch(/import.*boostGasFees.*from/);
  });

  it("should only apply gas boost for Ethereum mainnet transactions", () => {
    // Gas boost should be gated behind an Ethereum mainnet check
    expect(web3ProviderCode).toMatch(/isEthereumMainnet/);
    expect(web3ProviderCode).toMatch(/mainnet\.id/);
  });

  it("should not spread gas overrides into sponsored transaction requests", () => {
    // The sponsored (embedded wallet) path should NOT include gasOverrides
    // Extract the sponsored tx block and verify no gasOverrides spread
    const sponsoredBlock = web3ProviderCode.match(
      /if \(shouldSponsor\)[\s\S]*?privySendTransaction\(\s*\{([\s\S]*?)\}\s*,/
    );
    expect(sponsoredBlock).toBeTruthy();
    expect(sponsoredBlock![1]).not.toMatch(/gasOverrides/);
  });

  it("should spread gas overrides into external wallet transaction requests", () => {
    // The external wallet path should include gasOverrides
    const externalBlock = web3ProviderCode.match(
      /Using regular transaction[\s\S]*?privySendTransaction\(\s*\{([\s\S]*?)\}\s*,/
    );
    expect(externalBlock).toBeTruthy();
    expect(externalBlock![1]).toMatch(/gasOverrides/);
  });

  it("should set type: 2 (EIP-1559) when gas overrides are present", () => {
    expect(web3ProviderCode).toMatch(/type:\s*2/);
  });
});
