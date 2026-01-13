/**
 * Unit tests for /api/swap endpoint and swap providers
 *
 * Tests the unified swap aggregator API with multi-provider failover.
 * Each provider adapter is tested for quote and submit functionality.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock environment variables
const mockEnv = {
    OX_API_KEY: "test-0x-api-key",
    ONEINCH_API_KEY: "test-1inch-api-key",
};

describe("/api/swap - Unified Swap Aggregator", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.OX_API_KEY = mockEnv.OX_API_KEY;
        process.env.ONEINCH_API_KEY = mockEnv.ONEINCH_API_KEY;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("GET /api/swap (Quote)", () => {
        describe("Success Scenarios", () => {
            it("should return quote from CoW provider (first in order)", async () => {
                const mockCowResponse = {
                    quote: {
                        sellAmount: "1000000",
                        buyAmount: "1000",
                        validTo: 9999999999,
                        feeAmount: "100",
                        kind: "sell",
                        partiallyFillable: false,
                        sellTokenBalance: "erc20",
                        buyTokenBalance: "erc20",
                    },
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockCowResponse,
                });

                const { GET } = await import("@/app/api/swap/route");

                const request = new NextRequest(
                    "http://localhost/api/swap?chainId=42161&sellToken=USDT&buyToken=WBTC&sellAmount=1000000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.provider).toBe("cow");
                expect(data.liquidityAvailable).toBe(true);
            });

            it("should failover to 1inch when CoW fails", async () => {
                // CoW fails, 1inch succeeds
                global.fetch = vi.fn()
                    .mockRejectedValueOnce(new Error("CoW API unavailable"))
                    .mockResolvedValueOnce({
                        ok: true,
                        json: async () => ({
                            toTokenAmount: "999",
                            order: {
                                typedData: {
                                    domain: {},
                                    types: {},
                                    primaryType: "Order",
                                    message: {},
                                },
                            },
                        }),
                    });

                const { GET } = await import("@/app/api/swap/route");

                const request = new NextRequest(
                    "http://localhost/api/swap?chainId=42161&sellToken=USDT&buyToken=WBTC&sellAmount=1000000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.provider).toBe("1inch");
            });

            it("should include configuredProviders in response", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        quote: {
                            sellAmount: "1000000",
                            buyAmount: "1000",
                            validTo: 9999999999,
                            feeAmount: "100",
                            kind: "sell",
                            partiallyFillable: false,
                            sellTokenBalance: "erc20",
                            buyTokenBalance: "erc20",
                        },
                    }),
                });

                const { GET } = await import("@/app/api/swap/route");

                const request = new NextRequest(
                    "http://localhost/api/swap?chainId=42161&sellToken=USDT&buyToken=WBTC&sellAmount=1000000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(data.configuredProviders).toBeDefined();
                expect(Array.isArray(data.configuredProviders)).toBe(true);
            });
        });

        describe("Error Scenarios", () => {
            it("should return 400 for missing parameters", async () => {
                const { GET } = await import("@/app/api/swap/route");

                const request = new NextRequest(
                    "http://localhost/api/swap?chainId=42161&sellToken=USDT"
                );

                const response = await GET(request);
                expect(response.status).toBe(400);
            });

            it("should return 400 for invalid chainId", async () => {
                const { GET } = await import("@/app/api/swap/route");

                const request = new NextRequest(
                    "http://localhost/api/swap?chainId=999&sellToken=USDT&buyToken=WBTC&sellAmount=1000000&taker=0x123"
                );

                const response = await GET(request);
                expect(response.status).toBe(400);
            });

            it("should return 503 when all providers fail", async () => {
                global.fetch = vi.fn()
                    .mockRejectedValue(new Error("All providers failed"));

                const { GET } = await import("@/app/api/swap/route");

                const request = new NextRequest(
                    "http://localhost/api/swap?chainId=42161&sellToken=USDT&buyToken=WBTC&sellAmount=1000000&taker=0x123"
                );

                const response = await GET(request);
                expect(response.status).toBe(503);
            });
        });
    });

    describe("POST /api/swap (Submit)", () => {
        describe("Success Scenarios", () => {
            it("should submit swap via 0x provider", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    text: async () => JSON.stringify({
                        tradeHash: "0xabc123",
                        zid: "0xzid123",
                    }),
                });

                const { POST } = await import("@/app/api/swap/route");

                const submitPayload = {
                    chainId: 42161,
                    provider: "0x",
                    trade: {
                        type: "settler_metatransaction",
                        eip712: { domain: {}, types: {}, primaryType: "Trade", message: {} },
                        signature: { r: "0x1234", s: "0x5678", v: 27, signatureType: 2 },
                    },
                };

                const request = new NextRequest("http://localhost/api/swap", {
                    method: "POST",
                    body: JSON.stringify(submitPayload),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.provider).toBe("0x");
                expect(data.tradeHash).toBe("0xabc123");
            });

            it("should submit swap via 1inch provider", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    text: async () => JSON.stringify({
                        orderHash: "0x1inch_order_123",
                    }),
                });

                const { POST } = await import("@/app/api/swap/route");

                const submitPayload = {
                    chainId: 42161,
                    provider: "1inch",
                    trade: {
                        type: "fusion_order",
                        eip712: { domain: {}, types: {}, primaryType: "Order", message: {} },
                        signature: { r: "0x1234", s: "0x5678", v: 28 },
                    },
                };

                const request = new NextRequest("http://localhost/api/swap", {
                    method: "POST",
                    body: JSON.stringify(submitPayload),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.provider).toBe("1inch");
            });

            it("should submit swap via CoW provider", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    text: async () => '"0xcow_order_uid_123"',
                });

                const { POST } = await import("@/app/api/swap/route");

                const submitPayload = {
                    chainId: 42161,
                    provider: "cow",
                    trade: {
                        type: "cow_order",
                        eip712: {
                            domain: {},
                            types: {},
                            primaryType: "Order",
                            message: {
                                sellToken: "0xUsdt",
                                buyToken: "0xWbtc",
                            },
                        },
                        signature: { r: "0x1234", s: "0x5678", v: 27 },
                    },
                };

                const request = new NextRequest("http://localhost/api/swap", {
                    method: "POST",
                    body: JSON.stringify(submitPayload),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.provider).toBe("cow");
            });
        });

        describe("Error Scenarios", () => {
            it("should return 400 for missing required fields", async () => {
                const { POST } = await import("@/app/api/swap/route");

                const request = new NextRequest("http://localhost/api/swap", {
                    method: "POST",
                    body: JSON.stringify({ chainId: 42161 }),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                expect(response.status).toBe(400);
            });

            it("should return 500 with needsRetry when provider fails", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    text: async () => '{"error":"Internal error"}',
                });

                const { POST } = await import("@/app/api/swap/route");

                const submitPayload = {
                    chainId: 42161,
                    provider: "0x",
                    trade: {
                        type: "settler_metatransaction",
                        eip712: { domain: {}, types: {}, primaryType: "Trade", message: {} },
                        signature: { r: "0x1234", s: "0x5678", v: 27, signatureType: 2 },
                    },
                };

                const request = new NextRequest("http://localhost/api/swap", {
                    method: "POST",
                    body: JSON.stringify(submitPayload),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.needsRetry).toBe(true);
            });
        });
    });
});

describe("Swap Provider Adapters", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.OX_API_KEY = mockEnv.OX_API_KEY;
        process.env.ONEINCH_API_KEY = mockEnv.ONEINCH_API_KEY;
    });

    describe("0x Provider", () => {
        it("should format quote request correctly", async () => {
            let capturedUrl = "";
            global.fetch = vi.fn().mockImplementation((url) => {
                capturedUrl = url.toString();
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ liquidityAvailable: true, buyAmount: "1000" }),
                });
            });

            const { zeroXProvider } = await import("@/lib/swap/providers/0x");

            await zeroXProvider.getQuote({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            });

            expect(capturedUrl).toContain("api.0x.org/gasless/quote");
            expect(capturedUrl).toContain("chainId=42161");
            expect(capturedUrl).toContain("sellToken=0xUsdt");
        });

        it("should include correct headers", async () => {
            let capturedHeaders: Record<string, string> = {};
            global.fetch = vi.fn().mockImplementation((url, options) => {
                capturedHeaders = options?.headers || {};
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ liquidityAvailable: true }),
                });
            });

            const { zeroXProvider } = await import("@/lib/swap/providers/0x");

            await zeroXProvider.getQuote({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            });

            expect(capturedHeaders["0x-api-key"]).toBe(mockEnv.OX_API_KEY);
            expect(capturedHeaders["0x-version"]).toBe("v2");
        });
    });

    describe("1inch Provider", () => {
        it("should format quote request correctly", async () => {
            let capturedUrl = "";
            global.fetch = vi.fn().mockImplementation((url) => {
                capturedUrl = url.toString();
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ toTokenAmount: "1000" }),
                });
            });

            const { oneInchProvider } = await import("@/lib/swap/providers/1inch");

            await oneInchProvider.getQuote({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            });

            expect(capturedUrl).toContain("api.1inch.dev/fusion");
            expect(capturedUrl).toContain("42161");
        });

        it("should include authorization header", async () => {
            let capturedHeaders: Record<string, string> = {};
            global.fetch = vi.fn().mockImplementation((url, options) => {
                capturedHeaders = options?.headers || {};
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ toTokenAmount: "1000" }),
                });
            });

            const { oneInchProvider } = await import("@/lib/swap/providers/1inch");

            await oneInchProvider.getQuote({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            });

            expect(capturedHeaders["Authorization"]).toContain("Bearer");
        });
    });

    describe("CoW Provider", () => {
        it("should format quote request correctly", async () => {
            let capturedUrl = "";
            let capturedBody = {};
            global.fetch = vi.fn().mockImplementation((url, options) => {
                capturedUrl = url.toString();
                capturedBody = JSON.parse(options?.body || "{}");
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        quote: {
                            sellAmount: "1000000",
                            buyAmount: "1000",
                            validTo: 9999999999,
                            feeAmount: "100",
                            kind: "sell",
                            partiallyFillable: false,
                            sellTokenBalance: "erc20",
                            buyTokenBalance: "erc20",
                        },
                    }),
                });
            });

            const { cowProvider } = await import("@/lib/swap/providers/cow");

            await cowProvider.getQuote({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            });

            expect(capturedUrl).toContain("api.cow.fi/arbitrum_one");
            expect(capturedBody).toHaveProperty("sellToken", "0xUsdt");
            expect(capturedBody).toHaveProperty("kind", "sell");
        });

        it("should not require API key", async () => {
            delete process.env.ONEINCH_API_KEY;

            let capturedHeaders: Record<string, string> = {};
            global.fetch = vi.fn().mockImplementation((url, options) => {
                capturedHeaders = options?.headers || {};
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        quote: {
                            sellAmount: "1000000",
                            buyAmount: "1000",
                            validTo: 9999999999,
                            feeAmount: "100",
                            kind: "sell",
                            partiallyFillable: false,
                            sellTokenBalance: "erc20",
                            buyTokenBalance: "erc20",
                        },
                    }),
                });
            });

            const { cowProvider } = await import("@/lib/swap/providers/cow");

            // Should not throw even without API key
            await expect(cowProvider.getQuote({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            })).resolves.toBeDefined();

            // No Authorization header needed
            expect(capturedHeaders["Authorization"]).toBeUndefined();
        });
    });
});

describe("Swap Aggregator Failover Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.OX_API_KEY = mockEnv.OX_API_KEY;
        process.env.ONEINCH_API_KEY = mockEnv.ONEINCH_API_KEY;
    });

    it("should try providers in order (CoW -> 1inch -> 0x) until one succeeds", async () => {
        const providersCalled: string[] = [];

        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes("cow.fi")) {
                providersCalled.push("cow");
                return Promise.reject(new Error("CoW down"));
            }
            if (url.includes("1inch.dev")) {
                providersCalled.push("1inch");
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ toTokenAmount: "1000" }),
                });
            }
            if (url.includes("0x.org")) {
                providersCalled.push("0x");
                return Promise.reject(new Error("0x down"));
            }
            return Promise.reject(new Error("Unknown provider"));
        });

        const { getQuoteWithFailover } = await import("@/lib/swap/aggregator");

        const quote = await getQuoteWithFailover({
            chainId: 42161,
            sellToken: "0xUsdt",
            buyToken: "0xWbtc",
            sellAmount: "1000000",
            takerAddress: "0xTaker",
        });

        expect(providersCalled).toContain("cow");
        expect(providersCalled).toContain("1inch");
        expect(quote.provider).toBe("1inch");
    });

    it("should throw AllProvidersFailedError when all fail", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("All down"));

        const { getQuoteWithFailover, AllProvidersFailedError } = await import("@/lib/swap/aggregator");

        await expect(getQuoteWithFailover({
            chainId: 42161,
            sellToken: "0xUsdt",
            buyToken: "0xWbtc",
            sellAmount: "1000000",
            takerAddress: "0xTaker",
        })).rejects.toThrow(AllProvidersFailedError);
    });

    it("should record errors from each failed provider", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Provider error"));

        const { getQuoteWithFailover, AllProvidersFailedError } = await import("@/lib/swap/aggregator");

        try {
            await getQuoteWithFailover({
                chainId: 42161,
                sellToken: "0xUsdt",
                buyToken: "0xWbtc",
                sellAmount: "1000000",
                takerAddress: "0xTaker",
            });
        } catch (error) {
            expect(error).toBeInstanceOf(AllProvidersFailedError);
            if (error instanceof AllProvidersFailedError) {
                expect(error.errors).toHaveProperty("cow");
            }
        }
    });
});
