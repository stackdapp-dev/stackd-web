import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

/**
 * GET /api/referrals
 * Fetch referral stats for the authenticated user
 * Auto-creates user and referral code if they don't exist
 */
export async function GET(req: Request) {
    let userId = 'user_123';
    let walletAddress: string | null = null;
    let referralCode: string | null = null;

    // Require authentication - fail closed regardless of environment
    if (!isPrivyServerConfigured()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await verifyAuthToken(req);
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = authUser.userId;
    walletAddress = authUser.walletAddress;

    try {
        // Get or create user in database by wallet (auto-generates referral code)
        if (walletAddress) {
            const dbUser = await referralDb.getOrCreateUser(walletAddress);
            if (dbUser) {
                userId = dbUser.id;
                referralCode = dbUser.referral_code;
            }
        }

        const stats = await referralDb.getReferralStats(userId);
        const unclaimedEarnings = await referralDb.getUnclaimedEarnings(userId);

        return NextResponse.json({
            ...stats,
            referral_code: referralCode,
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

    // Privy not configured - fail closed
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
