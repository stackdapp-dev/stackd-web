/**
 * Multi-Protocol Collateral Service
 *
 * Aggregates collateral data from multiple DeFi protocols:
 * - Compound v3 (Arbitrum): WBTC collateral via The Graph subgraph
 * - Fluid (Ethereum mainnet): XAUT and other collateral via on-chain calls
 *
 * Used by the leaderboard to show total collateral across all protocols.
 */

import { getDepositorByAddress } from '@/lib/compound/subgraph';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { updateAthIfHigher } from '@/lib/db/depositAthDb';

// Import Fluid functions - we'll use a simplified version for server-side
import {
    VAULT_RESOLVER_ADDRESS,
    KNOWN_VAULTS,
} from '@/lib/web3/fluid';
import { parseAbi } from 'viem';

// CoinGecko API for live token prices
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const COINGECKO_IDS: Record<string, string> = {
    XAUT: 'tether-gold',
    WBTC: 'bitcoin',
};

// Fallback prices when CoinGecko API is unavailable
// These are updated dynamically on each successful CoinGecko fetch to stay current
let fallbackPrices: Record<string, number> = {
    XAUT: 3200, // Gold price per troy oz (XAUT = 1 oz gold) - updated Jan 2026
    WBTC: 105000, // BTC price - updated Jan 2026
};

