/**
 * API Route Tests: POST /api/btc/withdraw
 *
 * Tests withdrawal initiation endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const {
  mockInitiateWithdrawal,
  mockVerifyAuthToken,
  mockIsPrivyServerConfigured,
} = vi.hoisted(() => ({
  mockInitiateWithdrawal: vi.fn(),
  mockVerifyAuthToken: vi.fn(),
  mockIsPrivyServerConfigured: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/btc/withdrawalService', () => ({
  withdrawalService: {
    initiateWithdrawal: mockInitiateWithdrawal,
  },
}));

vi.mock('@/lib/auth/privy-server', () => ({
  verifyAuthToken: mockVerifyAuthToken,
  isPrivyServerConfigured: mockIsPrivyServerConfigured,
}));

// Import after mocks
import { POST } from '@/app/api/btc/withdraw/route';

describe('POST /api/btc/withdraw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Privy is configured
    mockIsPrivyServerConfigured.mockReturnValue(true);

    mockInitiateWithdrawal.mockResolvedValue({
      withdrawalId: 'wd-123',
      inputAmount: '0.5',
      expectedOutput: '0.495',
      btcAddress: 'bc1qtest',
      evmAddress: '0x1234567890123456789012345678901234567890',
      approvalTx: { to: '0x...', data: '0x...', value: '0x0' },
      status: 'pending_approval',
      quoteId: 'quote-123',
      estimatedTime: 600,
      createdAt: Date.now(),
    });
  });

  it('should return 200 with withdrawal details', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    const request = new NextRequest('http://localhost/api/btc/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      withdrawalId: expect.any(String),
      approvalRequired: expect.any(Boolean),
    });
  });

  it('should return 400 for invalid BTC address', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    });
    mockInitiateWithdrawal.mockRejectedValue(new Error('Invalid BTC address'));

    const request = new NextRequest('http://localhost/api/btc/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        wbtcAmount: '0.5',
        btcAddress: 'invalid',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for missing wbtcAmount', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    const request = new NextRequest('http://localhost/api/btc/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('wbtcAmount');
  });

  it('should return 401 if not authenticated', async () => {
    mockVerifyAuthToken.mockResolvedValue(null);
    vi.stubEnv('NODE_ENV', 'production');

    const request = new NextRequest('http://localhost/api/btc/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
      body: JSON.stringify({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);

    vi.unstubAllEnvs();
  });

  it('should use wallet address from auth for evmAddress', async () => {
    mockVerifyAuthToken.mockResolvedValue({
      userId: 'user123',
      walletAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    });

    const request = new NextRequest('http://localhost/api/btc/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid_token',
      },
      body: JSON.stringify({
        wbtcAmount: '0.5',
        btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockInitiateWithdrawal).toHaveBeenCalledWith({
      wbtcAmount: '0.5',
      btcAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      evmAddress: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    });
  });
});
