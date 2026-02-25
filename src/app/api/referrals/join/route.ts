import { NextResponse } from 'next/server';
import { referralDb } from '@/lib/db/referralDb';

/**
 * POST /api/referrals/join
 * Join the referral program using a referral code
 * 
 * Body: { code: string, walletAddress: string }
 */
// Validate EVM wallet address format
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: Request) {
    try {
        const { code, walletAddress } = await req.json();

        if (!code || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing code or wallet address' },
                { status: 400 }
            );
        }

        // Validate wallet address format
        if (!EVM_ADDRESS_REGEX.test(walletAddress)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        const success = await referralDb.joinReferral(walletAddress, code);

        if (!success) {
            return NextResponse.json(
                { error: 'Invalid referral code or already referred' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API/referrals/join] Error:', error);
        return NextResponse.json(
            { error: 'Failed to join referral program' },
            { status: 500 }
        );
    }
}
