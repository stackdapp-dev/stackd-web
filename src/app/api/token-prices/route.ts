import { NextResponse } from "next/server";

// CoinGecko API ID mapping
const COINGECKO_IDS: Record<string, string> = {
    WBTC: "bitcoin", // WBTC tracks BTC price
    USDT: "tether",
    ETH: "ethereum",
};

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";

// Cache for 60 seconds to avoid rate limiting
let cache: { data: Record<string, { usd: number }>; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

// Fallback prices when API is unavailable (used during tests/builds)
const FALLBACK_PRICES: Record<string, { usd: number }> = {
    WBTC: { usd: 87000 },
    USDT: { usd: 1 },
    ETH: { usd: 2900 },
};

export async function GET() {
    try {
        // Check cache first
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        // Get all CoinGecko IDs
        const coinIds = Object.values(COINGECKO_IDS).join(",");

        // Fetch from CoinGecko
        const response = await fetch(
            `${COINGECKO_API_URL}?ids=${coinIds}&vs_currencies=usd`,
            {
                headers: {
                    Accept: "application/json",
                },
                next: { revalidate: 60 }, // Next.js cache for 60s
            }
        );

        // Handle rate limiting (429) gracefully
        if (response.status === 429) {
            console.warn("[API] CoinGecko rate limited, using fallback prices");
            return NextResponse.json(cache?.data || FALLBACK_PRICES);
        }

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const coingeckoData = await response.json();

        // Map CoinGecko response to our token symbols
        const prices: Record<string, { usd: number }> = {};
        for (const [symbol, coinId] of Object.entries(COINGECKO_IDS)) {
            if (coingeckoData[coinId]?.usd) {
                prices[symbol] = { usd: coingeckoData[coinId].usd };
            }
        }

        // Update cache
        cache = { data: prices, timestamp: Date.now() };

        return NextResponse.json(prices);
    } catch (error) {
        console.error("[API] Token prices error:", error);

        // Return cached data if available, even if expired
        if (cache) {
            return NextResponse.json(cache.data);
        }

        // Return fallback prices as last resort
        return NextResponse.json(FALLBACK_PRICES);
    }
}

