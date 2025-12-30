# Tier Progress Implementation Plan - BTC Deposit Criteria

## Summary
Add loan size (BTC deposit) criteria for tier advancement alongside referrals.

---

## 1. Components Showing Tier Progress

**Primary Component:** `src/components/referrals/ReferralDashboard.tsx`
- Current tier badge (Bronze/Silver/Gold) - lines 23-42
- Progress bar to next tier - lines 252-264
- `next_tier_remaining` text (e.g., "3/10 Referrals")

---

## 2. Current Data Structure

**ReferralStats Interface** (`src/lib/db/types.ts`):
```typescript
export interface ReferralStats {
  tier: UserTier;
  next_tier_progress: number;    // 0-100 percentage
  next_tier_remaining: string;   // e.g., "3/10 Referrals"
  // ... other fields
}
```

**Tier Thresholds** (`src/lib/referrals/tiers.ts`):
- SILVER: Personal loan >= $500
- GOLD: Network volume >= $5,000

**Key Finding:** `referralDb.ts` (lines 297-317) calculates tier purely from `totalInvites` - ignoring `personalLoanBalance` even though `tiers.ts` supports it!

---

## 3. Loan Size Data Source

**`useCompound` hook** provides:
- `borrowedAssets[0].usdValue` - Borrowed USDT amount (loan size)
- `suppliedAssets[0].usdValue` - Deposited WBTC value

**Access via:** `useLoanCalculationsContext()`

---

## 4. Proposed UI - Dual Progress Bars

```
[Tier Progress Card]
+------------------------------------------+
| BRONZE Status                     Active |
+------------------------------------------+
| Progress to Silver                       |
|                                          |
| Loan Size: $0 / $500                     |
| [===========-------------------------] 0%|
|                                          |
| Referrals: 2 / 3                         |
| [========================------------] 67%|
|                                          |
| * Both criteria required for Silver      |
+------------------------------------------+
```

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `src/lib/db/types.ts` | Add `personal_loan_balance`, `loan_progress`, `referral_progress` |
| `src/hooks/useReferral.ts` | Integrate loan data from `useLoanCalculationsContext` |
| `src/components/referrals/ReferralDashboard.tsx` | Add dual progress UI |
| `src/lib/db/referralDb.ts` | Update tier calculation to use actual loan balance |
