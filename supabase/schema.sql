-- Supabase SQL Schema for Referral System
-- Run this in the Supabase SQL Editor to create the tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- Index for finding referees of a user
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);

-- Lowercase wallet addresses for consistency
CREATE OR REPLACE FUNCTION lowercase_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    NEW.wallet_address = LOWER(NEW.wallet_address);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lowercase_wallet
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION lowercase_wallet_address();

-- =============================================================================
-- REFERRAL EARNINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.referral_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    amount DECIMAL(18, 6) NOT NULL DEFAULT 0,
    period DATE NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries for same referrer/referee/period
    UNIQUE(referrer_id, referee_id, period)
);

-- Index for fast earnings lookup by referrer
CREATE INDEX IF NOT EXISTS idx_earnings_referrer ON public.referral_earnings(referrer_id);

-- Index for unclaimed earnings
CREATE INDEX IF NOT EXISTS idx_earnings_unclaimed ON public.referral_earnings(referrer_id, claimed) 
    WHERE claimed = FALSE;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Users can read their own data (by wallet address match)
-- Note: Service role key bypasses RLS, so server-side code is unaffected
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND wallet_address = LOWER(auth.jwt() ->> 'wallet_address')
    );

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND wallet_address = LOWER(auth.jwt() ->> 'wallet_address')
    );

-- Allow insert for new user registration (server-side via service role)
CREATE POLICY "Service can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Earnings are readable by the referrer
CREATE POLICY "Referrers can view earnings" ON public.referral_earnings
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND referrer_id IN (
            SELECT id FROM public.users
            WHERE wallet_address = LOWER(auth.jwt() ->> 'wallet_address')
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := 'STACK';
    i INTEGER;
BEGIN
    FOR i IN 1..5 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get network volume for a user (sum of L1, L2, L3 referee loans)
-- This would need to query actual loan data from the blockchain
-- For now, return a placeholder that can be updated later
CREATE OR REPLACE FUNCTION get_network_volume(user_id UUID)
RETURNS DECIMAL AS $$
BEGIN
    -- TODO: Integrate with on-chain loan data
    RETURN 0;
END;
$$ LANGUAGE plpgsql;
