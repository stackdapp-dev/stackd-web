import { NextRequest, NextResponse } from "next/server";

const OX_API_URL = "https://api.0x.org";

// Token addresses by chain
const TOKENS: Record<string, Record<number, string>> = {
    WBTC: {
        1: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        42161: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    },
    USDT: {
        1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    },
    XAUT: {
        1: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
    },
    ETH: {
        1: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        42161: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    },
};

// GET /api/0x - Get gasless quote
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sellToken = searchParams.get("sellToken");
    const buyToken = searchParams.get("buyToken");
    const sellAmount = searchParams.get("sellAmount");
    const taker = searchParams.get("taker");
    const chainIdStr = searchParams.get("chainId") || "42161";

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

    const chainId = parseInt(chainIdStr);

    try {
        const sellTokenAddress = TOKENS[sellToken]?.[chainId] || sellToken;
        const buyTokenAddress = TOKENS[buyToken]?.[chainId] || buyToken;

        const params = new URLSearchParams({
            chainId: chainId.toString(),
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

            // Try to parse the error for better messaging
            let parsedError = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                parsedError = errorJson.reason || errorJson.description || errorJson.message || errorText;
            } catch {
                // Keep original text
            }

            return NextResponse.json(
                {
                    error: `0x API error: ${response.status} - ${parsedError}`,
                    status: response.status,
                    details: errorText
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

        // Enhanced logging for debugging signature issues - JSON stringify to avoid truncation
        console.log("[0x] Submit request:", JSON.stringify({
            chainId: body.chainId,
            tradeType: body.trade?.type,
            tradeSig: body.trade?.signature ? { v: body.trade.signature.v, r: body.trade.signature.r?.slice(0, 10), s: body.trade.signature.s?.slice(0, 10), signatureType: body.trade.signature.signatureType } : null,
            approvalSig: body.approval?.signature ? { v: body.approval.signature.v, signatureType: body.approval.signature.signatureType } : null,
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

        // Log response status immediately
        console.log("[0x] Submit response status:", response.status);

        const responseText = await response.text();
        console.log("[0x] Submit response body:", responseText.slice(0, 500));

        if (!response.ok) {
            return NextResponse.json(
                { error: `0x API error: ${response.status} - ${responseText}` },
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
