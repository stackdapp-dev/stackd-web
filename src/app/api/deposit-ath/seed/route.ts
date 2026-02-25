import { NextResponse } from 'next/server';
import { seedAllUsersAth, CollateralData } from '@/lib/db/depositAthDb';
import { getTotalCollateralByAddress } from '@/lib/collateral/multiProtocolCollateral';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

/**
 * POST /api/deposit-ath/seed
 *
 * Admin endpoint to seed ATH records for all existing users.
 * Requires authentication.
 *
 * Body params:
 * - hoursAgo (optional): Seed with data from N hours ago (for historical seeding)
 */
export async function POST(req: Request) {
    // Require authentication
    if (!isPrivyServerConfigured()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authUser = await verifyAuthToken(req);
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Parse request body
        let hoursAgo: number | undefined;
        try {
            const body = await req.json();
            hoursAgo = body.hoursAgo;
        } catch {
            // Empty body is okay
        }

        console.log(`[API/deposit-ath/seed] Starting seed${hoursAgo ? ` with hoursAgo=${hoursAgo}` : ''}`);

        // Create the collateral fetcher function
        // For now, use current values (historical block support would require
        // modifications to the subgraph queries and RPC calls)
        const getCollateralForWallet = async (wallet: string): Promise<CollateralData | null> => {
            const result = await getTotalCollateralByAddress(wallet);
            if (!result) return null;

            return {
                totalCollateralUsd: result.totalCollateralUsd,
                compoundCollateralUsd: result.compoundCollateralUsd,
                fluidCollateralUsd: result.fluidCollateralUsd,
            };
        };

        // Run the seeding process
        const stats = await seedAllUsersAth(getCollateralForWallet);

        console.log(`[API/deposit-ath/seed] Completed: seeded=${stats.seeded}, failed=${stats.failed}`);

        return NextResponse.json({
            success: true,
            seeded: stats.seeded,
            failed: stats.failed,
            hoursAgo: hoursAgo || null,
        });
    } catch (error) {
        console.error('[API/deposit-ath/seed] Error:', error);
        return NextResponse.json(
            { error: 'Failed to seed ATH records' },
            { status: 500 }
        );
    }
}
