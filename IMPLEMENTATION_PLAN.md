# Implementation Plans

This file contains implementation plans for multiple features.

---

# Tier Progress Implementation Plan - BTC Deposit Criteria (feat/6)

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

---
---

# Transaction Progress Indicator - Implementation Plan (feat/3)

## Overview
This document outlines the plan for implementing a TransactionProgressIndicator component to visually display transaction status progress in the Stack'd wallet app.

---

## 1. Current Architecture Analysis

### Files Showing Transaction History

| File | Purpose |
|------|---------|
| `src/app/(main)/history/page.tsx` | Main history list page - displays all transactions |
| `src/app/(main)/history/[id]/page.tsx` | Transaction detail page - shows single transaction details |
| `src/app/(main)/history/layout.tsx` | Layout wrapper providing TransactionsProvider |
| `src/providers/TransactionsProvider.tsx` | Context provider for transaction state and utilities |
| `src/hooks/useTransactionHistory.ts` | Hook for fetching on-chain transaction history (Arbiscan) |
| `src/lib/api/transactions.ts` | API functions for backend transaction CRUD |
| `src/types/transaction.ts` | TypeScript type definitions |

### Two Transaction Systems Identified

1. **On-chain Transactions** (via `useTransactionHistory` hook)
   - Used in: `src/app/(main)/history/page.tsx`
   - Source: Arbiscan API (fetches from blockchain)
   - Types: `send` | `receive`
   - Status tracking: Only `isError` boolean (no progress states)

2. **Backend Transactions** (via `TransactionsProvider`)
   - Used in: `src/app/(main)/history/[id]/page.tsx`
   - Source: Backend API (`/transactions` endpoint)
   - Types: `otc_withdrawal` | `otc_refund` | `deposit` | `transfer`
   - Status tracking: Full progress states

---

## 2. Current Transaction Data Structures

### Backend Transaction Type (`src/types/transaction.ts`)

```typescript
export type Status = "open" | "processing" | "failed" | "fulfilled" | "refunded";
export type DisplayStatus = "Pending" | "Fulfilled" | "Failed" | "Refunded";

export type TransactionType =
  | "otc_withdrawal"
  | "otc_refund"
  | "deposit"
  | "transfer";

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  date: string;
  otcOrderId: string;
  txHash: string;
  amount: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  order?: Order | null;
  paymentMethod?: PaymentMethod | null;
};
```

### On-chain Transaction Type (`src/hooks/useTransactionHistory.ts`)

```typescript
export interface Transaction {
  hash: string;
  type: "send" | "receive";
  from: string;
  to: string;
  value: string;
  symbol: string;
  decimals: number;
  timestamp: number;
  blockNumber: string;
  isError?: boolean;
  gasUsed?: string;
  gasPrice?: string;
}
```

---

## 3. Status Flow Analysis

### Current Status Mapping (from TransactionsProvider)

| Internal Status | Display Status | Badge Color |
|----------------|----------------|-------------|
| `open` | Pending | Amber |
| `processing` | Pending | Amber |
| `failed` | Failed | Red |
| `fulfilled` | Fulfilled | Green |
| `refunded` | Refunded | Blue |

### Proposed Progress Steps by Transaction Type

#### OTC Withdrawal Flow
1. **Initiated** - Transaction created (`open`)
2. **Processing** - Being processed by OTC partner (`processing`)
3. **Completed/Failed** - Final state (`fulfilled` / `failed` / `refunded`)

#### Deposit Flow
1. **Detected** - Transaction detected on-chain
2. **Confirming** - Waiting for confirmations
3. **Completed** - Funds credited

#### Transfer Flow
1. **Initiated** - Transfer started
2. **Pending** - Awaiting confirmation
3. **Completed** - Transfer confirmed

---

## 4. Where to Add Progress Indicator

### Primary Integration Point
**File:** `src/app/(main)/history/[id]/page.tsx`

This is the transaction detail page where users view individual transaction status. The progress indicator should be added:
- Below the page header
- Above the transaction details card
- Prominently visible as the first content element

### Secondary Integration Point (Optional)
**File:** `src/app/(main)/history/page.tsx`

Could add a mini/compact version of the indicator to the transaction list items for pending transactions.

---

## 5. Proposed Component Structure

### New Components to Create

```
src/components/transactions/
├── TransactionProgressIndicator.tsx    # Main progress indicator component
├── ProgressStep.tsx                     # Individual step component
└── index.ts                             # Barrel export
```

### TransactionProgressIndicator Props

```typescript
interface TransactionProgressIndicatorProps {
  status: Status;
  type: TransactionType;
  className?: string;
}
```

### ProgressStep Props

```typescript
interface ProgressStepProps {
  label: string;
  status: "completed" | "current" | "pending";
  icon?: React.ReactNode;
}
```

### Component Design Requirements

1. **Visual Design**
   - Use existing UI components (Card, Text) for consistency
   - Follow glass/dark theme from existing components
   - Color scheme: Green (completed), Amber (current), Gray (pending)
   - Animated transitions between states

