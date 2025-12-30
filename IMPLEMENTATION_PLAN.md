# PnL Breakdown Carousel Implementation Plan

## Overview

This document outlines the implementation plan for adding a PnL (Profit and Loss) breakdown carousel to the wallet page. The feature will provide users with detailed insights into their portfolio performance through a swipeable card interface.

---

## 1. Current Wallet Balance/PnL Display

### Files Showing Wallet Balance/PnL

| File | Purpose |
|------|---------|
| `src/app/(main)/wallet/page.tsx` | Main wallet page - displays total portfolio balance |
| `src/components/wallet/Balance.tsx` | Hero balance card with 24h change display |
| `src/components/wallet/Assets.tsx` | Asset list with per-token values and 24h change |
| `src/components/wallet/StatCards.tsx` | Cash/Holdings stat cards (currently unused) |
| `src/app/(main)/wallet/layout.tsx` | Wallet layout with WalletBalanceProvider context |

### Current Balance Display Components

**Balance.tsx** - Hero balance card showing:
- Portfolio Balance (total USD value)
- 24h change amount and percentage (props exist but currently passed as 0)
- Visibility toggle (eye icon)

**Assets.tsx** - Per-asset display:
- Token name/symbol
- Token amount
- USD value
- 24h percentage change

---

## 2. Current PnL Calculation Approach

### Data Sources

| Hook/Provider | Data Provided |
|---------------|---------------|
| `useWalletBalance` (src/hooks/useWalletBalance.ts) | Token balances, USD values, total balance |
| `useTokenPrices` (src/providers/TokenPriceProvider.tsx) | Current token prices from CoinGecko |
| `useLoanCalculations` (src/hooks/useLoanCalculations.ts) | Loan positions, net loan value |
| `useCompound` (src/hooks/useCompound.ts) | Collateral/borrow amounts, LTV metrics |
| `useReferral` (src/hooks/useReferral.ts) | Referral earnings, inflation avoided |

### Current Calculation Logic

```typescript
// From useWalletBalance.ts
const assets: Asset[] = Object.entries(TOKEN_METADATA).map(([key, meta]) => {
  const amount = key === "ETH" ? ethBalance : tokenBalances[key]?.balance;
  const usdValue = amount * (tokenPrices[key]?.usd ?? 0);
  return { symbol, name, amount, usdValue, icon };
});

const totalBalance = assets.reduce((sum, a) => sum + a.usdValue, 0);
```

### Missing PnL Data

Currently, the codebase does **NOT** track:
- **Cost basis** - Purchase prices for tokens
- **Historical prices** - No price history storage
- **Entry timestamps** - When tokens were acquired
- **Realized gains** - Profits from completed trades

The `change24h` props in Balance.tsx are passed as `0` - 24h change is not calculated.

---

## 3. PnL Breakdown Categories Needed

### 3.1 PnL by Asset
- WBTC unrealized gains/losses
- USDT (stablecoins typically flat)
- ETH unrealized gains/losses (external wallets only)

### 3.2 PnL by Time Period
- 24h change (requires price history)
- 7d change
- 30d change
- All-time (requires cost basis)

### 3.3 PnL by Source
- **Holdings** - Wallet token appreciation
- **Lending** - Compound collateral appreciation
- **Referrals** - Already tracked in `useReferral` (total_earnings, inflation_avoided)
- **Trading** - Requires transaction history analysis

---

## 4. Carousel/Swipe Patterns

### Existing Dependencies

```json
// package.json - No dedicated carousel library
{
  "framer-motion": "^12.23.26",  // Can be used for carousel
  "vaul": "^1.1.2"               // Drawer component
}
```

### Existing Patterns

- **Tabs UI** (`src/components/ui/tabs.tsx`) - Radix tabs, click-based
- **Framer Motion** (`src/components/common/PageTransition.tsx`) - Page animations
- **No horizontal scroll patterns** found in codebase

### Recommended Approach

Use **Framer Motion** for the carousel since it's already installed. Alternatively, add **embla-carousel-react** for a more feature-rich carousel with better touch handling.

---

## 5. Proposed Carousel Structure

### Card 1: Total PnL Overview
```
+----------------------------------+
|  TOTAL PNL                       |
|  +$1,234.56  (+5.2%)             |
|                                  |
|  24h: +$45.00   7d: +$200.00     |
|  30d: +$500.00  All: +$1,234.56  |
|                                  |
|  [Chart placeholder]             |
+----------------------------------+
```

### Card 2: PnL by Asset
```
+----------------------------------+
|  PNL BY ASSET                    |
|                                  |
|  WBTC    +$1,180.00  (+5.5%)     |
|  USDT    +$0.00      (0.0%)      |
|  ETH     +$54.56     (+2.1%)     |
|                                  |
|  [Bar chart breakdown]           |
+----------------------------------+
```

### Card 3: PnL by Source
```
+----------------------------------+
|  PNL BY SOURCE                   |
|                                  |
|  Holdings      +$800.00          |
|  Lending       +$350.00          |
|  Referrals     +$84.56           |
|                                  |
|  [Pie/donut chart]               |
+----------------------------------+
```

### Navigation Indicators
- Dot indicators at bottom (3 dots)
- Swipe left/right gestures
- Optional: Edge tap navigation

