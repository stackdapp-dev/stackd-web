/**
 * Card Test Fixtures
 * Mock data for card-related tests
 */
import type { CardDetails, CardTransaction } from '@/types/card';

/**
 * Mock card data for testing
 */
export const mockCardDetails: CardDetails = {
    id: 'card_test_001',
    lastFour: '1234',
    expiryMonth: '12',
    expiryYear: '2028',
    isLocked: false,
    balance: 0,
    limit: 10000,
    status: 'active',
    cardholderName: 'JOHN DOE',
};

export const mockLockedCard: CardDetails = {
    ...mockCardDetails,
    id: 'card_test_002',
    isLocked: true,
    status: 'frozen',
};

export const mockCardWithBalance: CardDetails = {
    ...mockCardDetails,
    id: 'card_test_003',
    balance: 4250.75,
};

/**
 * Mock transaction data for testing
 */
export const mockTransactions: CardTransaction[] = [
    {
        id: 'tx_001',
        merchantName: 'SMART APP',
        merchantCategory: 'Telecommunication Services',
        amount: -34.48,
        cashbackAmount: 34.48,
        date: '2026-01-18T10:30:00Z',
        status: 'completed',
    },
    {
        id: 'tx_002',
        merchantName: 'SPOTTED PIG CAFE',
        merchantCategory: 'Eating Places, Restaurants',
        amount: -4.12,
        cashbackAmount: 4.12,
        date: '2026-01-17T14:22:00Z',
        status: 'completed',
    },
    {
        id: 'tx_003',
        merchantName: 'Shangrila Canton Road',
        merchantCategory: 'Hotels, Motels, and Resorts',
        amount: 0,
        cashbackAmount: 0,
        date: '2026-01-16T09:00:00Z',
        status: 'pending',
    },
    {
        id: 'tx_004',
        merchantName: 'Spotted Pig Proscenium',
        merchantCategory: 'Eating Places, Restaurants',
        amount: -4.12,
        cashbackAmount: 4.12,
        date: '2026-01-15T18:45:00Z',
        status: 'completed',
    },
];

/**
 * Mock revealed card details (sensitive data)
 */
export const mockRevealedCard = {
    ...mockCardDetails,
    fullNumber: '4111111111111234',
    cvv: '123',
};

/**
 * Empty transactions state
 */
export const emptyTransactions: CardTransaction[] = [];
