/**
 * GET /api/btc/quote
 * Get a quote for BTC deposit or WBTC withdrawal without initiating
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { quoteService } from '@/lib/btc/quoteService';

// Query parameter validation schemas
const depositQuoteSchema = z.object({
  type: z.literal('deposit'),
  btcAmount: z.string().regex(/^\d+\.?\d*$/, 'Invalid btcAmount format'),
  evmAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address'),
});

const withdrawQuoteSchema = z.object({
  type: z.literal('withdraw'),
  wbtcAmount: z.string().regex(/^\d+\.?\d*$/, 'Invalid wbtcAmount format'),
  btcAddress: z.string().min(26, 'BTC address too short').max(90, 'BTC address too long'),
  evmAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address'),
});

const quoteRequestSchema = z.discriminatedUnion('type', [
  depositQuoteSchema,
  withdrawQuoteSchema,
]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Build query object from search params
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Validate query parameters
  const parseResult = quoteRequestSchema.safeParse(query);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues
      .map((e) => `${e.path.join('.') || String(e.path[0]) || 'type'}: ${e.message}`)
      .join(', ');
    return NextResponse.json({ error: errorMessages }, { status: 400 });
  }

  try {
    const data = parseResult.data;

    if (data.type === 'deposit') {
      const quote = await quoteService.getDepositQuote({
        btcAmount: data.btcAmount,
        evmAddress: data.evmAddress,
      });

      return NextResponse.json({
        type: 'deposit',
        inputAmount: data.btcAmount,
        outputAmount: quote.outputAmount,
        depositAddress: quote.depositAddress,
        memo: quote.memo,
        estimatedTime: quote.estimatedTime,
        fees: quote.fees,
        expiresAt: quote.expiresAt,
      });
    } else {
      const quote = await quoteService.getWithdrawalQuote({
        wbtcAmount: data.wbtcAmount,
        btcAddress: data.btcAddress,
        evmAddress: data.evmAddress,
      });

      return NextResponse.json({
        type: 'withdraw',
        inputAmount: data.wbtcAmount,
        outputAmount: quote.outputAmount,
        estimatedTime: quote.estimatedTime,
        fees: quote.fees,
        approvalRequired: quote.approvalRequired,
      });
    }
  } catch (error) {
    console.error('[API/btc/quote] Error:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Invalid') ||
        error.message.includes('address')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to get quote' },
      { status: 500 }
    );
  }
}
