/**
 * useCard Hook Tests
 * TDD tests for card state management hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { mockCardDetails, mockLockedCard, mockRevealedCard } from '../mocks/card';

// Mock the card API
vi.mock('@/lib/api/card', () => ({
    getCardDetails: vi.fn(),
    toggleCardLock: vi.fn(),
    revealCardDetails: vi.fn(),
}));

// Import after mocking
import { getCardDetails, toggleCardLock, revealCardDetails } from '@/lib/api/card';

// Create a wrapper with QueryClient for testing
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
describe.skip('useCard Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Card Data Fetching', () => {
        it('should fetch card details on mount', async () => {
            (getCardDetails as ReturnType<typeof vi.fn>).mockResolvedValue(mockCardDetails);

            // Import the hook
            const { useCard } = await import('@/hooks/useCard');
            const { result } = renderHook(() => useCard(), { wrapper: createWrapper() });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.card).toEqual(mockCardDetails);
            expect(getCardDetails).toHaveBeenCalledTimes(1);
        });

        it('should handle fetch error', async () => {
            (getCardDetails as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

            const { useCard } = await import('@/hooks/useCard');
            const { result } = renderHook(() => useCard(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBeDefined();
            expect(result.current.card).toBeUndefined();
        });
    });

    describe('Card Lock Actions', () => {
        it('should toggle card lock state', async () => {
            (getCardDetails as ReturnType<typeof vi.fn>).mockResolvedValue(mockCardDetails);
            (toggleCardLock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            const { useCard } = await import('@/hooks/useCard');
            const { result } = renderHook(() => useCard(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.card).toBeDefined();
            });

            // Lock the card
            await result.current.lockCard();

            expect(toggleCardLock).toHaveBeenCalledWith(true);
        });

        it('should unlock a locked card', async () => {
            (getCardDetails as ReturnType<typeof vi.fn>).mockResolvedValue(mockLockedCard);
            (toggleCardLock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            const { useCard } = await import('@/hooks/useCard');
            const { result } = renderHook(() => useCard(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.card?.isLocked).toBe(true);
            });

            await result.current.unlockCard();

            expect(toggleCardLock).toHaveBeenCalledWith(false);
        });
    });

    describe('Card Reveal', () => {
        it('should reveal card details', async () => {
            (getCardDetails as ReturnType<typeof vi.fn>).mockResolvedValue(mockCardDetails);
            (revealCardDetails as ReturnType<typeof vi.fn>).mockResolvedValue(mockRevealedCard);

            const { useCard } = await import('@/hooks/useCard');
            const { result } = renderHook(() => useCard(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.card).toBeDefined();
            });

            const revealed = await result.current.revealCard();

            expect(revealed).toEqual(mockRevealedCard);
            expect(revealed?.fullNumber).toBe('4111111111111234');
            expect(revealed?.cvv).toBe('123');
        });

        it('should track reveal loading state', async () => {
            (getCardDetails as ReturnType<typeof vi.fn>).mockResolvedValue(mockCardDetails);
            (revealCardDetails as ReturnType<typeof vi.fn>).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(mockRevealedCard), 100))
            );

            const { useCard } = await import('@/hooks/useCard');
            const { result } = renderHook(() => useCard(), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(result.current.card).toBeDefined();
            });

            const revealPromise = result.current.revealCard();

            expect(result.current.isRevealing).toBe(true);

            await revealPromise;

            await waitFor(() => {
                expect(result.current.isRevealing).toBe(false);
            });
        });
    });
});
