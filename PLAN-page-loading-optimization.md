# Page Loading Optimization Plan

## Current State Analysis

### Architecture Overview
- **Framework**: Next.js 15.5.9 with App Router, React 19, Turbopack
- **Navigation**: Custom `useRouter` navigation, minimal use of Next.js `<Link>`
- **Data Fetching**: Client-side with manual caching (30-60s TTL)
- **PWA**: Serwist service worker for offline support

### Identified Performance Bottlenecks

#### 1. iOS PWA Full Page Reloads (Critical)
**Location**: `src/components/ui/bottomNav.tsx:54-56`
```typescript
// Current: Forces full page reload on iOS
window.location.href = href;
```
- Every navigation in iOS PWA mode triggers a **full page reload**
- All providers re-initialize, all data re-fetches
- This is the #1 cause of slow navigation on iOS

#### 2. No Route Prefetching
- Navigation uses `router.push()` instead of `<Link>` components
- Next.js `<Link>` auto-prefetches routes on hover/viewport entry
- Currently: Routes only load **after** user clicks

#### 3. Sequential Data Loading
- Page mounts → Provider initializes → Data fetches → UI renders
- No parallel data loading or prefetching
- Each page waits for its data independently

#### 4. Heavy Provider Re-initialization
**Provider hierarchy** (`src/providers/providers.tsx`):
```
PrivyProvider → TokenPriceProvider → Web3Provider → UserProvider
  └→ WalletBalanceProvider → LoanCalculationsProvider
```
- On navigation, providers may re-validate/re-fetch unnecessarily
- No shared cache between page transitions

#### 5. No Code Splitting
- All components imported directly (no `dynamic()` imports)
- Larger initial bundles than necessary

---

## Proposed Solutions

### Solution 1: Fix iOS PWA Navigation (High Impact, Low Effort)

**Problem**: `window.location.href` causes full page reloads in PWA mode.

**Solution**: Use Next.js router for all navigation, fix the underlying PWA issue differently.

The current workaround was likely added because `router.push()` was opening Safari. The proper fix is to ensure the PWA manifest and navigation interceptor handle this correctly without forcing reloads.

**Changes**:
1. Remove `window.location.href` usage in `bottomNav.tsx`
2. Enhance `PWANavigationInterceptor.tsx` to properly handle all internal navigation
3. Use `router.push()` universally with proper PWA handling

**Files to modify**:
- `src/components/ui/bottomNav.tsx`
- `src/components/common/PWANavigationInterceptor.tsx`

---

### Solution 2: Implement Route Prefetching (High Impact, Medium Effort)

**Option A: Link-based Prefetching**
Replace button navigation with `<Link>` components that auto-prefetch:
```tsx
<Link href="/wallet" prefetch={true}>
  <button>Wallet</button>
</Link>
```

**Option B: Manual Prefetching on Mount**
Prefetch likely next routes when current page loads:
```tsx
// In wallet page
useEffect(() => {
  router.prefetch('/wallet/loan');
  router.prefetch('/history');
  router.prefetch('/wallet/tx/borrow');
}, []);
```

**Option C: Prefetch on Hover/Focus**
Add prefetching to navigation buttons on hover:
```tsx
<button
  onMouseEnter={() => router.prefetch(href)}
  onClick={() => router.push(href)}
>
```

**Recommendation**: Combine A + B for maximum coverage.

**Files to modify**:
- `src/components/ui/bottomNav.tsx`
- `src/components/common/PageHeader.tsx`
- Individual page components for contextual prefetching

---

### Solution 3: Data Prefetching Strategy (High Impact, High Effort)

**Approach**: Prefetch data for likely next pages during idle time.

#### 3A: Homepage Data Preloading
On initial app load (homepage/wallet), prefetch data for common next pages:

```tsx
// In wallet page or root layout
useEffect(() => {
  // Prefetch transaction history data
  prefetchTransactionHistory(walletAddress);

  // Prefetch referral data
  prefetchReferralStats(userId);
}, [walletAddress, userId]);
```