---

## 6. Components to Create

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PnLCarousel.tsx` | `src/components/wallet/` | Main carousel wrapper |
| `PnLOverviewCard.tsx` | `src/components/wallet/pnl/` | Total PnL summary |
| `PnLByAssetCard.tsx` | `src/components/wallet/pnl/` | Asset-wise breakdown |
| `PnLBySourceCard.tsx` | `src/components/wallet/pnl/` | Source-wise breakdown |
| `CarouselDots.tsx` | `src/components/ui/` | Dot indicator component |

### New Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `usePnLCalculations.ts` | `src/hooks/` | Aggregate PnL from all sources |
| `usePriceHistory.ts` | `src/hooks/` | Fetch/cache historical prices |

### Types

```typescript
// src/types/pnl.ts
interface PnLData {
  total: number;
  totalPercent: number;
  byPeriod: {
    h24: { amount: number; percent: number };
    d7: { amount: number; percent: number };
    d30: { amount: number; percent: number };
    allTime: { amount: number; percent: number };
  };
  byAsset: {
    symbol: string;
    amount: number;
    percent: number;
  }[];
  bySource: {
    holdings: number;
    lending: number;
    referrals: number;
    trading: number;
  };
}
```

---

## 7. Integration Points

### Wallet Page Integration

```typescript
// src/app/(main)/wallet/page.tsx
import { PnLCarousel } from "@/components/wallet/PnLCarousel";

const Wallet = () => {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <Balance ... />

      {/* New PnL Carousel - insert after Balance */}
      <PnLCarousel />

      <ActionButtons />
      <Assets ... />
      <ActiveLoans />
    </div>
  );
};
```

### Data Provider Integration

The carousel will consume data from:
- `useWalletBalanceContext()` - Current balances
- `useLoanCalculationsContext()` - Loan positions
- `useReferral()` - Referral earnings
- `useTokenPrices()` - Current prices
- New `usePriceHistory()` - Historical prices for time-based PnL

---

## 8. Implementation Phases

### Phase 1: Basic Carousel Infrastructure
1. Create carousel container component with Framer Motion
2. Implement swipe gestures and dot indicators
3. Create placeholder cards with mock data

### Phase 2: PnL Calculations (MVP)
1. Create `usePnLCalculations` hook
2. Implement PnL by source (using existing data)
3. Display referral earnings breakdown

### Phase 3: Price History Integration
1. Add CoinGecko historical price API integration
2. Create `usePriceHistory` hook with caching
3. Implement 24h/7d/30d change calculations

### Phase 4: Full PnL Breakdown
1. Implement PnL by asset card
2. Add PnL overview with period selector
3. Add visual charts (optional)

---

## 9. API Requirements

### New API Endpoint (Optional)

```
GET /api/price-history?symbols=WBTC,ETH&days=30
```

Response:
```json
{
  "WBTC": {
    "prices": [[timestamp, price], ...],
    "change24h": 2.5,
    "change7d": 5.2,
    "change30d": 12.1
  }
}
```

### CoinGecko Market Chart API

```
GET https://api.coingecko.com/api/v3/coins/{id}/market_chart
?vs_currency=usd&days=30
```

---

## 10. Design Considerations

### Styling Consistency

Follow existing patterns from:
- `GlassCard` component for card styling
- Amber/orange accent colors (`#ffa02d`)
- White/60 for secondary text
- `rounded-2xl` for card corners
- `backdrop-blur-xl bg-white/5 border border-white/10` glass effect

### Animations

- Use Framer Motion `AnimatePresence` for card transitions
- `spring` physics for natural swipe feel
- Match `PageTransition.tsx` animation patterns

### Responsive Design

- Full-width cards with `px-4` horizontal padding
- Touch targets minimum 44px
- Gesture threshold 50px for swipe detection

---

## 11. Testing Plan

### Unit Tests
- PnL calculation logic
- Price history caching
- Carousel navigation state

### Integration Tests
- Carousel renders with real data
- Swipe gestures work correctly
- Data updates propagate to cards

### E2E Tests
- Carousel interaction on wallet page
- Navigation between cards
- Data accuracy verification

---

## 12. Files Changed Summary

### New Files
- `src/components/wallet/PnLCarousel.tsx`
- `src/components/wallet/pnl/PnLOverviewCard.tsx`
- `src/components/wallet/pnl/PnLByAssetCard.tsx`
- `src/components/wallet/pnl/PnLBySourceCard.tsx`
- `src/components/ui/CarouselDots.tsx`
- `src/hooks/usePnLCalculations.ts`
- `src/hooks/usePriceHistory.ts`
- `src/types/pnl.ts`
- `src/app/api/price-history/route.ts` (optional)

### Modified Files
- `src/app/(main)/wallet/page.tsx` - Add PnLCarousel
- `src/components/wallet/Balance.tsx` - Pass actual 24h change data
- `src/app/(main)/wallet/layout.tsx` - Add PnL provider if needed

---

## Next Steps

1. Review and approve this implementation plan
2. Create feature branch from `feat/7-add-wallet-pnl-breakdown`
3. Implement Phase 1: Basic carousel infrastructure
4. Iterate based on design feedback
