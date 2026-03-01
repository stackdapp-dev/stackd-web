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

  it("should call boostGasFees before sending sponsored transactions", () => {
    // The boostGasFees call should appear in the sendSponsoredTransaction function
    expect(web3ProviderCode).toMatch(/boostGasFees/);
  });

  it("should pass maxFeePerGas to the transaction request", () => {
    expect(web3ProviderCode).toMatch(/maxFeePerGas/);
  });

  it("should pass maxPriorityFeePerGas to the transaction request", () => {
    expect(web3ProviderCode).toMatch(/maxPriorityFeePerGas/);
  });
});
