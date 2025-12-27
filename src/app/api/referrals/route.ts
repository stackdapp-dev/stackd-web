import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

/**
 * GET /api/referrals
 * Fetch referral stats for the authenticated user
 */
export async function GET(req: Request) {
    // Try to authenticate with Privy
    let userId = 'user_123'; // Default for development
    let walletAddress: string | null = null;

    if (isPrivyServerConfigured()) {
        const authUser = await verifyAuthToken(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        userId = authUser.userId;
        walletAddress = authUser.walletAddress;
    }

    try {
        // Get or create user in database by wallet
        if (walletAddress) {
            const dbUser = await referralDb.getOrCreateUser(walletAddress);
            if (dbUser) {
                userId = dbUser.id;
            }
        }

        const stats = await referralDb.getReferralStats(userId);
        const unclaimedEarnings = await referralDb.getUnclaimedEarnings(userId);

        return NextResponse.json({
            ...stats,
            unclaimed_earnings: unclaimedEarnings,
        });
    } catch (error) {
        console.error('[API/referrals] Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
    }
}

/**
 * POST /api/referrals
 * Generate/get referral code for authenticated user
 */
export async function POST(req: Request) {
    // Authenticate with Privy
    if (isPrivyServerConfigured()) {
        const authUser = await verifyAuthToken(req);
        if (!authUser || !authUser.walletAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const user = await referralDb.getOrCreateUser(authUser.walletAddress);

            if (!user) {
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }

            return NextResponse.json({
                code: user.referral_code,
                user_id: user.id,
            });
        } catch (error) {
            console.error('[API/referrals] Error creating code:', error);
            return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
        }
    }

    // Development fallback (no Privy configured)
    const MOCK_WALLET = '0x123abc';
    try {
        const user = await referralDb.getOrCreateUser(MOCK_WALLET);
        if (!user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }
        return NextResponse.json({
            code: user.referral_code,
            user_id: user.id,
        });
    } catch (error) {
        console.error('[API/referrals] Error creating code:', error);
        return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
    }
}
