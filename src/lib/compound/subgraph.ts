/**
 * Compound v3 Subgraph Service
 *
 * Fetches deposit/collateral data from the Compound v3 subgraph on Arbitrum.
 * Uses The Graph's decentralized network to query on-chain positions.
 *
 * Subgraph: https://thegraph.com/explorer/subgraphs/Ff7ha9ELmpmg81D6nYxy4t8aGP26dPztqD1LDJNPqjLS
 */

// The Graph API endpoint for Compound v3 Arbitrum subgraph
// Note: For production, use an API key from The Graph Studio
const SUBGRAPH_URL = process.env.COMPOUND_SUBGRAPH_URL ||
    'https://gateway.thegraph.com/api/subgraphs/id/Ff7ha9ELmpmg81D6nYxy4t8aGP26dPztqD1LDJNPqjLS';

// API key for The Graph's decentralized network (required for gateway access)
const GRAPH_API_KEY = process.env.GRAPH_API_KEY || '';

/**
 * Build headers for Graph API requests
 */
function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (GRAPH_API_KEY) {
        headers['Authorization'] = `Bearer ${GRAPH_API_KEY}`;
    }

    return headers;
}

export interface DepositorData {
    walletAddress: string;
    totalDepositsUsd: number;
}

interface SubgraphPosition {
    account: {
        id: string;
    };
    accounting: {
        collateralBalanceUsd: string;
    };
}

interface SubgraphResponse {
    data?: {
        positions?: SubgraphPosition[];
    };
    errors?: Array<{ message: string }>;
}

/**
 * Build GraphQL query for top depositors
 */
function buildTopDepositorsQuery(limit: number): string {
    return `
        query TopDepositors {
            positions(
                first: ${limit}
                orderBy: accounting__collateralBalanceUsd
                orderDirection: desc
                where: { accounting_: { collateralBalanceUsd_gt: "0" } }
            ) {
                account {
                    id
                }
                accounting {
                    collateralBalanceUsd
                }
            }
        }
    `;
}

/**
 * Fetch top depositors from the Compound v3 subgraph
 *
 * @param limit - Maximum number of depositors to return
 * @returns Array of depositor data sorted by collateral USD descending
 */
export async function getTopDepositors(limit: number = 10): Promise<DepositorData[]> {
    try {
        const query = buildTopDepositorsQuery(limit);

        const response = await fetch(SUBGRAPH_URL, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.error('[Subgraph] HTTP error:', response.status, response.statusText);
            return [];
        }

        const json: SubgraphResponse = await response.json();

        if (json.errors) {
            console.error('[Subgraph] GraphQL errors:', json.errors);
            return [];
        }

        if (!json.data?.positions) {
            console.warn('[Subgraph] No positions data in response');
            return [];
        }

        // Transform and filter positions
        const depositors: DepositorData[] = json.data.positions
            .map((position) => ({
                walletAddress: position.account.id.toLowerCase(),
                totalDepositsUsd: parseFloat(position.accounting.collateralBalanceUsd) || 0,
            }))
            .filter((d) => d.totalDepositsUsd > 0)
            .sort((a, b) => b.totalDepositsUsd - a.totalDepositsUsd);

        return depositors;
    } catch (error) {
        console.error('[Subgraph] Error fetching top depositors:', error);
        return [];
    }
}

/**
 * Get deposit amount for a specific wallet address
 *
 * @param walletAddress - The wallet address to query
 * @returns Deposit data for the wallet, or null if not found
 */
export async function getDepositorByAddress(walletAddress: string): Promise<DepositorData | null> {
    try {
        const normalizedAddress = walletAddress.toLowerCase();

        const query = `
            query DepositorByAddress {
                positions(
                    where: { account: "${normalizedAddress}" }
                ) {
                    account {
                        id
                    }
                    accounting {
                        collateralBalanceUsd
                    }
                }
            }
        `;

        const response = await fetch(SUBGRAPH_URL, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            return null;
        }

        const json: SubgraphResponse = await response.json();

        if (!json.data?.positions?.length) {
            return null;
        }

        const position = json.data.positions[0];
        return {
            walletAddress: position.account.id.toLowerCase(),
            totalDepositsUsd: parseFloat(position.accounting.collateralBalanceUsd) || 0,
        };
    } catch (error) {
        console.error('[Subgraph] Error fetching depositor:', error);
        return null;
    }
}
