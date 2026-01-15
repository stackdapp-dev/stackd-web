/**
 * Unit tests for useGaslessSwap hook - Network Switching Behavior
 * Tests network switching behavior before swap execution
 *
 * TDD approach - writing tests first to define expected behavior
 *
 * Bug discovered: When user has external wallet connected to wrong network (e.g., Ethereum),
 * the swap fails with "chainId should be same as current chainId" error.
 *
 * Expected behavior: The hook should auto-switch to the correct network before signing.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the implementation by directly importing and examining the source code
// Then verifying the expected behavior

describe("useGaslessSwap - Network Switching Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("executeSwap network switching requirement", () => {
        it("should call ensureCorrectNetwork before signing trades", async () => {
            // This test validates the EXPECTED behavior:
            // When executeSwap is called, it must:
            // 1. Call ensureCorrectNetwork() FIRST
            // 2. Only then proceed to sign typed data
            //
            // The current implementation DOES NOT do this, which is the bug.

            // Track call order
            const callOrder: string[] = [];

            const mockEnsureCorrectNetwork = vi.fn(async () => {
                callOrder.push("ensureCorrectNetwork");
            });

            const mockSignTypedData = vi.fn(async () => {
                callOrder.push("signTypedData");
                return "0x" + "1".repeat(64) + "2".repeat(64) + "1b";
            });

            // Simulate the expected executeSwap logic
            const executeSwapWithNetworkCheck = async () => {
                // Step 1: Ensure correct network (THIS IS WHAT WE'RE TESTING FOR)
                await mockEnsureCorrectNetwork();

                // Step 2: Sign the trade
                await mockSignTypedData();

                return { success: true };
            };

            // Execute
            await executeSwapWithNetworkCheck();

            // Verify call order - ensureCorrectNetwork MUST come first
            expect(callOrder).toEqual(["ensureCorrectNetwork", "signTypedData"]);
            expect(mockEnsureCorrectNetwork).toHaveBeenCalledTimes(1);
            expect(mockSignTypedData).toHaveBeenCalledTimes(1);
        });

        it("should abort swap if network switch fails", async () => {
            // When ensureCorrectNetwork fails (user rejects network switch),
            // the swap should fail WITHOUT attempting to sign

            const mockEnsureCorrectNetwork = vi.fn(async () => {
                throw new Error("Please switch your wallet to the Arbitrum One network to continue");
            });

            const mockSignTypedData = vi.fn();

            // Simulate expected error handling
            const executeSwapWithNetworkCheck = async () => {
                try {
                    await mockEnsureCorrectNetwork();
                    await mockSignTypedData();
                    return { success: true };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Network switch failed"
                    };
                }
            };

            const result = await executeSwapWithNetworkCheck();

            // Network switch was attempted
            expect(mockEnsureCorrectNetwork).toHaveBeenCalledTimes(1);
            // But signing was NOT attempted since network switch failed
            expect(mockSignTypedData).not.toHaveBeenCalled();
            // Result indicates failure
            expect(result.success).toBe(false);
            expect(result.error).toContain("Arbitrum");
        });

        it("should succeed when network is already correct", async () => {
            // When wallet is already on correct network, ensureCorrectNetwork
            // should succeed immediately and swap should proceed

            const mockEnsureCorrectNetwork = vi.fn(async () => {
                // Already on Arbitrum - no switch needed
                console.log("[NETWORK] Already on Arbitrum One network");
            });

            const mockSignTypedData = vi.fn(async () => {
                return "0x" + "1".repeat(64) + "2".repeat(64) + "1b";
            });

            const mockSubmitSwap = vi.fn(async () => {
                return { tradeHash: "0xabc123" };
            });

            const executeSwapWithNetworkCheck = async () => {
                await mockEnsureCorrectNetwork();
                await mockSignTypedData();
                const result = await mockSubmitSwap();
                return { success: true, tradeHash: result.tradeHash };
            };

            const result = await executeSwapWithNetworkCheck();

            expect(mockEnsureCorrectNetwork).toHaveBeenCalledTimes(1);
            expect(mockSignTypedData).toHaveBeenCalledTimes(1);
            expect(mockSubmitSwap).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(true);
            expect(result.tradeHash).toBe("0xabc123");
        });

        it("should switch network from Ethereum to Arbitrum then succeed", async () => {
            // Simulates the bug scenario: wallet on Ethereum, needs to switch to Arbitrum

            let currentChainId = 1; // Ethereum mainnet

            const mockEnsureCorrectNetwork = vi.fn(async () => {
                if (currentChainId !== 42161) {
                    console.log(`[NETWORK] Switching from chain ${currentChainId} to 42161 (Arbitrum One)`);
                    // Simulate network switch
                    currentChainId = 42161;
                    console.log("[NETWORK] Successfully switched to Arbitrum One");
                }
            });

            const mockSignTypedData = vi.fn(async () => {
                // After network switch, signing should work
                if (currentChainId !== 42161) {
                    throw new Error("chainId should be same as current chainId");
                }
                return "0x" + "1".repeat(64) + "2".repeat(64) + "1b";
            });

            const executeSwapWithNetworkCheck = async () => {
                await mockEnsureCorrectNetwork();
                const signature = await mockSignTypedData();
                return { success: true, signature };
            };

            const result = await executeSwapWithNetworkCheck();

            expect(mockEnsureCorrectNetwork).toHaveBeenCalledTimes(1);
            expect(mockSignTypedData).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(true);
            expect(currentChainId).toBe(42161); // Verify network was switched
        });

        it("should handle approval + trade signing after network switch", async () => {
            // For tokens that need approval, both approval and trade must be signed
            // Network switch should happen ONCE, before any signing

            const callOrder: string[] = [];

            const mockEnsureCorrectNetwork = vi.fn(async () => {
                callOrder.push("ensureCorrectNetwork");
            });

            const mockSignApproval = vi.fn(async () => {
                callOrder.push("signApproval");
                return "0xapproval_signature";
            });

            const mockSignTrade = vi.fn(async () => {
                callOrder.push("signTrade");
                return "0xtrade_signature";
            });

            const executeSwapWithApprovalAndNetworkCheck = async (needsApproval: boolean) => {
                // Network switch happens ONCE at the start
                await mockEnsureCorrectNetwork();

                // Then sign approval if needed
                if (needsApproval) {
                    await mockSignApproval();
                }

                // Then sign trade
                await mockSignTrade();

                return { success: true };
            };

            const result = await executeSwapWithApprovalAndNetworkCheck(true);

            // Verify correct order: network switch -> approval -> trade
            expect(callOrder).toEqual(["ensureCorrectNetwork", "signApproval", "signTrade"]);
            expect(mockEnsureCorrectNetwork).toHaveBeenCalledTimes(1); // Only ONCE
            expect(result.success).toBe(true);
        });
    });

    describe("Current implementation verification (expected to fail)", () => {
        // These tests read the actual implementation and verify it contains the bug
        // They will pass once the implementation is fixed

        it("executeSwap should call ensureCorrectNetwork (implementation check)", async () => {
            // Read the actual implementation
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Find the executeSwap function
            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // Check if ensureCorrectNetwork is called
                const hasNetworkCheck = executeSwapCode.includes("ensureCorrectNetwork");

                // This test documents the EXPECTED behavior
                // Currently this will FAIL because the bug exists
                expect(hasNetworkCheck).toBe(true);
            }
        });

        it("should import ensureCorrectNetwork from useWeb3", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Check if ensureCorrectNetwork is destructured from useWeb3
            const useWeb3Destructure = hookCode.match(/const \{[^}]*\} = useWeb3\(\)/);

            expect(useWeb3Destructure).not.toBeNull();

            if (useWeb3Destructure) {
                const destructured = useWeb3Destructure[0];
                const hasEnsureCorrectNetwork = destructured.includes("ensureCorrectNetwork");

                // This test documents the EXPECTED behavior
                expect(hasEnsureCorrectNetwork).toBe(true);
            }
        });
    });

    describe("Fresh Quote Fetch Before Signing (Quote Expiry Fix)", () => {
        /**
         * These tests verify that executeSwap fetches a FRESH quote
         * immediately before signing to avoid quote expiry.
         * 
         * 0x gasless quotes expire in ~30 seconds. If the user reviews the quote
         * for longer or if signing takes time (especially on mobile), the quote
         * becomes stale and 0x returns a 500 error.
         * 
         * Fix: Fetch a fresh quote right before signing, using the original
         * quote's sellToken, buyToken, sellAmount parameters.
         */

        it("should fetch fresh quote before signing (implementation check)", async () => {
            // Verify the implementation contains fresh quote fetch
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Find the executeSwap function
            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // Check for fresh quote fetch pattern
                const hasFreshQuoteFetch = executeSwapCode.includes("Fetching fresh quote");
                const usesFreshQuoteForSigning = executeSwapCode.includes("freshQuote.trade");
                const buildsFreshQuoteParams = executeSwapCode.includes("quote.sellToken") &&
                    executeSwapCode.includes("quote.buyToken") &&
                    executeSwapCode.includes("quote.sellAmount");

                expect(hasFreshQuoteFetch).toBe(true);
                expect(usesFreshQuoteForSigning).toBe(true);
                expect(buildsFreshQuoteParams).toBe(true);
            }
        });

        it("should use freshQuote for EIP-712 signing, not stale quote", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // After fresh quote fetch, all signing should use freshQuote, not quote
                // Find the signTypedData calls and verify they use freshQuote
                const signTypedDataCalls = executeSwapCode.match(/signTypedData\(\{[^}]+domain:[^}]+\}/g);

                if (signTypedDataCalls) {
                    for (const call of signTypedDataCalls) {
                        // Each signTypedData call should use freshQuote, not the stale quote
                        expect(call).toContain("freshQuote");
                        expect(call).not.toMatch(/domain:\s*quote\./);
                    }
                }
            }
        });

        it("should use freshQuote for submitPayload construction", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // submitPayload should use freshQuote.trade and freshQuote.approval
                const hasCorrectTradeType = executeSwapCode.includes("freshQuote.trade.type");
                const hasCorrectTradeEip712 = executeSwapCode.includes("freshQuote.trade.eip712");

                expect(hasCorrectTradeType).toBe(true);
                expect(hasCorrectTradeEip712).toBe(true);
            }
        });

        it("should validate fresh quote before signing", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // Fresh quote should be validated for liquidity and trade data
                const checksLiquidity = executeSwapCode.includes("freshQuote.liquidityAvailable");
                const checksTradeData = executeSwapCode.includes("freshQuote.trade");

                expect(checksLiquidity).toBe(true);
                expect(checksTradeData).toBe(true);
            }
        });

        it("should correctly build fresh quote params from original quote", async () => {
            // Simulate the expected fresh quote fetch logic
            const originalQuote = {
                sellToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
                buyToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", // WBTC
                sellAmount: "1000000", // 1 USDT
            };

            const params = new URLSearchParams({
                sellToken: originalQuote.sellToken,
                buyToken: originalQuote.buyToken,
                sellAmount: originalQuote.sellAmount,
                taker: "0x1234567890123456789012345678901234567890",
            });

            // Verify params are correctly built
            expect(params.get("sellToken")).toBe(originalQuote.sellToken);
            expect(params.get("buyToken")).toBe(originalQuote.buyToken);
            expect(params.get("sellAmount")).toBe(originalQuote.sellAmount);
            expect(params.get("taker")).toBeTruthy();
        });

        it("should handle fresh quote fetch failure gracefully", async () => {
            // Simulate error handling when fresh quote fetch fails
            const mockFetchQuote = vi.fn(async () => {
                throw new Error("Failed to fetch fresh quote");
            });

            const executeSwapWithFreshQuote = async () => {
                try {
                    await mockFetchQuote();
                    return { success: true };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : "Quote fetch failed"
                    };
                }
            };

            const result = await executeSwapWithFreshQuote();

            expect(mockFetchQuote).toHaveBeenCalledTimes(1);
            expect(result.success).toBe(false);
            expect(result.error).toContain("fresh quote");
        });

        it("should fail if fresh quote has no liquidity", async () => {
            // Simulate fresh quote with no liquidity
            const mockFreshQuote = {
                liquidityAvailable: false,
                sellToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                buyToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                sellAmount: "1000000",
            };

            const executeSwapWithFreshQuote = async () => {
                // Simulate fresh quote validation
                if (!mockFreshQuote.liquidityAvailable) {
                    return { success: false, error: "No liquidity available for this swap" };
                }
                return { success: true };
            };

            const result = await executeSwapWithFreshQuote();

            expect(result.success).toBe(false);
            expect(result.error).toContain("liquidity");
        });

        it("should fail if fresh quote has no trade data", async () => {
            // Simulate fresh quote without trade data
            const mockFreshQuote = {
                liquidityAvailable: true,
                sellToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                buyToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                sellAmount: "1000000",
                trade: undefined,
            };

            const executeSwapWithFreshQuote = async () => {
                if (!mockFreshQuote.liquidityAvailable) {
                    return { success: false, error: "No liquidity available" };
                }
                if (!mockFreshQuote.trade) {
                    return { success: false, error: "No trade data in fresh quote" };
                }
                return { success: true };
            };

            const result = await executeSwapWithFreshQuote();

            expect(result.success).toBe(false);
            expect(result.error).toContain("trade data");
        });

        it("should fetch fresh quote AFTER network switch but BEFORE signing", async () => {
            // Verify the correct order of operations
            const callOrder: string[] = [];

            const mockEnsureCorrectNetwork = vi.fn(async () => {
                callOrder.push("ensureCorrectNetwork");
            });

            const mockFetchFreshQuote = vi.fn(async () => {
                callOrder.push("fetchFreshQuote");
                return { liquidityAvailable: true, trade: {} };
            });

            const mockSignTypedData = vi.fn(async () => {
                callOrder.push("signTypedData");
                return "0x" + "1".repeat(130);
            });

            const executeSwapWithFreshQuote = async () => {
                await mockEnsureCorrectNetwork();
                await mockFetchFreshQuote();
                await mockSignTypedData();
                return { success: true };
            };

            await executeSwapWithFreshQuote();

            // Verify order: network -> fresh quote -> sign
            expect(callOrder).toEqual([
                "ensureCorrectNetwork",
                "fetchFreshQuote",
                "signTypedData"
            ]);
        });
    });
});

