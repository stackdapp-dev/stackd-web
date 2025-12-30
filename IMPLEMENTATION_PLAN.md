# Loan Simulator Implementation Plan

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
Pure calculation hook that takes assets and preview amount. Returns:

```typescript
{
  // Current state
  ltv: number;                    // (borrowedUSD / suppliedUSD) * 100
  borrowableAmount: number;       // suppliedUSD * (maxLtv/100) - borrowedUSD
  liquidationPrice: number;       // borrowedUSD * (100 / liquidationRatio)
  borrowCapacity: number;         // suppliedUSD * (maxLtv/100)

  // Preview calculations (with previewBorrowAmount)
  ltvRange: [current, preview];
  borrowable: [current, preview];
  liquidationRange: [current, preview];
  usdt: [current, preview];

  // Protocol parameters
  maxLtv: number;
  liquidationRatio: number;
  borrowApr: number;
}
```

### Key Formulas

| Metric | Formula |
|--------|---------|
| LTV | `(totalBorrowedUSD / totalSuppliedUSD) * 100` |
| Borrowable Amount | `totalSuppliedUSD * (maxLtv / 100) - totalBorrowedUSD` |
| Liquidation Price | `totalBorrowedUSD * (100 / liquidationRatio)` |
| Borrow Capacity | `totalSuppliedUSD * (maxLtv / 100)` |
| Borrow APR | `(borrowRate / 10^18) * secondsPerYear * 100` |

---

## 3. Available Data

### From `useCompound` Hook

```typescript
{
  suppliedAssets: Asset[];      // [{symbol: "WBTC", amount, usdValue, decimals}]
  borrowedAssets: Asset[];      // [{symbol: "USDT", amount, usdValue, decimals}]
  maxLtv: number;               // e.g., 80 (percent)
  liquidationRatio: number;     // e.g., 85 (percent)
  borrowApr: number;            // e.g., 5.5 (percent)
}
```

### From `LoanCalculationsProvider` Context

```typescript
{
  loanCalcs: LoanCalculations;
  setPreviewAmount: (amount: number) => void;  // Already supports preview!
  refetchLoanData: () => Promise<void>;
}
```

### Token Prices
Available via `useGetTokenPrice()` from `TokenPriceProvider`

---

## 4. Proposed Simulator UI Structure

### Location
Add as a new tab within the existing Loan Details page (`/wallet/loan`).

### Tab Structure

```
[Overview] [Simulator]
```

### Simulator Tab Layout

```
+------------------------------------------+
|  LOAN SIMULATOR                          |
+------------------------------------------+
|                                          |
|  Collateral (WBTC)                       |
|  +------------------------------------+  |
|  | [Slider: 0 to max wallet balance] |  |
|  | Current: 0.05 WBTC ($4,750)        |  |
|  +------------------------------------+  |
|                                          |
|  Borrow Amount (USDT)                    |
|  +------------------------------------+  |
|  | [Slider: 0 to borrowable amount]  |  |
|  | Simulated: $2,000                  |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
|  SIMULATION RESULTS                      |
+------------------------------------------+
|                                          |
|  LTV Gauge                               |
|  [====|===========|====]                 |
|   0%  Current    Max    Liquidation      |
|        45%       80%    85%              |
|                                          |
|  +----------------+ +----------------+   |
|  | Borrowable     | | Liquidation    |   |
|  | $1,800         | | Price: $42,500 |   |
|  +----------------+ +----------------+   |
|                                          |
|  +----------------+ +----------------+   |
|  | Health Factor  | | Monthly Cost   |   |
|  | 1.88 (Safe)    | | ~$9.17         |   |
|  +----------------+ +----------------+   |
|                                          |
+------------------------------------------+
|  [Apply to Loan]  [Reset]                |
+------------------------------------------+
```

### Key Components to Create

1. **`LoanSimulator.tsx`** - Main simulator component with:
   - Collateral slider (WBTC amount)
   - Borrow amount slider (USDT amount)
   - Real-time calculation updates

2. **`SimulatorGauge.tsx`** - Visual LTV gauge showing:
   - Current LTV position
   - Simulated LTV position
   - Max LTV threshold
   - Liquidation threshold

3. **`SimulatorResults.tsx`** - Results grid showing:
   - Borrowable amount (current vs simulated)
   - Liquidation price (current vs simulated)
   - Health factor
   - Monthly/yearly interest cost

### Integration Points

1. **Reuse `useLoanCalculations`** - Already supports `previewBorrowAmount` parameter
2. **Extend for collateral preview** - Add `previewCollateralAmount` to calculations
3. **Use existing `Tabs` component** - From `@/components/ui/tabs`
4. **Use existing `Card` component** - For consistent styling

---

## 5. Implementation Steps

### Phase 1: Extend Calculation Logic
1. Add `previewCollateralAmount` parameter to `useLoanCalculations`
2. Create `useSimulator` hook for managing both sliders
3. Add health factor calculation

### Phase 2: Create Simulator Components
1. Build `LoanSimulator` main component
2. Build `SimulatorGauge` visualization
3. Build `SimulatorResults` grid

### Phase 3: Integrate into Loan Page
1. Add tabs to loan page (Overview / Simulator)
2. Connect simulator to existing provider
3. Add "Apply to Loan" navigation to borrow page

### Phase 4: Polish & Testing
1. Add animations for slider changes
2. Add risk warnings at high LTV
3. Test with various collateral amounts
4. Mobile responsiveness

---

## 6. Technical Notes

### Existing UI Components Available
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`
- `Card` with `appearance="glassDark"` for dark glass cards
- `Text` with various tones and weights
- `Button` with variants
- `TokenIcon` for crypto icons

### Styling Patterns
- Amber/gold accent color: `text-amber-500`, `bg-amber-500`
- Glass dark cards: `bg-white/5 border border-white/10`
- Gradient accents: `from-amber-500 to-purple-500`

### State Management
- Preview calculations already supported via `LoanCalculationsProvider`
- Token prices available via `TokenPriceProvider`
- Wallet balances via `WalletBalanceContext`
