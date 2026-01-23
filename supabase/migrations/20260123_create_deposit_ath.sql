-- Deposit ATH (All-Time High) Table Migration
-- This table tracks the highest deposit value each wallet has ever achieved
-- for the deposit leaderboard.

-- Create the deposit_ath table
CREATE TABLE IF NOT EXISTS deposit_ath (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    ath_usd NUMERIC NOT NULL DEFAULT 0,
    ath_compound_usd NUMERIC NOT NULL DEFAULT 0,
    ath_fluid_usd NUMERIC NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_deposit_ath_wallet ON deposit_ath(wallet_address);
CREATE INDEX IF NOT EXISTS idx_deposit_ath_amount ON deposit_ath(ath_usd DESC);

-- Add comment for documentation
COMMENT ON TABLE deposit_ath IS 'Tracks all-time high deposit values per wallet for the leaderboard';
COMMENT ON COLUMN deposit_ath.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN deposit_ath.ath_usd IS 'All-time high total collateral value in USD';
COMMENT ON COLUMN deposit_ath.ath_compound_usd IS 'ATH Compound v3 collateral value in USD';
COMMENT ON COLUMN deposit_ath.ath_fluid_usd IS 'ATH Fluid collateral value in USD';
COMMENT ON COLUMN deposit_ath.recorded_at IS 'Timestamp when the ATH was recorded';
