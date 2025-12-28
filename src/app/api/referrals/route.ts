import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/mock';

export async function GET() {
    // In a real app, we would get the userId from the session (Privy)
    // For now, we simulate the "Connector" user from our mock DB
    const MOCK_USER_ID = 'user_123';

    try {
        const stats = await dbService.getReferralStats(MOCK_USER_ID);
        const user = await dbService.getUser(MOCK_USER_ID);

        return NextResponse.json({
            ...stats,
            referral_code: user?.referral_code || null
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Generate a new code
    const MOCK_USER_ID = 'user_123';

    try {
        const code = await dbService.createReferralCode(MOCK_USER_ID);
        return NextResponse.json({ code });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
    }
}
