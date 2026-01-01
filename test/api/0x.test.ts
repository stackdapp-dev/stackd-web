/**
 * Unit tests for /api/0x endpoint
 * Tests 0x gasless swap API integration
 * 
 * TDD approach - writing tests first to define expected behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// We need to mock environment variables BEFORE importing the route
const mockEnv = {
    OX_API_KEY: "test-api-key-12345",
};

// Store original env
const originalEnv = { ...process.env };

describe("/api/0x", () => {
    let GET: (request: NextRequest) => Promise<Response>;
    let POST: (request: NextRequest) => Promise<Response>;

    beforeEach(async () => {
        // Reset mocks
        vi.resetModules();
        vi.restoreAllMocks();

        // Set up environment
        process.env = { ...originalEnv, ...mockEnv };

        // Import fresh module for each test
        const module = await import("@/app/api/0x/route");
        GET = module.GET;
        POST = module.POST;
    });

    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    // ============================================
    // GET /api/0x - Quote Endpoint Tests
    // ============================================
    describe("GET /api/0x (Quote)", () => {
        describe("Success Scenarios", () => {
            it("should return a valid quote for WBTC -> USDT swap", async () => {
                // Mock successful 0x API response
                const mockQuote = {
                    liquidityAvailable: true,
                    buyAmount: "1000000", // 1 USDT (6 decimals)
                    buyToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                    sellAmount: "100000", // 0.001 WBTC (8 decimals)
                    sellToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                    totalNetworkFee: "0",
                    trade: {
                        type: "settler_metatransaction",
                        hash: "0x1234567890abcdef",
                        eip712: {
                            domain: {},
                            types: {},
                            primaryType: "MetaTransaction",
                            message: {},
                        },
                    },
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockQuote,
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x1234567890123456789012345678901234567890"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.liquidityAvailable).toBe(true);
                expect(data.buyAmount).toBe("1000000");
                expect(data.trade).toBeDefined();
            });

            it("should return a valid quote for USDT -> WBTC swap", async () => {
                const mockQuote = {
                    liquidityAvailable: true,
                    buyAmount: "100000", // 0.001 WBTC
                    buyToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                    sellAmount: "1000000", // 1 USDT
                    sellToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                    trade: {
                        type: "settler_metatransaction",
                        hash: "0xabcdef",
                        eip712: { domain: {}, types: {}, primaryType: "Test", message: {} },
                    },
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockQuote,
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=USDT&buyToken=WBTC&sellAmount=1000000&taker=0x1234567890123456789012345678901234567890"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.liquidityAvailable).toBe(true);
            });

            it("should include approval data when token needs approval", async () => {
                const mockQuote = {
                    liquidityAvailable: true,
                    buyAmount: "1000000",
                    buyToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                    sellAmount: "100000",
                    sellToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                    approval: {
                        type: "permit",
                        hash: "0xapproval",
                        eip712: { domain: {}, types: {}, primaryType: "Permit", message: {} },
                    },
                    trade: {
                        type: "settler_metatransaction",
                        hash: "0xtrade",
                        eip712: { domain: {}, types: {}, primaryType: "Trade", message: {} },
                    },
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockQuote,
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x1234567890123456789012345678901234567890"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.approval).toBeDefined();
                expect(data.approval.type).toBe("permit");
            });
        });

        describe("Parameter Validation Failures", () => {
            it("should return 400 when sellToken is missing", async () => {
                const request = new NextRequest(
                    "http://localhost/api/0x?buyToken=USDT&sellAmount=100000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("Missing required parameters");
            });

            it("should return 400 when buyToken is missing", async () => {
                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&sellAmount=100000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("Missing required parameters");
            });

            it("should return 400 when sellAmount is missing", async () => {
                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("Missing required parameters");
            });

            it("should return 400 when taker is missing", async () => {
                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("Missing required parameters");
            });

            it("should return 400 when all parameters are missing", async () => {
                const request = new NextRequest("http://localhost/api/0x");

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("Missing required parameters");
            });
        });

        describe("API Configuration Failures", () => {
            it("should return 500 when OX_API_KEY is not configured", async () => {
                // Remove the API key
                delete process.env.OX_API_KEY;

                // Re-import module to pick up new env
                vi.resetModules();
                const module = await import("@/app/api/0x/route");
                const GETWithoutKey = module.GET;

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
                );

                const response = await GETWithoutKey(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toContain("API key not configured");
            });
        });

        describe("0x API Error Responses", () => {
            it("should return error when 0x API returns 400 (bad request)", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                    text: async () => JSON.stringify({ reason: "SELL_AMOUNT_TOO_SMALL" }),
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=1&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("0x API error");
            });

            it("should return error when 0x API returns 429 (rate limited)", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    text: async () => "Rate limit exceeded",
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(429);
                expect(data.error).toContain("0x API error");
            });

            it("should return error when 0x API returns 500 (server error)", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    text: async () => "Internal server error",
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toContain("0x API error");
            });

            it("should return 500 when fetch throws network error", async () => {
                global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toBe("Failed to fetch quote");
            });
        });

        describe("Liquidity Issues", () => {
            it("should return quote with liquidityAvailable=false when no liquidity", async () => {
                const mockQuote = {
                    liquidityAvailable: false,
                    buyAmount: "0",
                    buyToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                    sellAmount: "100000",
                    sellToken: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockQuote,
                });

                const request = new NextRequest(
                    "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
                );

                const response = await GET(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.liquidityAvailable).toBe(false);
            });
        });
    });

    // ============================================
    // POST /api/0x - Submit Swap Endpoint Tests
    // ============================================
    describe("POST /api/0x (Submit Swap)", () => {
        describe("Success Scenarios", () => {
            it("should successfully submit a swap with trade signature", async () => {
                const mockSubmitResponse = {
                    tradeHash: "0xabc123def456",
                    status: "submitted",
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockSubmitResponse,
                });

                const submitPayload = {
                    chainId: 42161,
                    trade: {
                        type: "settler_metatransaction",
                        eip712: { domain: {}, types: {}, primaryType: "Trade", message: {} },
                        signature: {
                            r: "0x1234",
                            s: "0x5678",
                            v: 27,
                            signatureType: 2,
                        },
                    },
                };

                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: JSON.stringify(submitPayload),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.tradeHash).toBe("0xabc123def456");
            });

            it("should successfully submit a swap with approval and trade signatures", async () => {
                const mockSubmitResponse = {
                    tradeHash: "0xfullswap",
                    status: "submitted",
                };

                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockSubmitResponse,
                });

                const submitPayload = {
                    chainId: 42161,
                    approval: {
                        type: "permit",
                        eip712: { domain: {}, types: {}, primaryType: "Permit", message: {} },
                        signature: { r: "0xapproval_r", s: "0xapproval_s", v: 28, signatureType: 2 },
                    },
                    trade: {
                        type: "settler_metatransaction",
                        eip712: { domain: {}, types: {}, primaryType: "Trade", message: {} },
                        signature: { r: "0xtrade_r", s: "0xtrade_s", v: 27, signatureType: 2 },
                    },
                };

                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: JSON.stringify(submitPayload),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.tradeHash).toBe("0xfullswap");
            });
        });

        describe("API Configuration Failures", () => {
            it("should return 500 when OX_API_KEY is not configured", async () => {
                delete process.env.OX_API_KEY;

                vi.resetModules();
                const module = await import("@/app/api/0x/route");
                const POSTWithoutKey = module.POST;

                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: JSON.stringify({ chainId: 42161, trade: {} }),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POSTWithoutKey(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toContain("API key not configured");
            });
        });

        describe("0x API Error Responses", () => {
            it("should return error when 0x API rejects the submission", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                    text: async () => JSON.stringify({ reason: "INVALID_SIGNATURE" }),
                });

                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: JSON.stringify({ chainId: 42161, trade: {} }),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toContain("0x API error");
            });

            it("should return error when 0x API returns 500", async () => {
                global.fetch = vi.fn().mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    text: async () => "Internal server error",
                });

                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: JSON.stringify({ chainId: 42161, trade: {} }),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toContain("0x API error");
            });

            it("should return 500 when fetch throws network error", async () => {
                global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: JSON.stringify({ chainId: 42161, trade: {} }),
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toBe("Failed to submit swap");
            });
        });

        describe("Invalid Request Body", () => {
            it("should return 500 when body is not valid JSON", async () => {
                const request = new NextRequest("http://localhost/api/0x", {
                    method: "POST",
                    body: "not valid json",
                    headers: { "Content-Type": "application/json" },
                });

                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.error).toBe("Failed to submit swap");
            });
        });
    });

    // ============================================
    // Token Address Resolution Tests
    // ============================================
    describe("Token Address Resolution", () => {
        it("should resolve WBTC symbol to correct Arbitrum address", async () => {
            const mockQuote = { liquidityAvailable: true, buyAmount: "1", sellAmount: "1", trade: {} };

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuote,
            });

            const request = new NextRequest(
                "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
            );

            await GET(request);

            // Verify the fetch call used the correct token addresses
            const fetchCall = (global.fetch as any).mock.calls[0][0] as string;
            expect(fetchCall).toContain("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f"); // WBTC
            expect(fetchCall).toContain("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"); // USDT
        });

        it("should pass through raw addresses if not in TOKENS mapping", async () => {
            const mockQuote = { liquidityAvailable: true, buyAmount: "1", sellAmount: "1", trade: {} };

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuote,
            });

            const customAddress = "0xCustomTokenAddress123456789012345678901234";
            const request = new NextRequest(
                `http://localhost/api/0x?sellToken=${customAddress}&buyToken=USDT&sellAmount=100000&taker=0x123`
            );

            await GET(request);

            const fetchCall = (global.fetch as any).mock.calls[0][0] as string;
            expect(fetchCall).toContain(customAddress);
        });
    });

    // ============================================
    // API Headers Tests
    // ============================================
    describe("0x API Request Headers", () => {
        it("should include correct headers in quote request", async () => {
            const mockQuote = { liquidityAvailable: true, buyAmount: "1", sellAmount: "1" };

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockQuote,
            });

            const request = new NextRequest(
                "http://localhost/api/0x?sellToken=WBTC&buyToken=USDT&sellAmount=100000&taker=0x123"
            );

            await GET(request);

            const [, fetchOptions] = (global.fetch as any).mock.calls[0];
            expect(fetchOptions.headers["0x-api-key"]).toBe("test-api-key-12345");
            expect(fetchOptions.headers["0x-version"]).toBe("v2");
            expect(fetchOptions.headers["Content-Type"]).toBe("application/json");
        });

        it("should include correct headers in submit request", async () => {
            const mockResponse = { tradeHash: "0x123" };

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const request = new NextRequest("http://localhost/api/0x", {
                method: "POST",
                body: JSON.stringify({ chainId: 42161, trade: {} }),
                headers: { "Content-Type": "application/json" },
            });

            await POST(request);

            const [, fetchOptions] = (global.fetch as any).mock.calls[0];
            expect(fetchOptions.headers["0x-api-key"]).toBe("test-api-key-12345");
            expect(fetchOptions.headers["0x-version"]).toBe("v2");
        });
    });
});
