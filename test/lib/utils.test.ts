/**
 * Unit tests for lib/utils.ts
 * Achieving 100% coverage on all utility functions
 */
import { describe, it, expect } from "vitest";
import {
    cn,
    abbreviateNumber,
    formatAmount,
    formatCurrency,
    formatPercent,
    maskString,
    MASK_SHORT,
    MASK_LONG,
    formatAddress,
    formatDate,
    shortenAddress,
    getPrivyUserIdentifier,
    formatTokenAmount,
} from "@/lib/utils";

describe("cn (className merge)", () => {
    it("should merge class names correctly", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
        expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
    });

    it("should handle Tailwind class conflicts", () => {
        expect(cn("p-4", "p-2")).toBe("p-2");
    });
});

describe("abbreviateNumber", () => {
    it("should abbreviate thousands with K", () => {
        expect(abbreviateNumber(1500, 1)).toBe("1.5K");
    });

    it("should abbreviate millions with M", () => {
        expect(abbreviateNumber(1500000, 2)).toBe("1.50M");
    });

    it("should abbreviate billions with B", () => {
        expect(abbreviateNumber(1500000000, 1)).toBe("1.5B");
    });

    it("should handle negative numbers", () => {
        expect(abbreviateNumber(-2500, 1)).toBe("-2.5K");
    });

    it("should not abbreviate small numbers", () => {
        expect(abbreviateNumber(500, 2)).toBe("500.00");
    });
});

describe("formatAmount", () => {
    it("should format regular numbers", () => {
        expect(formatAmount(1234.5678)).toBe("1,234.5678");
    });

    it("should handle null", () => {
        expect(formatAmount(null)).toBe("0");
    });

    it("should handle undefined", () => {
        expect(formatAmount(undefined)).toBe("0");
    });

    it("should handle non-finite numbers", () => {
        expect(formatAmount(Infinity)).toBe("0");
        expect(formatAmount(NaN)).toBe("0");
    });

    it("should show '< 0.0001' for tiny positive numbers", () => {
        expect(formatAmount(0.00001)).toBe("< 0.0001");
    });

    it("should respect custom decimals", () => {
        expect(formatAmount(1.123456, 2)).toBe("1.12");
    });
});

describe("formatCurrency", () => {
    it("should format with dollar sign", () => {
        expect(formatCurrency(100)).toBe("$100.00");
    });

    it("should abbreviate large numbers", () => {
        expect(formatCurrency(1500000)).toBe("$1.5M");
    });

    it("should handle null", () => {
        expect(formatCurrency(null)).toBe("$0");
    });

    it("should handle undefined", () => {
        expect(formatCurrency(undefined)).toBe("$0");
    });

    it("should handle non-finite numbers", () => {
        expect(formatCurrency(Infinity)).toBe("$0");
    });

    it("should use custom currency symbol", () => {
        expect(formatCurrency(100, 2, "€")).toBe("€100.00");
    });

    it("should not abbreviate when disabled", () => {
        expect(formatCurrency(5000, 2, "$", false)).toBe("$5,000.00");
    });
});

describe("formatPercent", () => {
    it("should format percentage", () => {
        expect(formatPercent(50.5)).toBe("50.50%");
    });

    it("should handle null", () => {
        expect(formatPercent(null)).toBe("0%");
    });

    it("should handle undefined", () => {
        expect(formatPercent(undefined)).toBe("0%");
    });

    it("should handle non-finite numbers", () => {
        expect(formatPercent(NaN)).toBe("0%");
    });

    it("should respect custom decimals", () => {
        expect(formatPercent(33.3333, 1)).toBe("33.3%");
    });
});

describe("maskString", () => {
    it("should show value when visible is true", () => {
        expect(maskString("secret", true)).toBe("secret");
    });

    it("should mask value when visible is false", () => {
        expect(maskString("secret", false)).toBe(MASK_SHORT);
    });

    it("should use custom mask", () => {
        expect(maskString("secret", false, MASK_LONG)).toBe(MASK_LONG);
    });
});

describe("formatAddress", () => {
    it("should cast string to 0x prefixed type", () => {
        const result = formatAddress("0x1234567890abcdef");
        expect(result).toBe("0x1234567890abcdef");
    });
});

