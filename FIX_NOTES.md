# APY Bug Location and Fix Plan

## Bug Description
The "next tier" section incorrectly displays an APY boost benefit that should be removed.

## Files Containing the Bug

### 1. src/components/referrals/ReferralDashboard.tsx
- **Line 278**: Hardcoded APY text in the locked "Gold Status" tier card
- **Current code**: `<p className="text-white/30 text-xs mt-1">+5% APY Boost</p>`
- **Location context**: Inside the "Locked Tiers Grid" section, specifically the "Gold Status - Locked" card

### 2. src/lib/referrals/tiers.ts
- **Line 83**: The `getTierBenefits()` function returns APY boost for GOLD tier
- **Current code**: `return '+5% APY boost';`
- **Location context**: Inside the `getTierBenefits(tier: UserTier)` switch statement

## Recommended Fix

### Option A: Remove APY references entirely
1. In `ReferralDashboard.tsx` line 278:
   - Change "+5% APY Boost" to a different benefit (e.g., "Priority Rewards" or "Enhanced Earnings")
   - Or remove the entire `<p>` element if no replacement benefit is needed

2. In `tiers.ts` line 83:
   - Change the GOLD tier benefit from "+5% APY boost" to a different benefit description
   - This function is used to display tier benefits in the UI

## Impact Assessment
- The `getTierBenefits()` function in tiers.ts may be called from other locations
- The hardcoded text in ReferralDashboard.tsx is isolated to that component
- Both changes should be made together to maintain consistency
