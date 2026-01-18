/**
 * Card Types and Interfaces
 * Types for virtual Visa card feature
 */

/**
 * Card status states
 */
export type CardStatus = 'active' | 'frozen' | 'pending' | 'cancelled';

/**
 * Virtual card details
 */
export interface CardDetails {
    id: string;
    lastFour: string;
    expiryMonth: string;
    expiryYear: string;
    cvv?: string; // Only available when revealed
    fullNumber?: string; // Only available when revealed
    isLocked: boolean;
    balance: number;
    limit: number;
    status: CardStatus;
    cardholderName: string;
}

/**
 * Merchant category codes for transactions
 */
export type MerchantCategory =
    | 'Telecommunication Services'
    | 'Eating Places, Restaurants'
    | 'Hotels, Motels, and Resorts'
    | 'Grocery Stores'
    | 'Gas Stations'
    | 'Transportation'
    | 'Entertainment'
    | 'Shopping'
    | 'Other';

/**
 * Card transaction record
 */
export interface CardTransaction {
    id: string;
    merchantName: string;
    merchantCategory: MerchantCategory;
    amount: number;
    cashbackAmount?: number;
    date: string;
    iconUrl?: string;
    status: 'completed' | 'pending' | 'declined';
}

/**
 * Card action types
 */
export type CardAction = 'lock' | 'unlock' | 'reveal' | 'changePin' | 'changeLimit';

/**
 * Response from card API
 */
export interface CardApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Card reveal response (includes sensitive data)
 */
export interface CardRevealDetails extends CardDetails {
    fullNumber: string;
    cvv: string;
}

/**
 * Wallet pass types for Apple/Google Pay
 */
export type WalletPassType = 'apple' | 'google';