describe("formatDate", () => {
    it("should format ISO date to mm/dd/yy hh:mm", () => {
        const result = formatDate("2024-01-15T14:30:00Z");
        // Note: exact output depends on timezone, just check format
        expect(result).toMatch(/\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    });
});

describe("shortenAddress", () => {
    it("should shorten long addresses", () => {
        expect(shortenAddress("0x1234567890abcdef1234567890abcdef12345678"))
            .toBe("0x1234...5678");
    });

    it("should return short addresses unchanged", () => {
        expect(shortenAddress("0x1234")).toBe("0x1234");
    });

    it("should handle empty string", () => {
        expect(shortenAddress("")).toBe("");
    });

    it("should respect custom char count", () => {
        expect(shortenAddress("0x1234567890abcdef1234567890abcdef12345678", 6))
            .toBe("0x123456...345678");
    });
});

describe("getPrivyUserIdentifier", () => {
    it("should return email if available", () => {
        expect(getPrivyUserIdentifier({ email: { address: "test@example.com" } }))
            .toBe("test@example.com");
    });

    it("should return phone if no email", () => {
        expect(getPrivyUserIdentifier({ phone: { number: "+1234567890" } }))
            .toBe("+1234567890");
    });

    it("should return Google email", () => {
        expect(getPrivyUserIdentifier({ google: { email: "google@gmail.com" } }))
            .toBe("google@gmail.com");
    });

    it("should return Google name if no email", () => {
        expect(getPrivyUserIdentifier({ google: { name: "John Doe" } }))
            .toBe("John Doe");
    });

    it("should return Twitter username with @", () => {
        expect(getPrivyUserIdentifier({ twitter: { username: "johndoe" } }))
            .toBe("@johndoe");
    });

    it("should return Twitter name if no username", () => {
        expect(getPrivyUserIdentifier({ twitter: { name: "John Doe" } }))
            .toBe("John Doe");
    });

    it("should return Discord username", () => {
        expect(getPrivyUserIdentifier({ discord: { username: "user#1234" } }))
            .toBe("user#1234");
    });

    it("should return GitHub username", () => {
        expect(getPrivyUserIdentifier({ github: { username: "gituser" } }))
            .toBe("gituser");
    });

    it("should return Farcaster username", () => {
        expect(getPrivyUserIdentifier({ farcaster: { username: "farcasteruser" } }))
            .toBe("farcasteruser");
    });

    it("should return Telegram username with @", () => {
        expect(getPrivyUserIdentifier({ telegram: { username: "teleuser" } }))
            .toBe("@teleuser");
    });

    it("should return Telegram firstName if no username", () => {
        expect(getPrivyUserIdentifier({ telegram: { firstName: "Tele" } }))
            .toBe("Tele");
    });

    it("should return shortened wallet address", () => {
        expect(getPrivyUserIdentifier({
            wallet: { address: "0x1234567890abcdef1234567890abcdef12345678" }
        })).toBe("0x1234...5678");
    });

    it("should return shortened address from linkedAccounts", () => {
        expect(getPrivyUserIdentifier({
            linkedAccounts: [{ type: "wallet", address: "0xabcdef1234567890" }]
        })).toBe("0xabcd...7890");
    });

    it("should return User ID as fallback", () => {
        expect(getPrivyUserIdentifier({ id: "user-id-12345678" }))
            .toBe("User user-id-");
    });

    it("should return '--' for null user", () => {
        expect(getPrivyUserIdentifier(null)).toBe("--");
    });

    it("should return '--' for empty user", () => {
        expect(getPrivyUserIdentifier({})).toBe("--");
    });
});

describe("formatTokenAmount", () => {
    describe("WBTC formatting (8 decimals)", () => {
        it("should format small WBTC amounts correctly (the bug fix)", () => {
            // 12745 wei with 8 decimals = 0.00012745 WBTC
            // This was the bug: it was returning "0" instead of "0.00012745"
            expect(formatTokenAmount("12745", 8)).toBe("0.00012745");
        });

        it("should format very small WBTC amounts", () => {
            // 1 wei = 0.00000001 WBTC
            expect(formatTokenAmount("1", 8)).toBe("0.00000001");
        });

        it("should format whole WBTC amounts", () => {
            // 100000000 wei = 1 WBTC
            expect(formatTokenAmount("100000000", 8)).toBe("1");
        });

        it("should format WBTC with mixed whole and fractional parts", () => {
            // 150000000 wei = 1.5 WBTC
            expect(formatTokenAmount("150000000", 8)).toBe("1.5");
        });

        it("should handle WBTC amounts with trailing zeros in fractional part", () => {
            // 123450000 wei = 1.2345 WBTC
            expect(formatTokenAmount("123450000", 8)).toBe("1.2345");
        });
    });

    describe("USDT formatting (6 decimals)", () => {
        it("should format whole USDT amounts", () => {
            // 1000000 wei = 1 USDT
            expect(formatTokenAmount("1000000", 6)).toBe("1");
        });

        it("should format USDT with cents", () => {
            // 1500000 wei = 1.5 USDT
            expect(formatTokenAmount("1500000", 6)).toBe("1.5");
        });

        it("should format small USDT amounts", () => {
            // 1000 wei = 0.001 USDT
            expect(formatTokenAmount("1000", 6)).toBe("0.001");
        });

        it("should format USDT with full precision", () => {
            // 1234567 wei = 1.234567 USDT
            expect(formatTokenAmount("1234567", 6)).toBe("1.234567");
        });
    });

    describe("edge cases", () => {
        it("should handle zero amount", () => {
            expect(formatTokenAmount("0", 8)).toBe("0");
        });

        it("should handle bigint input", () => {
            expect(formatTokenAmount(12745n, 8)).toBe("0.00012745");
        });

        it("should handle large amounts", () => {
            // 1000000000000 wei with 8 decimals = 10000 WBTC
            expect(formatTokenAmount("1000000000000", 8)).toBe("10000");
        });

        it("should preserve all significant digits for fractional amounts", () => {
            // 12345678 wei with 8 decimals = 0.12345678
            expect(formatTokenAmount("12345678", 8)).toBe("0.12345678");
        });
    });
});
