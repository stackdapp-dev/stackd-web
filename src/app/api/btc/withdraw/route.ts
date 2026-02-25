/**
 * POST /api/btc/withdraw
 * Initiate a WBTC to BTC withdrawal
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withdrawalService } from '@/lib/btc/withdrawalService';
import { verifyAuthToken, isPrivyServerConfigured } from '@/lib/auth/privy-server';

// Request validation schema
const withdrawRequestSchema = z.object({
  wbtcAmount: z.string().regex(/^\d+\.?\d*$/, 'Invalid wbtcAmount format'),
  btcAddress: z.string().min(26, 'BTC address too short').max(90, 'BTC address too long'),
});

export async function POST(request: NextRequest) {
  // Authenticate user - fail closed regardless of environment
  if (!isPrivyServerConfigured()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const evmAddressFromAuth = authUser.walletAddress;

  // Require wallet address for withdrawal
  if (!evmAddressFromAuth) {
    return NextResponse.json(
      { error: 'Wallet address required for withdrawal' },
      { status: 400 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const parseResult = withdrawRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues
        .map((e) => `${e.path.join('.') || String(e.path[0]) || 'wbtcAmount'}: ${e.message}`)
        .join(', ');
      return NextResponse.json({ error: errorMessages }, { status: 400 });
    }

    const { wbtcAmount, btcAddress } = parseResult.data;

    // Initiate withdrawal
    const result = await withdrawalService.initiateWithdrawal({
      wbtcAmount,
      btcAddress,
      evmAddress: evmAddressFromAuth,
    });

    return NextResponse.json({
      withdrawalId: result.withdrawalId,
      inputAmount: result.inputAmount,
      expectedOutput: result.expectedOutput,
      btcAddress: result.btcAddress,
      approvalRequired: result.approvalTx !== null,
      approvalTx: result.approvalTx,
      status: result.status,
      estimatedTime: result.estimatedTime,
    });
  } catch (error) {
    console.error('[API/btc/withdraw] Error:', error);

    if (error instanceof Error) {
      // Return validation errors as 400
      if (
        error.message.includes('Invalid') ||
        error.message.includes('address') ||
        error.message.includes('Testnet')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to initiate withdrawal' },
      { status: 500 }
    );
  }
}
