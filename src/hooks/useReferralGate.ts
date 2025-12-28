'use client';

import { useState, useEffect, useCallback } from 'react';

const REFERRAL_STORAGE_KEY = 'stackd_referral_code';

interface ReferralGateState {
    /** The validated referral code */
    referralCode: string | null;
    /** Whether the code has been validated */
    isValidated: boolean;
    /** Loading state during validation */
    isLoading: boolean;
    /** Error message if validation fails */
    error: string | null;
    /** Validate a referral code via API */
    validateCode: (code: string) => Promise<boolean>;
    /** Clear stored referral */
    clearReferral: () => void;
}

/**
 * Hook to manage referral gate state
 * 
 * Handles:
 * - URL param ?ref=CODE auto-detection
 * - localStorage persistence
 * - API validation
 */
export function useReferralGate(): ReferralGateState {
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [isValidated, setIsValidated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check localStorage and URL params on mount
    useEffect(() => {
        const checkExistingReferral = async () => {
            // 1. Check localStorage first
            const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
            if (storedCode) {
                setReferralCode(storedCode);
                setIsValidated(true);
                setIsLoading(false);
                return;
            }

            // 2. Check URL param ?ref=CODE
            const urlParams = new URLSearchParams(window.location.search);
            const refParam = urlParams.get('ref');

            if (refParam) {
                // Auto-validate code from URL
                const isValid = await validateCodeInternal(refParam);
                if (isValid) {
                    localStorage.setItem(REFERRAL_STORAGE_KEY, refParam.toUpperCase());
                    setReferralCode(refParam.toUpperCase());
                    setIsValidated(true);
                } else {
                    setError('Invalid referral code');
                }
            }

            setIsLoading(false);
        };

        checkExistingReferral();
    }, []);

    const validateCodeInternal = async (code: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/referrals/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();
            return data.valid === true;
        } catch {
            return false;
        }
    };

    const validateCode = useCallback(async (code: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const isValid = await validateCodeInternal(code);

            if (isValid) {
                const normalizedCode = code.toUpperCase();
                localStorage.setItem(REFERRAL_STORAGE_KEY, normalizedCode);
                setReferralCode(normalizedCode);
                setIsValidated(true);
                setIsLoading(false);
                return true;
            } else {
                setError('Invalid referral code. Please check and try again.');
                setIsLoading(false);
                return false;
            }
        } catch {
            setError('Failed to validate code. Please try again.');
            setIsLoading(false);
            return false;
        }
    }, []);

    const clearReferral = useCallback(() => {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        setReferralCode(null);
        setIsValidated(false);
        setError(null);
    }, []);

    return {
        referralCode,
        isValidated,
        isLoading,
        error,
        validateCode,
        clearReferral,
    };
}

/**
 * Get stored referral code (for use after auth)
 */
export function getStoredReferralCode(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/**
 * Clear stored referral code (after linking to user)
 */
export function clearStoredReferralCode(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
