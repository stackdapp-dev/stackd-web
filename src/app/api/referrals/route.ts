import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';

/**
 * GET /api/referrals
 * Fetch referral stats for the authenticated user
 * 
 * TODO: Integrate with Privy to get actual user ID
 */
export async function GET() {
    // TODO: Get userId from Privy session
    // For now, use mock user ID for development
    const MOCK_USER_ID = 'user_123';

    try {
        const stats = await referralDb.getReferralStats(MOCK_USER_ID);

        // Get unclaimed earnings
        const unclaimedEarnings = await referralDb.getUnclaimedEarnings(MOCK_USER_ID);

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
 * Generate a new referral code (called when user first accesses referrals)
 * 
 * TODO: Integrate with Privy to get actual wallet address
 */
export async function POST(req: Request) {
    // TODO: Get wallet address from Privy session
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
