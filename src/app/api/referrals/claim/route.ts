import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';
import { getUserTier, canWithdrawEarnings } from '@/lib/referrals/tiers';

/**
 * POST /api/referrals/claim
 * Claim accumulated referral rewards
 * 
 * Requires Silver tier (personal loan >= $500) to withdraw
 * 
 * TODO: Integrate with Privy for authentication
 * TODO: Integrate with on-chain data for tier verification
 */
export async function POST(req: Request) {
    // TODO: Get userId from Privy session
    const MOCK_USER_ID = 'user_123';

    try {
        // For now, use mock tier data
        // TODO: Get actual personal loan and network volume from on-chain
        const personalLoanBalance = 1000; // Mock: $1000 personal loan
        const networkVolume = 5500; // Mock: $5500 network volume

        const tier = getUserTier({ personalLoanBalance, networkVolume });

        // Check if user can withdraw (must be Silver+)
        if (!canWithdrawEarnings(tier)) {
            return NextResponse.json({
                error: 'Bronze tier cannot withdraw earnings. Maintain a personal loan > $500 to unlock.',
                tier,
            }, { status: 403 });
        }

        // Attempt to claim
        const result = await referralDb.claimEarnings(MOCK_USER_ID);

        if (!result.success) {
            return NextResponse.json({
                error: 'No earnings to claim',
                amount: 0,
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            amount: result.amount,
            tier,
            message: `Successfully claimed $${result.amount.toFixed(2)} in referral rewards`,
        });
    } catch (error) {
        console.error('[API/referrals/claim] Error claiming earnings:', error);
        return NextResponse.json({ error: 'Failed to claim earnings' }, { status: 500 });
    }
}
