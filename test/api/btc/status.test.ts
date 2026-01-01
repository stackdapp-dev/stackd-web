/**
 * API Route Tests: GET /api/btc/status/[id]
 *
 * Tests status endpoint for deposits and withdrawals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to properly hoist mock functions
const { mockGetDepositStatus, mockGetWithdrawalStatus } = vi.hoisted(() => ({
  mockGetDepositStatus: vi.fn(),
  mockGetWithdrawalStatus: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/btc/depositService', () => ({
  depositService: {
    getDepositStatus: mockGetDepositStatus,
  },
}));

vi.mock('@/lib/btc/withdrawalService', () => ({
  withdrawalService: {
    getWithdrawalStatus: mockGetWithdrawalStatus,
  },
}));

// Import after mocks
import { GET } from '@/app/api/btc/status/[id]/route';

describe('GET /api/btc/status/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return deposit status', async () => {
    mockGetDepositStatus.mockResolvedValue({
      depositId: 'dep-123',
      status: 'awaiting_deposit',
      timeline: [{ stage: 'initiated', timestamp: Date.now() }],
    });

    const request = new NextRequest('http://localhost/api/btc/status/dep-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'dep-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBeDefined();
    expect(data.depositId).toBe('dep-123');
  });

  it('should return withdrawal status', async () => {
    mockGetDepositStatus.mockRejectedValue(new Error('Deposit not found'));
    mockGetWithdrawalStatus.mockResolvedValue({
      withdrawalId: 'wd-123',
      status: 'pending_approval',
      inputAmount: '0.5',
      expectedOutput: '0.495',
      btcAddress: 'bc1qtest',
      evmAddress: '0x1234',
      timeline: [{ status: 'pending_approval', timestamp: Date.now() }],
    });

    const request = new NextRequest('http://localhost/api/btc/status/wd-123');
    const response = await GET(request, { params: Promise.resolve({ id: 'wd-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBeDefined();
    expect(data.withdrawalId).toBe('wd-123');
  });

  it('should return 404 for unknown ID', async () => {
    mockGetDepositStatus.mockRejectedValue(new Error('Deposit not found'));
    mockGetWithdrawalStatus.mockRejectedValue(new Error('Withdrawal not found'));

    const request = new NextRequest('http://localhost/api/btc/status/unknown');
    const response = await GET(request, { params: Promise.resolve({ id: 'unknown' }) });

    expect(response.status).toBe(404);
  });

  it('should try deposit first, then withdrawal', async () => {
    mockGetDepositStatus.mockRejectedValue(new Error('Deposit not found'));
    mockGetWithdrawalStatus.mockResolvedValue({
      withdrawalId: 'wd-456',
      status: 'completed',
      inputAmount: '1.0',
      expectedOutput: '0.99',
      btcAddress: 'bc1qtest',
      evmAddress: '0x5678',
      timeline: [
        { status: 'pending_approval', timestamp: Date.now() - 10000 },
        { status: 'completed', timestamp: Date.now() },
      ],
    });

    const request = new NextRequest('http://localhost/api/btc/status/wd-456');
    await GET(request, { params: Promise.resolve({ id: 'wd-456' }) });

    expect(mockGetDepositStatus).toHaveBeenCalledWith('wd-456');
    expect(mockGetWithdrawalStatus).toHaveBeenCalledWith('wd-456');
  });
});