2. **Accessibility**
   - ARIA labels for screen readers
   - Proper semantic HTML
   - Keyboard navigable

3. **Responsive**
   - Mobile-first design
   - Horizontal stepper layout
   - Compact version for list items

---

## 6. Implementation Steps

### Phase 1: Component Creation
1. Create `TransactionProgressIndicator.tsx` component
2. Create `ProgressStep.tsx` sub-component
3. Add step configuration per transaction type
4. Implement status-to-step mapping logic

### Phase 2: Integration
1. Import and add to `history/[id]/page.tsx`
2. Pass transaction status and type props
3. Style integration with existing layout

### Phase 3: Enhancement (Optional)
1. Add compact version for list items
2. Add animations/transitions
3. Add real-time status polling for pending transactions

---

## 7. Existing UI Components to Leverage

From `src/components/ui/`:
- `card.tsx` - Container styling
- `text.tsx` - Typography
- `loading.tsx` - Loading states
- `skeleton.tsx` - Loading placeholders

From `lucide-react` (already used):
- `Check` - Completed step
- `Clock` - Pending step
- `AlertCircle` - Failed step
- `RefreshCw` - Processing step

---

## 8. Testing Considerations

1. Unit tests for status-to-step mapping
2. Visual regression tests for different states
3. Test all transaction type flows
4. Test edge cases (failed, refunded states)

---

## 9. File Changes Summary

| Action | File |
|--------|------|
| CREATE | `src/components/transactions/TransactionProgressIndicator.tsx` |
| CREATE | `src/components/transactions/ProgressStep.tsx` |
| CREATE | `src/components/transactions/index.ts` |
| MODIFY | `src/app/(main)/history/[id]/page.tsx` |
| MODIFY (optional) | `src/app/(main)/history/page.tsx` |

---

## 10. Dependencies

No new dependencies required. Uses existing:
- React
- lucide-react (icons)
- Tailwind CSS (styling)
- Existing UI component library

---
---

# Loan Simulator Implementation Plan (feat/5)

## Overview

This document outlines the implementation plan for adding a Loan Simulator feature to the Stack'd crypto wallet app. The simulator will allow users to preview how different collateral and borrow amounts affect their loan metrics before committing to any transactions.

---

## 1. Existing Loan Detail Files

### Main Pages

| File | Description |
|------|-------------|
| `src/app/(main)/wallet/loan/page.tsx` | **Loan Details Page** - Full-page view showing loan summary, collateral, and statistics |
| `src/app/(main)/wallet/tx/[mode]/page.tsx` | **Transaction Page** - Handles borrow/repay flows with amount input and preview |

### Components

| File | Description |
|------|-------------|
| `src/components/wallet/LoanInfo.tsx` | Displays loan info card with supplied/borrowed assets, LTV, APR, borrowable amount |
| `src/components/wallet/ActiveLoans.tsx` | Shows active loan summary card on wallet home with LTV progress bar |
| `src/components/wallet/TransactionOverview.tsx` | Shows transaction preview with before/after values for loan metrics |

---

## 2. Current Loan Calculation Logic

### Hooks

#### `src/hooks/useCompound.ts`
Main hook for interacting with Compound protocol. Provides:
- `collateralRaw` / `borrowRaw` - Raw on-chain values
- `suppliedAssets` / `borrowedAssets` - Formatted asset arrays with amounts and USD values
- `maxLtv` - Maximum loan-to-value ratio (from `borrowCollateralFactor`)
- `liquidationRatio` - Liquidation threshold (from `liquidateCollateralFactor`)
- `borrowApr` - Current borrow APR calculated from utilization rate
- `netLoanValue` - Collateral USD - Borrowed USD

#### `src/hooks/useLoanCalculations.ts`
Pure calculation hook that takes assets and preview amount.

### Key Formulas

| Metric | Formula |
|--------|---------|
| LTV | `(totalBorrowedUSD / totalSuppliedUSD) * 100` |
| Borrowable Amount | `totalSuppliedUSD * (maxLtv / 100) - totalBorrowedUSD` |
| Liquidation Price | `totalBorrowedUSD * (100 / liquidationRatio)` |
| Borrow Capacity | `totalSuppliedUSD * (maxLtv / 100)` |
| Borrow APR | `(borrowRate / 10^18) * secondsPerYear * 100` |

---

## 3. Key Components Created

1. **`LoanSimulator.tsx`** - Main simulator component with collateral and borrow sliders
2. **`SimulatorGauge.tsx`** - Visual LTV gauge showing current vs simulated position
3. **`SimulatorResults.tsx`** - Results grid showing borrowable, liquidation price, health factor, monthly cost

### Integration Points

- Uses existing `Tabs` component from `@/components/ui/tabs`
- Uses existing `Card` component for consistent styling
- Reuses `useLoanCalculations` with `previewBorrowAmount` parameter
