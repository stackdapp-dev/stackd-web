import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';

/**
 * POST /api/referrals/validate
 * Validate a referral code BEFORE signup (no auth required)
 * 
 * Body: { code: string }
 * Returns: { valid: boolean, referrerAddress?: string }
 */
export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code || typeof code !== 'string' || code.trim() === '') {
            return NextResponse.json(
                { error: 'Missing code' },
                { status: 400 }
            );
        }

        // Look up the referrer by code
        const referrer = await referralDb.getUserByReferralCode(code);

        if (!referrer) {
            return NextResponse.json({
                valid: false,
            });
        }

        // Return valid with referrer info (masked for privacy)
        return NextResponse.json({
            valid: true,
            referrerAddress: `${referrer.wallet_address.slice(0, 6)}...${referrer.wallet_address.slice(-4)}`,
        });
    } catch (error) {
        console.error('[API/referrals/validate] Error:', error);
        return NextResponse.json(
            { error: 'Failed to validate referral code' },
            { status: 500 }
        );
    }
}
