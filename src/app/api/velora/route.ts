import { NextRequest, NextResponse } from "next/server";

const VELORA_API_URL = "https://api.paraswap.io";
const ARBITRUM_CHAIN_ID = 42161;

// Token addresses on Arbitrum
const TOKENS = {
    WBTC: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

const TOKEN_DECIMALS = {
    WBTC: 8,
    USDT: 6,
};

// GET /api/velora/quote
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const srcToken = searchParams.get("srcToken");
    const destToken = searchParams.get("destToken");
    const amount = searchParams.get("amount");
    const userAddress = searchParams.get("userAddress");
    const side = searchParams.get("side") || "SELL";

    if (!srcToken || !destToken || !amount) {
        return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
        );
    }

    try {
        const srcTokenAddress = TOKENS[srcToken as keyof typeof TOKENS];
        const destTokenAddress = TOKENS[destToken as keyof typeof TOKENS];
        const srcDecimals = TOKEN_DECIMALS[srcToken as keyof typeof TOKEN_DECIMALS];
        const destDecimals = TOKEN_DECIMALS[destToken as keyof typeof TOKEN_DECIMALS];

        if (!srcTokenAddress || !destTokenAddress) {
            return NextResponse.json(
                { error: "Invalid token symbol" },
                { status: 400 }
            );
        }

        const params = new URLSearchParams({
            chainId: ARBITRUM_CHAIN_ID.toString(),
            srcToken: srcTokenAddress,
            destToken: destTokenAddress,
            amount,
            srcDecimals: srcDecimals.toString(),
            destDecimals: destDecimals.toString(),
            mode: "all", // Delta with fallback to market
            side,
        });

        if (userAddress) {
            params.append("userAddress", userAddress);
        }

        console.log("[Velora] Fetching quote:", params.toString());

        const response = await fetch(`${VELORA_API_URL}/quote?${params}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Velora] Quote error:", errorText);
            return NextResponse.json(
                { error: `Velora API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("[Velora] Quote response:", JSON.stringify(data).slice(0, 500));
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Velora] Quote fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch quote" },
            { status: 500 }
        );
    }
}

// POST /api/velora/quote - for building orders
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...params } = body;

        let url = "";
        let method = "POST";

        switch (action) {
            case "build":
                url = `${VELORA_API_URL}/orders/build`;
                break;
            case "submit":
                url = `${VELORA_API_URL}/orders`;
                break;
            case "status":
                url = `${VELORA_API_URL}/orders/${params.orderId}`;
                method = "GET";
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        console.log(`[Velora] ${action}:`, JSON.stringify(params).slice(0, 500));

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            ...(method === "POST" ? { body: JSON.stringify(params) } : {}),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Velora] ${action} error:`, errorText);
            return NextResponse.json(
                { error: `Velora API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log(`[Velora] ${action} response:`, JSON.stringify(data).slice(0, 500));
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Velora] Request error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
