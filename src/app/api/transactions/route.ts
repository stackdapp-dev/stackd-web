import { NextRequest, NextResponse } from "next/server";

// Etherscan API V2 - supports 60+ EVM chains with single API key
const ETHERSCAN_API_V2_URL = "https://api.etherscan.io/v2/api";

// Chain IDs for supported networks
const CHAIN_IDS = {
    arbitrum: 42161,
    ethereum: 1,
    base: 8453,
    optimism: 10,
    polygon: 137,
} as const;

// GET /api/transactions - Get transaction history
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const page = searchParams.get("page") || "1";
    const offset = searchParams.get("offset") || "10";
    const chainId = searchParams.get("chainId") || CHAIN_IDS.arbitrum.toString();

    // Get API key from env (Etherscan V2 key works across all chains)
    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
        console.error("[Etherscan] Missing ETHERSCAN_API_KEY environment variable");
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    if (!address) {
        return NextResponse.json(
            { error: "Missing required parameter: address" },
            { status: 400 }
        );
    }

    try {
        // Fetch normal transactions
        const txParams = new URLSearchParams({
            chainid: chainId,
            module: "account",
            action: "txlist",
            address,
            startblock: "0",
            endblock: "99999999",
            page,
            offset,
            sort: "desc",
            apikey: apiKey,
        });

        // Fetch ERC-20 token transfers
        const tokenParams = new URLSearchParams({
            chainid: chainId,
            module: "account",
            action: "tokentx",
            address,
            startblock: "0",
            endblock: "99999999",
            page,
            offset,
            sort: "desc",
            apikey: apiKey,
        });

        console.log("[Etherscan] Fetching transactions for:", address, "on chainId:", chainId);

        const [txResponse, tokenResponse] = await Promise.all([
            fetch(`${ETHERSCAN_API_V2_URL}?${txParams}`),
            fetch(`${ETHERSCAN_API_V2_URL}?${tokenParams}`),
        ]);

        const [txData, tokenData] = await Promise.all([
            txResponse.json(),
            tokenResponse.json(),
        ]);

        // Combine and format transactions
        const normalTxs = txData.status === "1" ? txData.result : [];
        const tokenTxs = tokenData.status === "1" ? tokenData.result : [];

        // Format normal transactions
        const formattedNormalTxs = normalTxs.map((tx: any) => ({
            hash: tx.hash,
            type: tx.from.toLowerCase() === address.toLowerCase() ? "send" : "receive",
            from: tx.from,
            to: tx.to,
            value: tx.value,
            symbol: "ETH",
            decimals: 18,
            timestamp: parseInt(tx.timeStamp) * 1000,
            blockNumber: tx.blockNumber,
            isError: tx.isError === "1",
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
        }));

        // Format token transactions
        const formattedTokenTxs = tokenTxs.map((tx: any) => ({
            hash: tx.hash,
            type: tx.from.toLowerCase() === address.toLowerCase() ? "send" : "receive",
            from: tx.from,
            to: tx.to,
            value: tx.value,
            symbol: tx.tokenSymbol,
            decimals: parseInt(tx.tokenDecimal),
            tokenName: tx.tokenName,
            contractAddress: tx.contractAddress,
            timestamp: parseInt(tx.timeStamp) * 1000,
            blockNumber: tx.blockNumber,
        }));

        // Combine and sort by timestamp (newest first)
        const allTxs = [...formattedNormalTxs, ...formattedTokenTxs].sort(
            (a, b) => b.timestamp - a.timestamp
        );

        // Remove duplicates by hash (token transfers might overlap with normal txs)
        const uniqueTxs = allTxs.reduce((acc: any[], tx) => {
            // Prefer token transfers over ETH transfers for same hash
            const existing = acc.find((t) => t.hash === tx.hash);
            if (!existing) {
                acc.push(tx);
            } else if (tx.symbol !== "ETH" && existing.symbol === "ETH") {
                // Replace ETH tx with token tx
                const idx = acc.indexOf(existing);
                acc[idx] = tx;
            }
            return acc;
        }, []);

        console.log("[Etherscan] Returning", uniqueTxs.length, "transactions");

        return NextResponse.json({
            status: "1",
            result: uniqueTxs,
            total: uniqueTxs.length,
        });
    } catch (error) {
        console.error("[Etherscan] Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
