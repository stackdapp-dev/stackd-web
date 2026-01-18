/**
 * useCardTransactions Hook Tests
 * TDD tests for card transactions hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { mockTransactions, emptyTransactions } from '../mocks/card';

// Mock the card API
vi.mock('@/lib/api/card', () => ({
    getCardTransactions: vi.fn(),
}));

import { getCardTransactions } from '@/lib/api/card';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

// Skip: These are TDD tests for a hook that hasn't been implemented yet
describe.skip('useCardTransactions Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Transaction Fetching', () => {
        it('should fetch transactions on mount', async () => {
            (getCardTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions);

            const { useCardTransactions } = await import('@/hooks/useCardTransactions');
            const { result } = renderHook(() => useCardTransactions(), { wrapper: createWrapper() });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.transactions).toEqual(mockTransactions);
            expect(result.current.transactions).toHaveLength(4);
        });

        it('should handle empty transactions', async () => {
            (getCardTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(emptyTransactions);

            const { useCardTransactions } = await import('@/hooks/useCardTransactions');
            const { result } = renderHook(() => useCardTransactions(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.transactions).toEqual([]);
            expect(result.current.isEmpty).toBe(true);
        });

        it('should handle fetch error', async () => {
            (getCardTransactions as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

            const { useCardTransactions } = await import('@/hooks/useCardTransactions');
            const { result } = renderHook(() => useCardTransactions(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBeDefined();
        });
    });

    describe('Recent Transactions', () => {
        it('should return limited transactions for recent view', async () => {
            (getCardTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions);

            const { useCardTransactions } = await import('@/hooks/useCardTransactions');
            const { result } = renderHook(() => useCardTransactions({ limit: 3 }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.recentTransactions).toHaveLength(3);
        });

        it('should provide hasMore flag when more transactions exist', async () => {
            (getCardTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions);

            const { useCardTransactions } = await import('@/hooks/useCardTransactions');
            const { result } = renderHook(() => useCardTransactions({ limit: 3 }), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.hasMore).toBe(true);
        });
    });

    describe('Transaction Filtering', () => {
        it('should filter by date range', async () => {
            (getCardTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions);

            const { useCardTransactions } = await import('@/hooks/useCardTransactions');
            const { result } = renderHook(
                () => useCardTransactions({
                    startDate: '2026-01-17',
                    endDate: '2026-01-18',
                }),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Should pass date filters to API
            expect(getCardTransactions).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: '2026-01-17',
                    endDate: '2026-01-18',
                })
            );
        });
    });
});
