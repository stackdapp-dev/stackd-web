import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

/**
 * GET /api/referrals/leaderboard
 * Fetch leaderboard data - top referrers and top by deposits
 * This is a public endpoint but authenticated users get their rank
 */
export async function GET(req: Request) {
    let walletAddress: string | undefined;

    // Try to authenticate (optional - for getting user's rank)
    if (isPrivyServerConfigured()) {
        const authUser = await verifyAuthToken(req);
        if (authUser?.walletAddress) {
            walletAddress = authUser.walletAddress;
        }
    }

    try {
        const leaderboard = await referralDb.getLeaderboard(walletAddress);

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('[API/referrals/leaderboard] Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
