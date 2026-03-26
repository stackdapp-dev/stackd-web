import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Web3Provider - Gas handling", () => {
  const web3ProviderCode = readFileSync(
    join(__dirname, "../../src/providers/Web3Provider.tsx"),
    "utf-8"
  );

  it("should NOT import boostGasFees (removed — external wallets handle their own gas)", () => {
    // Gas overrides through Privy's sendTransaction caused "Unknown connector error"
    // on external wallets (Rabby, MetaMask, Fireblocks). Removed in favor of letting
    // wallets handle their own gas estimation.
    expect(web3ProviderCode).not.toMatch(/import.*boostGasFees.*from/);
  });

  it("should NOT spread gasOverrides into any transaction request", () => {
    expect(web3ProviderCode).not.toMatch(/\.\.\.gasOverrides/);
  });

  it("should not pass maxFeePerGas or maxPriorityFeePerGas to privySendTransaction", () => {
    // External wallets handle gas estimation natively.
    // Passing these through Privy causes connector errors.
    expect(web3ProviderCode).not.toMatch(/maxFeePerGas.*privySendTransaction/s);
    expect(web3ProviderCode).not.toMatch(/privySendTransaction[\s\S]*?maxFeePerGas/);
  });

  it("should not include type: 2 in transaction params", () => {
    // EIP-1559 type should not be forced — wallet determines tx type
    expect(web3ProviderCode).not.toMatch(/type:\s*2/);
  });

  it("should have separate paths for sponsored and non-sponsored transactions", () => {
    expect(web3ProviderCode).toMatch(/shouldSponsor/);
    expect(web3ProviderCode).toMatch(/sponsor:\s*true/);
    expect(web3ProviderCode).toMatch(/sponsor:\s*false/);
  });
});
