import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/mock';

export async function POST(req: Request) {
    try {
        const { code, walletAddress } = await req.json();

        if (!code || !walletAddress) {
            return NextResponse.json({ error: 'Missing code or wallet' }, { status: 400 });
        }

        // specific mock logic: if wallet is '0x_referee', simulate success
        // In real app: create user if not exists, then bind
        const MOCK_REFEREE_ID = 'referee_999';

        const success = await dbService.joinReferral(MOCK_REFEREE_ID, code);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid code or already referred' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to join referral' }, { status: 500 });
    }
}
