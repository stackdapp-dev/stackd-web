'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ReferralGateProps {
    /** Called when validation succeeds */
    onValidated: () => void;
    /** Error message from URL param validation */
    initialError?: string | null;
    /** Validate code function */
    validateCode: (code: string) => Promise<boolean>;
    /** Loading state */
    isLoading: boolean;
}

/**
 * ReferralGate - Screen shown before Privy login
 * 
 * Users must enter a valid referral code before they can sign up.
 * Supports both manual entry and URL param (?ref=CODE).
 */
const ReferralGate = ({ onValidated, initialError, validateCode, isLoading }: ReferralGateProps) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(initialError || null);
    const [validating, setValidating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setError('Please enter a referral code');
            return;
        }

        setValidating(true);
        setError(null);

        const isValid = await validateCode(code.trim());

        if (isValid) {
            onValidated();
        } else {
            setError('Invalid referral code. Please check and try again.');
        }

        setValidating(false);
    };

    return (
        <div className="flex pt-24 flex-col gap-8 items-center px-8 min-h-screen bg-black">
            <Image src="/login-logo.png" alt="Stack'd Logo" width={164} height={26} />

            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <h1 className="text-2xl font-bold text-white">Join Stack&apos;d</h1>
                <p className="text-white/60">
                    Stack&apos;d is invite-only. Enter a referral code to get started.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="referralCode" className="text-sm text-white/80">
                        Referral Code
                    </label>
                    <input
                        id="referralCode"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="STACK12345"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent uppercase tracking-widest text-center text-lg font-mono"
                        maxLength={10}
                        disabled={validating || isLoading}
                        autoComplete="off"
                        autoCapitalize="characters"
                    />
                </div>

                {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <Button
                    type="submit"
                    className="w-full text-lg font-semibold h-12"
                    disabled={validating || isLoading || !code.trim()}
                >
                    {validating || isLoading ? 'Verifying...' : 'Continue'}
                </Button>
            </form>

            <p className="text-center text-sm text-white/50 max-w-sm">
                Don&apos;t have a code? Ask a friend who uses Stack&apos;d for their referral link.
            </p>
        </div>
    );
};

export default ReferralGate;