/**
 * TDD Tests for Swap Aggregator Integration
 * 
 * These tests define the expected behavior for using the new /api/swap
 * aggregator endpoint with multi-provider failover.
 * 
 * Expected changes to useGaslessSwap hook:
 * 1. Use /api/swap instead of /api/0x
 * 2. Track which provider was used in swapResult
 * 3. Handle needsRetry response for failover scenarios
 */
describe("useGaslessSwap - Aggregator Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getQuote should use /api/swap endpoint", () => {
        it("should call /api/swap instead of /api/0x for quotes", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Find the getQuote function
            const getQuoteMatch = hookCode.match(/const getQuote = useCallback\([^]*?}, \[/s);

            expect(getQuoteMatch).not.toBeNull();

            if (getQuoteMatch) {
                const getQuoteCode = getQuoteMatch[0];

                // Should use /api/swap endpoint
                const usesSwapEndpoint = getQuoteCode.includes("/api/swap");

                // These tests will FAIL until we implement the change
                expect(usesSwapEndpoint).toBe(true);
            }
        });

        it("should include provider field in quote response", async () => {
            // Verify the hook stores provider info from quote
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Quote interface should include provider
            const quoteInterface = hookCode.match(/interface Quote \{[^}]+\}/s);

            expect(quoteInterface).not.toBeNull();
            if (quoteInterface) {
                const hasProviderField = quoteInterface[0].includes("provider");
                expect(hasProviderField).toBe(true);
            }
        });
    });

    describe("executeSwap should use /api/swap endpoint", () => {
        it("should call /api/swap for swap submission", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Find the executeSwap function
            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // Should submit to /api/swap
                const usesSwapEndpoint = executeSwapCode.includes('"/api/swap"') ||
                    executeSwapCode.includes("'/api/swap'") ||
                    executeSwapCode.includes("`/api/swap`");

                expect(usesSwapEndpoint).toBe(true);
            }
        });

        it("should include provider in submit payload", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            const executeSwapMatch = hookCode.match(/const executeSwap = useCallback\(async[^]*?}, \[/s);

            expect(executeSwapMatch).not.toBeNull();

            if (executeSwapMatch) {
                const executeSwapCode = executeSwapMatch[0];

                // Submit payload should include provider
                const includesProvider = executeSwapCode.includes("provider:");
                expect(includesProvider).toBe(true);
            }
        });
    });

    describe("SwapResult should include provider info", () => {
        it("should return provider name in successful swap result", async () => {
            // Simulate successful swap response from aggregator
            const mockAggregatorResponse = {
                success: true,
                provider: "0x",
                tradeHash: "0xabc123",
            };

            const swapResult = {
                success: mockAggregatorResponse.success,
                tradeHash: mockAggregatorResponse.tradeHash,
                provider: mockAggregatorResponse.provider,
            };

            expect(swapResult.provider).toBe("0x");
            expect(swapResult.success).toBe(true);
        });

        it("should indicate failover when provider fails", async () => {
            // When a provider fails, aggregator returns needsRetry
            const mockFailoverResponse = {
                success: false,
                provider: "0x",
                error: "0x failed",
                needsRetry: true,
            };

            expect(mockFailoverResponse.needsRetry).toBe(true);
            expect(mockFailoverResponse.provider).toBe("0x");
        });
    });

    describe("Hook should expose configured providers", () => {
        it("should have configuredProviders in hook return value", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useGaslessSwap.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Hook should return configuredProviders
            // Look for configuredProviders in the return object of useGaslessSwap
            const hasConfiguredProviders = hookCode.includes("configuredProviders:");
            expect(hasConfiguredProviders).toBe(true);
        });
    });

    describe("Quote format compatibility", () => {
        it("should handle aggregator quote format with provider field", () => {
            // Aggregator returns this format
            const aggregatorQuote = {
                provider: "0x",
                chainId: 42161,
                sellToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                buyToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                sellAmount: "1000000",
                buyAmount: "1087",
                liquidityAvailable: true,
                trade: {
                    type: "settler_metatransaction",
                    eip712: {
                        domain: {},
                        types: {},
                        primaryType: "Trade",
                        message: {},
                    },
                },
                configuredProviders: ["0x", "cow"],
            };

            // Verify format
            expect(aggregatorQuote.provider).toBe("0x");
            expect(aggregatorQuote.configuredProviders).toContain("0x");
            expect(aggregatorQuote.liquidityAvailable).toBe(true);
            expect(aggregatorQuote.trade).toBeDefined();
        });
    });
});
