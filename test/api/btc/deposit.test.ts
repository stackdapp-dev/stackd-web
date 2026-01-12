/**
 * API Route Tests: POST /api/btc/deposit
 *
 * Tests deposit initiation endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const {
  mockInitiateDeposit,
  mockVerifyAuthToken,
  mockIsPrivyServerConfigured,
} = vi.hoisted(() => ({
  mockInitiateDeposit: vi.fn(),
  mockVerifyAuthToken: vi.fn(),
  mockIsPrivyServerConfigured: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/btc/depositService', () => ({
  depositService: {
    initiateDeposit: mockInitiateDeposit,
  },
}));

vi.mock('@/lib/auth/privy-server', () => ({
  verifyAuthToken: mockVerifyAuthToken,
  isPrivyServerConfigured: mockIsPrivyServerConfigured,
}));

// Import after mocks
import { POST } from '@/app/api/btc/deposit/route';

describe('POST /api/btc/deposit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Privy is configured
    mockIsPrivyServerConfigured.mockReturnValue(true);

    mockInitiateDeposit.mockResolvedValue({
      depositId: 'dep-123',
      depositAddress: 'bc1qdeposit123',
      memo: 'SWAP:ARB.WBTC:0x1234',
      expectedAmount: '0.5',
      expectedOutput: '0.495',
      expiresAt: Date.now() + 600000,
      status: 'awaiting_deposit',
    });
  });

  it('should return 200 with deposit instructions', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    const request = new NextRequest('http://localhost/api/btc/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      depositId: expect.any(String),
      depositAddress: expect.any(String),
      memo: expect.any(String),
    });
  });

  it('should return 400 for invalid EVM address', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    });
    mockInitiateDeposit.mockRejectedValue(new Error('Invalid EVM address'));

    const request = new NextRequest('http://localhost/api/btc/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        btcAmount: '0.5',
        evmAddress: 'invalid',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for missing btcAmount', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    const request = new NextRequest('http://localhost/api/btc/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        evmAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('btcAmount');
  });

  it('should return 401 if not authenticated', async () => {
    mockVerifyAuthToken.mockResolvedValue(null);
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest('http://localhost/api/btc/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify({
        btcAmount: '0.5',
        evmAddress: '0x1234567890123456789012345678901234567890',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);

    vi.unstubAllEnvs();
  });

  it('should use wallet address from auth if evmAddress not provided', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    });

    const request = new NextRequest('http://localhost/api/btc/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        btcAmount: '0.5',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockInitiateDeposit).toHaveBeenCalledWith({
      btcAmount: '0.5',
      evmAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    });
  });
});
