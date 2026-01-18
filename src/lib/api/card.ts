/**
 * Card API Client
 * API functions for card management
 */
import type { CardDetails, CardTransaction, CardRevealDetails } from '@/types/card';

const API_BASE = '/api/card';

interface TransactionFilters {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}

/**
 * Fetch card details
 */
export async function getCardDetails(): Promise<CardDetails> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
        throw new Error('Failed to fetch card details');
    }
    return response.json();
}

/**
 * Fetch card transactions
 */
export async function getCardTransactions(
    filters?: TransactionFilters
): Promise<CardTransaction[]> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    const url = `${API_BASE}/transactions${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch transactions');
    }
    return response.json();
}

/**
 * Toggle card lock status
 */
export async function toggleCardLock(locked: boolean): Promise<void> {
    const response = await fetch(`${API_BASE}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked }),
    });
    if (!response.ok) {
        throw new Error('Failed to toggle card lock');
    }
}

/**
 * Reveal full card details (requires authentication)
 */
export async function revealCardDetails(): Promise<CardRevealDetails> {
    const response = await fetch(`${API_BASE}/reveal`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to reveal card details');
    }
    return response.json();
}

/**
 * Change card spending limit
 */
export async function changeCardLimit(newLimit: number): Promise<void> {
    const response = await fetch(`${API_BASE}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: newLimit }),
    });
    if (!response.ok) {
        throw new Error('Failed to change card limit');
    }
}

/**
 * Request new card PIN
 */
export async function requestNewPin(): Promise<void> {
    const response = await fetch(`${API_BASE}/pin`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to request new PIN');
    }
}
