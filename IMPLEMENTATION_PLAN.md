# Tier Explainer Page - Implementation Plan

## Overview

This document outlines the implementation plan for a tier explainer page that helps users understand the Stack'd referral tier system, benefits, and how to advance through tiers.

---

## 1. Existing Tier Files and Structure

### Core Tier Logic
| File | Purpose |
|------|---------|
| `src/lib/referrals/tiers.ts` | Tier calculation logic, thresholds, and utility functions |
| `src/lib/referrals/payout.ts` | Referral payout calculation (earnings rates per level) |
| `src/lib/db/types.ts` | TypeScript types for `UserTier`, `ReferralStats`, etc. |
| `test/lib/referrals/tiers.test.ts` | Unit tests for tier calculation |

### UI Components
| File | Purpose |
|------|---------|
| `src/components/referrals/ReferralDashboard.tsx` | Main referral dashboard with tier display |
| `src/components/ui/GlassCard.tsx` | Reusable glass-morphism card component |

### Existing Routes
| Route | File | Purpose |
|-------|------|---------|
| `/referrals` | `src/app/(main)/referrals/page.tsx` | Main referrals page with dashboard |

---

## 2. Current Tier Requirements and Benefits

### Tier Thresholds (from `tiers.ts`)

| Tier | Requirement | Gate Condition |
|------|-------------|----------------|
| **Bronze** | Default | None (starting tier) |
| **Silver** | Personal loan >= $500 | Unlocks payouts and network tiers |
| **Gold** | Network volume >= $5,000 | Requires Silver status |
| **Platinum** | Network volume >= $10,000 | Requires Silver status |
| **Black** | Network volume >= $50,000 | Requires Silver status |

### Silver Gate Mechanism
- Users MUST have Silver status (personal loan >= $500) to unlock network-based tiers
- Without Silver, even high network volume remains Bronze
- This ensures users have "skin in the game" before accessing higher tiers

### Tier Benefits (from `tiers.ts`)

| Tier | Benefit | Description |
|------|---------|-------------|
| **Bronze** | Base earnings | 0.5%/0.1%/0.1% (L1/L2/L3) |
| **Silver** | Payouts unlocked | Can withdraw referral earnings |
| **Gold** | +5% APY boost | Enhanced yield on holdings |
| **Platinum** | Priority support | Dedicated customer service |
| **Black** | Metal Visa card | Exclusive physical card access |

### Earnings Rates (from `payout.ts`)

| Level | Rate | Description |
|-------|------|-------------|
| L1 (Direct) | 0.5% APY | Earnings from direct referrals |
| L2 (2nd degree) | 0.1% APY | Earnings from referrals' referrals |
| L3 (3rd degree) | 0.1% APY | Earnings from 3rd level network |

---

## 3. Type Definitions Note

**Discrepancy Found:** The `types.ts` file only defines `UserTier` as `'BRONZE' | 'SILVER' | 'GOLD'`, but `tiers.ts` defines it as `'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK'`.

**Action Required:** Update `src/lib/db/types.ts` to include all five tiers:
```typescript
export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';
```

---

## 4. Proposed Page Route and Layout

### Route Options

| Option | Route | Pros | Cons |
|--------|-------|------|------|
| **A (Recommended)** | `/referrals/tiers` | Grouped with referrals, discoverable | Nested URL |
| B | `/wallet/tiers` | Near wallet features | Less intuitive connection |
| C | `/tiers` | Short URL | Less contextual |

**Recommendation:** Use `/referrals/tiers` as it logically groups with the referral system.

### Page Layout Structure

```
/referrals/tiers
├── Header Section
│   ├── Page title: "Tier Benefits"
│   ├── Subtitle: "Unlock rewards as you grow your network"
│   └── Back navigation to /referrals
│
├── Current Tier Card
│   ├── User's current tier with badge
│   ├── Progress to next tier
│   └── Quick stats (network volume, personal loan)
│
├── Tier Comparison Table/Cards
│   ├── All 5 tiers in vertical cards or horizontal scroll
│   ├── Requirements clearly shown
│   ├── Benefits listed with icons
│   └── Visual indication of current tier
│
├── How to Advance Section
│   ├── Step-by-step guide
│   ├── Silver Gate explanation
│   └── Tips for growing network
│
└── CTA Section
    └── "Start Earning" or "Share Referral Link" button
```

---

