import { NextRequest, NextResponse } from "next/server";

const OX_API_URL = "https://api.0x.org";
const ARBITRUM_CHAIN_ID = 42161;

// Token addresses on Arbitrum
const TOKENS: Record<string, string> = {
    WBTC: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

const TOKEN_DECIMALS: Record<string, number> = {
    WBTC: 8,
    USDT: 6,
};

// GET /api/0x - Get gasless quote
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sellToken = searchParams.get("sellToken");
    const buyToken = searchParams.get("buyToken");
    const sellAmount = searchParams.get("sellAmount");
    const taker = searchParams.get("taker");

    // Get API key from env
    const apiKey = process.env.OX_API_KEY;
    if (!apiKey) {
        console.error("[0x] Missing OX_API_KEY environment variable");
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    if (!sellToken || !buyToken || !sellAmount || !taker) {
        return NextResponse.json(
            { error: "Missing required parameters: sellToken, buyToken, sellAmount, taker" },
            { status: 400 }
        );
    }

    try {
        const sellTokenAddress = TOKENS[sellToken] || sellToken;
        const buyTokenAddress = TOKENS[buyToken] || buyToken;

        const params = new URLSearchParams({
            chainId: ARBITRUM_CHAIN_ID.toString(),
            sellToken: sellTokenAddress,
            buyToken: buyTokenAddress,
            sellAmount,
            taker,
        });

        console.log("[0x] Fetching gasless quote:", params.toString());

        const response = await fetch(`${OX_API_URL}/gasless/quote?${params}`, {
            headers: {
                "Content-Type": "application/json",
                "0x-api-key": apiKey,
                "0x-version": "v2",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[0x] Quote error:", response.status, errorText);

            return NextResponse.json(
                {
                    error: `0x API error: ${response.status}`,
                    status: response.status,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("[0x] Quote response received");
        return NextResponse.json(data);
    } catch (error) {
        console.error("[0x] Quote fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch quote" },
            { status: 500 }
        );
    }
}

// POST /api/0x - Submit gasless swap
export async function POST(request: NextRequest) {
    // Get API key from env
    const apiKey = process.env.OX_API_KEY;
    if (!apiKey) {
        console.error("[0x] Missing OX_API_KEY environment variable");
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        console.log("[0x] Submit request:", JSON.stringify({
            chainId: body.chainId,
            tradeType: body.trade?.type,
            hasApproval: !!body.approval,
        }));

        const response = await fetch(`${OX_API_URL}/gasless/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "0x-api-key": apiKey,
                "0x-version": "v2",
            },
            body: JSON.stringify(body),
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error("[0x] Submit error:", response.status, responseText);
            return NextResponse.json(
                { error: `0x API error: ${response.status}` },
                { status: response.status }
            );
        }

        // Parse the response text as JSON for success case
        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch (error) {
        console.error("[0x] Submit error:", error);
        return NextResponse.json(
            { error: "Failed to submit swap" },
            { status: 500 }
        );
    }
}