#### 3B: Implement React Query / TanStack Query
Replace manual caching with TanStack Query for:
- Automatic cache sharing across pages
- Background refetching
- Stale-while-revalidate pattern
- Request deduplication

**Benefits**:
- Navigate to `/history` → shows cached data immediately → refetches in background
- Shared cache between provider and page-level queries
- Automatic garbage collection

**Files to modify**:
- `src/providers/providers.tsx` (add QueryClientProvider)
- `src/hooks/useWalletBalance.ts`
- `src/hooks/useTransactionHistory.ts`
- `src/hooks/useCompound.ts`
- All data-fetching hooks

---

### Solution 4: Service Worker Route Caching (Medium Impact, Medium Effort)

Enhance the existing Serwist service worker to cache page assets:

```typescript
// src/app/sw.ts
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 20 })]
  })
);
```

**Benefits**:
- Subsequent visits to same page load from cache
- Background updates ensure fresh content
- Works offline

**Files to modify**:
- `src/app/sw.ts`

---

### Solution 5: Code Splitting with Dynamic Imports (Medium Impact, Low Effort)

Split heavy components that aren't needed immediately:

```tsx
const LoanCalculator = dynamic(
  () => import('@/components/LoanCalculator'),
  { loading: () => <Skeleton /> }
);
```

**Candidates for splitting**:
- Modal components (only needed on interaction)
- Chart/graph components
- QR code generators
- Complex form components

**Files to analyze**:
- Components in `src/components/` over 10KB
- Components only used in specific routes

---

### Solution 6: Resource Hints (Low Impact, Very Low Effort)

Add preconnect/DNS prefetch for external APIs:

```tsx
// In layout.tsx <head>
<link rel="preconnect" href="https://api.coingecko.com" />
<link rel="preconnect" href="https://api.arbiscan.io" />
<link rel="dns-prefetch" href="https://api.coingecko.com" />
```

**Files to modify**:
- `src/app/layout.tsx`

---

### Solution 7: Optimistic UI Updates (Medium Impact, Medium Effort)

Show UI immediately with cached/predicted data, update when fresh data arrives:

```tsx
// Example: Show cached balance immediately
const { data: balance, isStale } = useWalletBalance();

return (
  <div className={isStale ? 'opacity-80' : ''}>
    ${balance}
    {isStale && <RefreshIndicator />}
  </div>
);
```

---

## Implementation Priority

| Priority | Solution | Impact | Effort | Description |
|----------|----------|--------|--------|-------------|
| 1 | Fix iOS PWA Navigation | Very High | Low | Remove `window.location.href` |
| 2 | Route Prefetching | High | Low | Add `<Link>` prefetch + manual prefetch |
| 3 | Resource Hints | Low | Very Low | Add preconnect headers |
| 4 | Data Prefetching | High | Medium | Prefetch likely next-page data on homepage |
| 5 | TanStack Query Migration | Very High | High | Shared cache, SWR pattern |
| 6 | Service Worker Caching | Medium | Medium | Cache page assets |
| 7 | Code Splitting | Medium | Low | Dynamic imports for heavy components |
| 8 | Optimistic UI | Medium | Medium | Show stale data immediately |

---

## Quick Wins (Can Implement Today)

1. **Fix iOS navigation** - Remove `window.location.href` in bottomNav
2. **Add resource hints** - Preconnect to external APIs
3. **Add route prefetching** - Prefetch main routes on app load
4. **Prefetch on hover** - Add `onMouseEnter` prefetch to nav buttons

---

## Long-term Improvements

1. **Migrate to TanStack Query** - Most impactful for data caching
2. **Implement proper SSR** - Server-side data fetching where possible
3. **Add bundle analyzer** - Identify optimization opportunities
4. **Streaming SSR** - For pages with heavy data requirements

---

## Metrics to Track

- Time to Interactive (TTI) per page
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Navigation timing between pages
- Cache hit rates

---

## Questions for Discussion

1. Should we prioritize iOS PWA users or all platforms equally?
2. Is the complexity of TanStack Query migration justified?
3. Are there specific pages that feel slowest and should be prioritized?
4. Should we consider Server Components for any pages?
