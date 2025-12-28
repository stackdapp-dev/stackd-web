import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';
import { getUserTier, canWithdrawEarnings } from '@/lib/referrals/tiers';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

/**
 * POST /api/referrals/claim
 * Claim accumulated referral rewards
 * Requires Silver tier (personal loan >= $500) to withdraw
 */
export async function POST(req: Request) {
    // Authenticate with Privy
    let userId = 'user_123';
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
        // Get user from database
        if (walletAddress) {
            const dbUser = await referralDb.getUserByWallet(walletAddress);
            if (dbUser) {
                userId = dbUser.id;
            }
        }

        // TODO: Get actual personal loan and network volume from on-chain
        // For now use mock values
        const personalLoanBalance = 1000;
        const networkVolume = 5500;

        const tier = getUserTier({ personalLoanBalance, networkVolume });

        // Check if user can withdraw (must be Silver+)
        if (!canWithdrawEarnings(tier)) {
            return NextResponse.json({
                error: 'Bronze tier cannot withdraw earnings. Maintain a personal loan > $500 to unlock.',
                tier,
            }, { status: 403 });
        }

        // Attempt to claim
        const result = await referralDb.claimEarnings(userId);

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