// Cache for live token prices (60 second TTL)
let priceCache: { prices: Record<string, number>; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 60_000; // 60 seconds

/**
 * Fetch live token prices directly from CoinGecko API
 * Uses caching to avoid rate limiting (60s TTL)
 * Falls back to last known prices if API fails
 */
export async function fetchLiveTokenPrices(): Promise<Record<string, number>> {
    // Check cache first
    if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL) {
        return priceCache.prices;
    }

    try {
        // Fetch directly from CoinGecko API
        const coinIds = Object.values(COINGECKO_IDS).join(',');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(
            `${COINGECKO_API_URL}?ids=${coinIds}&vs_currencies=usd`,
            {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
            throw new Error(`CoinGecko API error: ${res.status}`);
        }

        const coingeckoData = await res.json();

        // Map CoinGecko response to our token symbols
        const prices: Record<string, number> = {};
        for (const [symbol, coinId] of Object.entries(COINGECKO_IDS)) {
            if (coingeckoData[coinId]?.usd) {
                prices[symbol] = coingeckoData[coinId].usd;
            } else {
                // Use fallback for missing tokens
                prices[symbol] = fallbackPrices[symbol] || 0;
            }
        }

        // Update cache
        priceCache = { prices, timestamp: Date.now() };

        // Update fallback prices with latest successful fetch (keeps fallback current)
        fallbackPrices = { ...prices };

        console.log('[MultiProtocol] Fetched live token prices from CoinGecko:', prices);

        return prices;
    } catch (error) {
        // Handle timeout gracefully
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        if (isTimeout) {
            console.warn('[MultiProtocol] CoinGecko request timed out, using fallback prices');
        } else {
            console.warn('[MultiProtocol] Failed to fetch from CoinGecko, using fallback:', error);
        }

        // Return cached data if available (even if expired)
        if (priceCache) {
            console.log('[MultiProtocol] Using cached prices:', priceCache.prices);
            return priceCache.prices;
        }

        return fallbackPrices;
    }
}

export interface MultiProtocolCollateral {
    walletAddress: string;
    totalCollateralUsd: number;
    compoundCollateralUsd: number;
    fluidCollateralUsd: number;
}

// Simple resolver ABI for getting NFT IDs and vault addresses
const SIMPLE_RESOLVER_ABI = parseAbi([
    'function positionsNftIdOfUser(address user_) view returns (uint256[])',
    'function vaultByNftId(uint256 nftId_) view returns (address)',
]);

// ABI for getting position data
const POSITION_BY_NFT_ABI = [
    {
        inputs: [{ name: 'nftId_', type: 'uint256' }],
        name: 'positionByNftId',
        outputs: [
            {
                name: 'userPosition_',
                type: 'tuple',
                components: [
                    { name: 'nftId', type: 'uint256' },
                    { name: 'owner', type: 'address' },
                    { name: 'isLiquidated', type: 'bool' },
                    { name: 'isSupplyPosition', type: 'bool' },
                    { name: 'tick', type: 'int256' },
                    { name: 'tickId', type: 'uint256' },
                    { name: 'beforeSupply', type: 'uint256' },
                    { name: 'beforeBorrow', type: 'uint256' },
                    { name: 'beforeDustBorrow', type: 'uint256' },
                    { name: 'supply', type: 'uint256' },
                    { name: 'borrow', type: 'uint256' },
                    { name: 'dustBorrow', type: 'uint256' },
                ],
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

/**
 * Get Fluid collateral for a wallet address
 * This is a server-side function that creates its own public client
 */
async function getFluidCollateral(walletAddress: string): Promise<number> {
    try {
        const publicClient = createPublicClient({
            chain: mainnet,
            transport: http(process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
        });

        const resolverAddress = VAULT_RESOLVER_ADDRESS;

        // Get NFT IDs for user
        const nftIds = await publicClient.readContract({
            address: resolverAddress,
            abi: SIMPLE_RESOLVER_ABI,
            functionName: 'positionsNftIdOfUser',
            args: [walletAddress as Address],
        });

        if (nftIds.length === 0) {
            return 0;
        }

        let totalFluidUsd = 0;

        // For each NFT, check if it's a known vault and get the position
        for (const nftId of nftIds) {
            try {
                const vaultAddress = await publicClient.readContract({
                    address: resolverAddress,
                    abi: SIMPLE_RESOLVER_ABI,
                    functionName: 'vaultByNftId',
                    args: [nftId],
                });

                const knownVault = KNOWN_VAULTS[vaultAddress.toLowerCase()];

                if (knownVault) {
                    // Get position data
                    const userPosition = await publicClient.readContract({
                        address: resolverAddress,
                        abi: POSITION_BY_NFT_ABI,
                        functionName: 'positionByNftId',
                        args: [nftId],
                    });

                    // Calculate USD value based on supply token
                    // XAUT has 6 decimals
                    const supplyDecimals = knownVault.supplyDecimals || 6;
                    const supplyAmount = Number(userPosition.supply) / Math.pow(10, supplyDecimals);

                    // Get token price (XAUT = gold price) - use live prices
                    const tokenSymbol = knownVault.supplyToken.toLowerCase() ===
                        '0x68749665ff8d2d112fa859aa293f07a622782f38'.toLowerCase()
                        ? 'XAUT'
                        : 'WBTC';

                    // Fetch live prices (cached for 60s)
                    const livePrices = await fetchLiveTokenPrices();
                    const tokenPrice = livePrices[tokenSymbol] || fallbackPrices[tokenSymbol] || 0;
                    const positionValueUsd = supplyAmount * tokenPrice;

                    totalFluidUsd += positionValueUsd;

                    console.log(`[MultiProtocol] Fluid position NFT ${nftId}: ${supplyAmount} ${tokenSymbol} = $${positionValueUsd.toFixed(2)}`);
                }
            } catch (posError) {
                console.error(`[MultiProtocol] Error fetching Fluid position ${nftId}:`, posError);
            }
        }

        return totalFluidUsd;
    } catch (error) {
        console.error('[MultiProtocol] Error fetching Fluid collateral:', error);
        return 0;
    }
}

/**
 * Get total collateral across all protocols for a wallet address
 *
 * @param walletAddress - The wallet address to query
 * @returns Combined collateral data from all protocols, or null if no collateral found
 */
export async function getTotalCollateralByAddress(
    walletAddress: string
): Promise<MultiProtocolCollateral | null> {
    try {
        const normalizedAddress = walletAddress.toLowerCase();

        // Fetch from both protocols in parallel
        const [compoundResult, fluidCollateralUsd] = await Promise.all([
            getDepositorByAddress(walletAddress),
            getFluidCollateral(walletAddress),
        ]);

        const compoundCollateralUsd = compoundResult?.totalDepositsUsd || 0;
        const totalCollateralUsd = compoundCollateralUsd + fluidCollateralUsd;

        // Return null if no collateral on either protocol
        if (totalCollateralUsd === 0) {
            return null;
        }

        console.log(`[MultiProtocol] Total collateral for ${normalizedAddress}: $${totalCollateralUsd.toFixed(2)} (Compound: $${compoundCollateralUsd.toFixed(2)}, Fluid: $${fluidCollateralUsd.toFixed(2)})`);

        // Update ATH if this collateral exceeds the stored ATH
        // This is fire-and-forget - we don't want ATH update failures to break collateral fetching
        try {
            await updateAthIfHigher(normalizedAddress, {
                totalCollateralUsd,
                compoundCollateralUsd,
                fluidCollateralUsd,
            });
        } catch (athError) {
            console.error('[MultiProtocol] Failed to update ATH (non-fatal):', athError);
        }

        return {
            walletAddress: normalizedAddress,
            totalCollateralUsd,
            compoundCollateralUsd,
            fluidCollateralUsd,
        };
    } catch (error) {
        console.error('[MultiProtocol] Error fetching total collateral:', error);
        return null;
    }
}

/**
 * Batch fetch total collateral for multiple wallet addresses
 * More efficient than calling getTotalCollateralByAddress for each wallet
 *
 * @param walletAddresses - Array of wallet addresses to query
 * @returns Map of wallet address to collateral data
 */
export async function getTotalCollateralForWallets(
    walletAddresses: string[]
): Promise<Map<string, MultiProtocolCollateral>> {
    const results = new Map<string, MultiProtocolCollateral>();

    // Fetch all in parallel
    const collateralPromises = walletAddresses.map(async (address) => {
        const collateral = await getTotalCollateralByAddress(address);
        if (collateral) {
            results.set(address.toLowerCase(), collateral);
        }
    });

    await Promise.all(collateralPromises);

    return results;
}
