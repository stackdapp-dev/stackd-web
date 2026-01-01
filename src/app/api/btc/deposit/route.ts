/**
 * POST /api/btc/deposit
 * Initiate a BTC deposit to receive WBTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { depositService } from '@/lib/btc/depositService';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

// Request validation schema
const depositRequestSchema = z.object({
  btcAmount: z.string().regex(/^\d+\.?\d*$/, 'Invalid btcAmount format'),
  evmAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address')
    .optional(),
});

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  // Authenticate user
  let evmAddressFromAuth: string | null = null;

  if (isPrivyServerConfigured()) {
    const authUser = await verifyAuthToken(request);
    if (authUser) {
      evmAddressFromAuth = authUser.walletAddress;
    } else if (!isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (!isDev) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const parseResult = depositRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues
        .map((e) => `${e.path.join('.') || e.path[0] || 'btcAmount'}: ${e.message}`)
        .join(', ');
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    const { btcAmount, evmAddress: providedEvmAddress } = parseResult.data;

    // Use provided address or fall back to authenticated user's address
    const evmAddress = providedEvmAddress || evmAddressFromAuth;

    if (!evmAddress) {
      return NextResponse.json(
        { error: 'evmAddress: Required when not authenticated with wallet' },
        { status: 400 }
      );
    }

    // Initiate deposit
    const result = await depositService.initiateDeposit({
      btcAmount,
      evmAddress,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API/btc/deposit] Error:', error);

    if (error instanceof Error) {
      // Return validation errors as 400
      if (
        error.message.includes('Invalid') ||
        error.message.includes('address')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to initiate deposit' },
      { status: 500 }
    );
  }
}
