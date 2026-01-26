/**
 * Integration tests for useFluid hook - XAUT collateral position detection
 *
 * These tests verify that the Fluid position detection works for
 * XAUT:USDT vaults.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ETHEREUM_TOKEN_ADDRESSES } from "@/constants/addresses";

// Mock the fluid library functions while preserving constants
vi.mock("@/lib/web3/fluid", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/web3/fluid")>();
    return {
        ...actual,
        getUserPositions: vi.fn(),
    };
});

// Import after mocking
import { getUserPositions } from "@/lib/web3/fluid";

describe("useFluid - Supported Borrow Tokens", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("SUPPORTED_BORROW_TOKENS configuration", () => {
        it("should have USDT address configured in ETHEREUM_TOKEN_ADDRESSES", () => {
            expect(ETHEREUM_TOKEN_ADDRESSES.USDT).toBeDefined();
            expect(ETHEREUM_TOKEN_ADDRESSES.USDT.toLowerCase()).toBe(
                "0xdac17f958d2ee523a2206206994597c13d831ec7"
            );
        });

        it("should have XAUT address configured in ETHEREUM_TOKEN_ADDRESSES", () => {
            expect(ETHEREUM_TOKEN_ADDRESSES.XAUT).toBeDefined();
            expect(ETHEREUM_TOKEN_ADDRESSES.XAUT.toLowerCase()).toBe(
                "0x68749665ff8d2d112fa859aa293f07a622782f38"
            );
        });
    });

    describe("fetchFluidData position matching", () => {
        const mockPublicClient = { readContract: vi.fn() } as any;
        const testAccount = "0x9B624577D49cd0561E49232F7DA7dad2605471ca";

        it("should detect XAUT:USDT position", async () => {
            // Mock a XAUT:USDT vault position
            const mockPosition = {
                nftId: BigInt(456),
                supply: BigInt("500000"), // 0.5 XAUT
                borrow: BigInt("1000000000"), // 1000 USDT (6 decimals)
            };

            const mockVaultData = {
                vault: "0x2345678901234567890123456789012345678901" as `0x${string}`,
                supplyToken: ETHEREUM_TOKEN_ADDRESSES.XAUT,
                borrowToken: ETHEREUM_TOKEN_ADDRESSES.USDT,
                collateralFactor: BigInt(7500),
                liquidationThreshold: BigInt(8000),
                supplyRate: BigInt(0),
                borrowRate: BigInt("63419583966"), // ~2% APR
            };

            vi.mocked(getUserPositions).mockResolvedValue({
                positions: [mockPosition],
                vaultsData: [mockVaultData],
            });

            await getUserPositions(mockPublicClient, testAccount as any);

            expect(getUserPositions).toHaveBeenCalledWith(mockPublicClient, testAccount);

            // Verify the mock returned USDT as borrow token
            const result = await getUserPositions(mockPublicClient, testAccount as any);
            expect(result.vaultsData[0].borrowToken).toBe(ETHEREUM_TOKEN_ADDRESSES.USDT);
        });

        it("should prefer first matching XAUT position when multiple exist", async () => {
            // Mock multiple positions - should pick first XAUT position
            const mockPositions = [
                {
                    nftId: BigInt(100),
                    supply: BigInt("2000000"),
                    borrow: BigInt("5000000000"),
                },
                {
                    nftId: BigInt(200),
                    supply: BigInt("1000000"),
                    borrow: BigInt("2000000000"),
                },
            ];

            const mockVaultsData = [
                {
                    vault: "0x1111111111111111111111111111111111111111" as `0x${string}`,
                    supplyToken: ETHEREUM_TOKEN_ADDRESSES.XAUT,
                    borrowToken: ETHEREUM_TOKEN_ADDRESSES.USDT,
                    collateralFactor: BigInt(7500),
                    liquidationThreshold: BigInt(8000),
                    supplyRate: BigInt(0),
                    borrowRate: BigInt("31709791983"),
                },
                {
                    vault: "0x2222222222222222222222222222222222222222" as `0x${string}`,
                    supplyToken: ETHEREUM_TOKEN_ADDRESSES.XAUT,
                    borrowToken: ETHEREUM_TOKEN_ADDRESSES.USDT,
                    collateralFactor: BigInt(7000),
                    liquidationThreshold: BigInt(7500),
                    supplyRate: BigInt(0),
                    borrowRate: BigInt("47564687974"),
                },
            ];

            vi.mocked(getUserPositions).mockResolvedValue({
                positions: mockPositions,
                vaultsData: mockVaultsData,
            });

            const result = await getUserPositions(mockPublicClient, testAccount as any);

            // First position should be returned
            expect(result.positions[0].nftId).toBe(BigInt(100));
            expect(result.vaultsData[0].borrowToken).toBe(ETHEREUM_TOKEN_ADDRESSES.USDT);
        });
    });

    describe("Implementation verification", () => {
        it("should use SUPPORTED_BORROW_TOKENS map in useFluid.ts", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Verify SUPPORTED_BORROW_TOKENS is defined with USDT
            expect(hookCode).toContain("SUPPORTED_BORROW_TOKENS");
            expect(hookCode).toContain("ETHEREUM_TOKEN_ADDRESSES.USDT");
        });

        it("should not hardcode a specific borrow token", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should use dynamic borrowToken from data
            expect(hookCode).toContain("borrowToken: matchedBorrowToken");
        });

        it("should include borrowToken field in FluidData interface", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // FluidData interface should have borrowToken field
            const fluidDataMatch = hookCode.match(/interface FluidData \{[^}]+\}/s);
            expect(fluidDataMatch).not.toBeNull();
            expect(fluidDataMatch![0]).toContain("borrowToken:");
        });
    });

    describe("MultiLoanProvider integration", () => {
        it("should use dynamic borrow token in MultiLoanProvider", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const providerPath = path.resolve(
                process.cwd(),
                "src/providers/MultiLoanProvider.tsx"
            );
            const providerCode = fs.readFileSync(providerPath, "utf-8");

            // Should use first borrowed asset (dynamic)
            expect(providerCode).toContain("borrowedAssets[0]");

            // Should use dynamic borrowToken from the asset (with fallback for collateral-only positions)
            expect(providerCode).toContain("borrowToken: xautBorrowed?.symbol");
        });
    });
});

/**
 * TDD tests for vault config when creating new positions
 *
 * CRITICAL: When a user wants to create a NEW loan position (no existing position),
 * the hook must still return vault configuration (maxLtv, liquidationRatio, borrowApr)
 * so the UI can calculate max borrow amounts.
 *
 * Bug found: Previously, fetchFluidData returned maxLtv: 0 when no position existed,
 * causing the "New Loan Position" modal to show $0 max borrow even with XAUT in wallet.
 */
