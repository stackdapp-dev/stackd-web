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
        
        // Enhanced logging for debugging signature issues
        console.log("[0x] Submitting gasless swap...");
        console.log("[0x] chainId:", body.chainId);
        if (body.trade?.signature) {
            console.log("[0x] Trade signature v:", body.trade.signature.v, "signatureType:", body.trade.signature.signatureType);
        }
        if (body.approval?.signature) {
            console.log("[0x] Approval signature v:", body.approval.signature.v, "signatureType:", body.approval.signature.signatureType);
        }

        const response = await fetch(`${OX_API_URL}/gasless/submit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "0x-api-key": apiKey,
                "0x-version": "v2",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[0x] Submit error:", response.status, errorText);
            return NextResponse.json(
                { error: `0x API error: ${response.status} - ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("[0x] Submit response:", data);
        return NextResponse.json(data);
    } catch (error) {
        console.error("[0x] Submit error:", error);
        return NextResponse.json(
            { error: "Failed to submit swap" },
            { status: 500 }
        );
    }
}