## 5. Components to Create

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TierExplainerPage` | `src/app/(main)/referrals/tiers/page.tsx` | Main page component |
| `TierCard` | `src/components/referrals/TierCard.tsx` | Individual tier display card |
| `TierComparisonGrid` | `src/components/referrals/TierComparisonGrid.tsx` | Grid/list of all tier cards |
| `TierProgressCard` | `src/components/referrals/TierProgressCard.tsx` | Current tier + progress display |
| `HowToAdvance` | `src/components/referrals/HowToAdvance.tsx` | Educational content section |

### Reusable Components (Already Exist)

| Component | Usage |
|-----------|-------|
| `GlassCard` | Container for tier cards and sections |
| `cn` utility | Class name composition |
| Lucide icons | `Trophy`, `Lock`, `CreditCard`, `Sparkles`, etc. |

---

## 6. Data Sources Needed

### Static Data (Can be defined in component/constants)

```typescript
// src/lib/referrals/tierData.ts
export const TIER_INFO = {
  BRONZE: {
    name: 'Bronze',
    color: 'orange',
    icon: 'Trophy',
    requirement: 'Starting tier',
    benefits: ['Base earnings (0.5%/0.1%/0.1%)', 'Track referral network'],
    highlight: false,
  },
  SILVER: {
    name: 'Silver',
    color: 'gray',
    icon: 'Trophy',
    requirement: 'Personal loan >= $500',
    benefits: ['Payouts unlocked', 'Withdraw earnings anytime'],
    highlight: false,
  },
  GOLD: {
    name: 'Gold',
    color: 'yellow',
    icon: 'Trophy',
    requirement: 'Network volume >= $5,000',
    benefits: ['+5% APY boost', 'All Silver benefits'],
    highlight: true, // Popular tier
  },
  PLATINUM: {
    name: 'Platinum',
    color: 'purple',
    icon: 'Crown',
    requirement: 'Network volume >= $10,000',
    benefits: ['Priority support', 'All Gold benefits'],
    highlight: false,
  },
  BLACK: {
    name: 'Black',
    color: 'slate',
    icon: 'CreditCard',
    requirement: 'Network volume >= $50,000',
    benefits: ['Metal Visa card', 'Exclusive events', 'All Platinum benefits'],
    highlight: false,
  },
};
```

### Dynamic Data (From hooks/API)

| Data | Source | Usage |
|------|--------|-------|
| Current user tier | `useReferral()` hook | Highlight current tier |
| Network volume | `ReferralStats.network_volume` | Show progress |
| Personal loan balance | User wallet data | Show Silver Gate progress |
| Next tier progress | `ReferralStats.next_tier_progress` | Progress bar |

---

## 7. Implementation Steps

### Phase 1: Setup
1. [ ] Update `types.ts` to include all 5 tiers
2. [ ] Create tier data constants file
3. [ ] Create page route structure

### Phase 2: Components
4. [ ] Create `TierCard` component
5. [ ] Create `TierComparisonGrid` component
6. [ ] Create `TierProgressCard` component
7. [ ] Create `HowToAdvance` component

### Phase 3: Page Assembly
8. [ ] Create `/referrals/tiers/page.tsx`
9. [ ] Wire up data from `useReferral` hook
10. [ ] Add navigation from ReferralDashboard

### Phase 4: Polish
11. [ ] Add animations/transitions
12. [ ] Mobile responsiveness
13. [ ] Add tests

---

## 8. Visual Design Considerations

### Tier Color Palette (from ReferralDashboard.tsx)

```typescript
const tierColors = {
  BRONZE: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  SILVER: { bg: 'bg-gray-400/10', border: 'border-gray-400/20', text: 'text-gray-300' },
  GOLD: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  PLATINUM: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  BLACK: { bg: 'bg-slate-800/50', border: 'border-slate-600/30', text: 'text-slate-200' },
};
```

### UI Patterns to Follow
- Glass morphism cards (`GlassCard` component)
- Orange accent color (`#ffa02d`)
- Dark theme with white text at varying opacities
- Rounded corners (`rounded-2xl`)
- Subtle borders (`border-white/10`)

---

## 9. Navigation Integration

### Add Link to ReferralDashboard

Add a "View All Tiers" link in the tier progress section of `ReferralDashboard.tsx`:

```tsx
<Link href="/referrals/tiers" className="text-[#ffa02d] text-xs">
  View all tiers →
</Link>
```

### Back Navigation

The tier explainer page should include back navigation to `/referrals`.

---

## 10. Future Enhancements

- [ ] Tier unlock animations
- [ ] Push notifications when tier changes
- [ ] Tier history/timeline view
- [ ] Share tier achievement on social media
- [ ] Personalized tips based on current progress

---

## Summary

The tier explainer page will be located at `/referrals/tiers` and will provide users with:
1. Clear understanding of all 5 tiers and their requirements
2. Visual display of benefits at each tier level
3. Progress tracking toward the next tier
4. Educational content on the Silver Gate mechanism
5. CTAs to grow their referral network

The implementation will leverage existing UI patterns (GlassCard, tier colors) and data sources (useReferral hook) while creating new modular components for reusability.