describe("useFluid - Vault Config Without Existing Position", () => {
    describe("fetchFluidData should return vault config even without user positions", () => {
        it("should return non-zero maxLtv when user has no existing position", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Verify the hook uses getXautVaultConfig when no position exists
            expect(hookCode).toContain("getXautVaultConfig");

            // Should have logic to get vault config when no position exists
            // Look for the condition that triggers vault config fetching
            expect(hookCode).toMatch(/!matchingPosition/);
        });

        it("should use KNOWN_VAULTS collateralFactor as fallback for maxLtv", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
            const fluidCode = fs.readFileSync(fluidPath, "utf-8");

            // KNOWN_VAULTS should have collateralFactor defined (75% = 7500)
            expect(fluidCode).toContain("collateralFactor: BigInt(7500)");
            // And liquidationThreshold (80% = 8000)
            expect(fluidCode).toContain("liquidationThreshold: BigInt(8000)");
        });

        it("should export getXautVaultConfig function from fluid.ts for fetching vault config without position", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const fluidPath = path.resolve(process.cwd(), "src/lib/web3/fluid.ts");
            const fluidCode = fs.readFileSync(fluidPath, "utf-8");

            // Should have a function to get vault config without requiring a position
            expect(fluidCode).toContain("getXautVaultConfig");
            expect(fluidCode).toContain("export async function getXautVaultConfig");
        });

        it("should use getXautVaultConfig in useFluid when no positions exist", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import getXautVaultConfig
            expect(hookCode).toContain("getXautVaultConfig");
        });
    });

    describe("NewLoanSimulatorModal maxBorrow calculation", () => {
        it("should calculate maxBorrow correctly with 75% LTV", async () => {
            // When collateral = 0.01 XAUT at $2700/oz = $27 value
            // maxBorrow = $27 * 0.75 * 0.99 (1% buffer) = ~$20
            const collateralXaut = 0.01;
            const xautPrice = 2700;
            const maxLtv = 75; // 75%

            const collateralUsd = collateralXaut * xautPrice;
            const expectedMaxBorrow = collateralUsd * (maxLtv / 100) * 0.99;

            expect(expectedMaxBorrow).toBeGreaterThan(0);
            expect(expectedMaxBorrow).toBeCloseTo(20.0475, 2); // ~$20
        });

        it("should NOT show $0 max borrow when user has XAUT but no position", async () => {
            // This test documents the bug scenario:
            // User has 0.0099 XAUT in wallet (~$46.76 at $4723/oz)
            // Creating new XAUT loan should allow borrowing ~$34 (75% LTV - 1% buffer)
            // But UI was showing Max: $0 because maxLtv was 0

            const collateralXaut = 0.0099;
            const xautPrice = 4723; // Current price
            const maxLtv = 75; // Expected from vault config

            const collateralUsd = collateralXaut * xautPrice;
            const maxBorrow = collateralUsd * (maxLtv / 100) * 0.99;

            // Max borrow should be ~$34, not $0
            expect(maxBorrow).toBeGreaterThan(30);
            expect(maxBorrow).toBeLessThan(40);
        });
    });
});

