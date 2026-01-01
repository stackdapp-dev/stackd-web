/**
 * GET /api/btc/status/[id]
 * Get the status of a deposit or withdrawal transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { depositService } from '@/lib/btc/depositService';
import { withdrawalService } from '@/lib/btc/withdrawalService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
  }

  try {
    // Try to get deposit status first
    const depositStatus = await depositService.getDepositStatus(id);
    return NextResponse.json(depositStatus);
  } catch {
    // If not found as deposit, try withdrawal
    try {
      const withdrawalStatus = await withdrawalService.getWithdrawalStatus(id);
      return NextResponse.json(withdrawalStatus);
    } catch {
      // Not found in either service
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
  }
}