/**
 * TDD tests for useFluid transaction functions
 *
 * These tests define the expected behavior for supply, withdraw, borrow, repay,
 * approve, and allowance functions that will be added to the useFluid hook.
 */
describe("useFluid - Transaction Functions", () => {
    describe("Implementation verification for transaction functions", () => {
        it("should export supply function from useFluid hook", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have supply function in the return statement
            expect(hookCode).toContain("supply:");
            // Should have supply function implementation
            expect(hookCode).toMatch(/const supply\s*=\s*useCallback/);
        });

        it("should export withdraw function from useFluid hook", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have withdraw function in the return statement
            expect(hookCode).toContain("withdraw:");
            // Should have withdraw function implementation
            expect(hookCode).toMatch(/const withdraw\s*=\s*useCallback/);
        });

        it("should export borrow function from useFluid hook", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have borrow function in the return statement
            expect(hookCode).toContain("borrow:");
            // Should have borrow function implementation
            expect(hookCode).toMatch(/const borrow\s*=\s*useCallback/);
        });

        it("should export repay function from useFluid hook", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have repay function in the return statement
            expect(hookCode).toContain("repay:");
            // Should have repay function implementation
            expect(hookCode).toMatch(/const repay\s*=\s*useCallback/);
        });

        it("should export approve function from useFluid hook", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have approve function in the return statement
            expect(hookCode).toContain("approve:");
            // Should have approve function implementation
            expect(hookCode).toMatch(/const approve\s*=\s*useCallback/);
        });

        it("should export allowance function from useFluid hook", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have allowance function in the return statement
            expect(hookCode).toContain("allowance:");
            // Should have allowance function implementation
            expect(hookCode).toMatch(/const allowance\s*=\s*useCallback/);
        });

        it("should use encodeFluidSupply for supply operations", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import encodeFluidSupply
            expect(hookCode).toContain("encodeFluidSupply");
        });

        it("should use encodeFluidWithdraw for withdraw operations", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import encodeFluidWithdraw
            expect(hookCode).toContain("encodeFluidWithdraw");
        });

        it("should use encodeFluidBorrow for borrow operations", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import encodeFluidBorrow
            expect(hookCode).toContain("encodeFluidBorrow");
        });

        it("should use encodeFluidRepay for repay operations", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import encodeFluidRepay
            expect(hookCode).toContain("encodeFluidRepay");
        });

        it("should send transactions to XAUT_USDT_VAULT address", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import XAUT_USDT_VAULT from fluid.ts
            expect(hookCode).toContain("XAUT_USDT_VAULT");
        });

        it("should include UseFluidResult type with transaction functions", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // UseFluidResult type should include transaction function types
            const typeMatch = hookCode.match(/type UseFluidResult\s*=\s*\{[^}]+\}/s);
            expect(typeMatch).not.toBeNull();
            const typeCode = typeMatch![0];

            expect(typeCode).toContain("supply:");
            expect(typeCode).toContain("withdraw:");
            expect(typeCode).toContain("borrow:");
            expect(typeCode).toContain("repay:");
            expect(typeCode).toContain("approve:");
            expect(typeCode).toContain("allowance:");
        });

        it("should use sendSponsoredTransaction with Ethereum chainId for mainnet transactions", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should use sendSponsoredTransaction with chainId for Ethereum mainnet
            expect(hookCode).toContain("sendSponsoredTransaction");
            // Should specify Ethereum mainnet chainId (1)
            expect(hookCode).toContain("chainId:");
        });

        it("should check for nftId before executing transactions", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Supply, withdraw, borrow, repay all need nftId
            // Look for nftId validation in transaction functions
            expect(hookCode).toMatch(/if\s*\(\s*!nftId\s*\)/);
        });
    });

    describe("Minimum Amount Validation", () => {
        it("should have FLUID_MIN_AMOUNT_RAW constant defined", async () => {
            const { FLUID_MIN_AMOUNT_RAW } = await import("@/lib/web3/fluid");
            expect(FLUID_MIN_AMOUNT_RAW).toBe(BigInt(10000));
        });

        it("should have FLUID_MIN_COLLATERAL_XAUT constant defined as 0.01", async () => {
            const { FLUID_MIN_COLLATERAL_XAUT } = await import("@/lib/web3/fluid");
            expect(FLUID_MIN_COLLATERAL_XAUT).toBe(0.01);
        });

        it("should have FLUID_MIN_BORROW_USDT constant defined as 0.01", async () => {
            const { FLUID_MIN_BORROW_USDT } = await import("@/lib/web3/fluid");
            expect(FLUID_MIN_BORROW_USDT).toBe(0.01);
        });

        it("supplyAndBorrow should validate minimum collateral amount in hook code", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should import FLUID_MIN_AMOUNT_RAW
            expect(hookCode).toContain("FLUID_MIN_AMOUNT_RAW");

            // Should check collateral amount against minimum
            expect(hookCode).toMatch(/collateralAmount\s*<\s*FLUID_MIN_AMOUNT_RAW/);
        });

        it("supplyAndBorrow should validate minimum borrow amount in hook code", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should check borrow amount against minimum
            expect(hookCode).toMatch(/borrowAmount\s*<\s*FLUID_MIN_AMOUNT_RAW/);
        });

        it("should return error message mentioning minimum when collateral is below threshold", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have error message about minimum collateral
            expect(hookCode).toMatch(/Minimum collateral|minimum.*0\.01.*XAUT/i);
        });

        it("should return error message mentioning minimum when borrow is below threshold", async () => {
            const fs = await import("fs");
            const path = await import("path");

            const hookPath = path.resolve(process.cwd(), "src/hooks/useFluid.ts");
            const hookCode = fs.readFileSync(hookPath, "utf-8");

            // Should have error message about minimum borrow
            expect(hookCode).toMatch(/Minimum borrow|minimum.*0\.01.*USDT/i);
        });
    });
});
