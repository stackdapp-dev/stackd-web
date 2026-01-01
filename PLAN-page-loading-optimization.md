# Page Loading Optimization Plan

> **Updated**: Revised priorities based on feedback. iOS PWA deprioritized, no server-side changes, focus on navbar routing and TanStack Query.

## Current State Analysis

### Architecture Overview
- **Framework**: Next.js 15.5.9 with App Router, React 19, Turbopack
- **Navigation**: Custom `useRouter` navigation, minimal use of Next.js `<Link>`
- **Data Fetching**: Client-side with manual caching (30-60s TTL)
- **PWA**: Serwist service worker for offline support

### Identified Performance Bottlenecks

#### 1. No Route Prefetching (Primary Issue)
**Location**: `src/components/ui/bottomNav.tsx`
- Navigation uses `router.push()` instead of `<Link>` components
- Next.js `<Link>` auto-prefetches routes on hover/viewport entry
- Currently: Routes only load **after** user clicks
- **This is the main cause of slow navbar navigation**

#### 2. Sequential Data Loading
- Page mounts → Provider initializes → Data fetches → UI renders
- No parallel data loading or prefetching
- Each page waits for its data independently

#### 3. No Shared Cache Between Pages
**Provider hierarchy** (`src/providers/providers.tsx`):
```
PrivyProvider → TokenPriceProvider → Web3Provider → UserProvider
  └→ WalletBalanceProvider → LoanCalculationsProvider
```
- Manual caching per hook, no cross-page cache sharing
- Navigate away and back = refetch everything

#### 4. No Code Splitting
- All components imported directly (no `dynamic()` imports)
- Larger initial bundles than necessary

#### 5. iOS PWA Full Page Reloads (Deprioritized)
**Location**: `src/components/ui/bottomNav.tsx:54-56`
- Uses `window.location.href` for iOS PWA navigation
- Not a priority for now

---

## Implementation Plan

### Phase 1: Navbar Route Prefetching (High Impact, Low Effort)

**Goal**: Make navbar navigation feel instant by prefetching routes.

#### 1A: Convert to Next.js Link Components
Replace button navigation with `<Link>` for automatic prefetching:
```tsx
<Link href="/wallet" prefetch={true}>
  <NavButton />
</Link>
```

#### 1B: Prefetch All Main Routes on Mount
Prefetch navbar destinations when bottom nav mounts:
```tsx
useEffect(() => {
  router.prefetch('/wallet');
  router.prefetch('/history');
  router.prefetch('/referrals');
  router.prefetch('/menu');
}, []);
```

#### 1C: Prefetch on Hover/Touch
Add prefetching on pointer interaction for extra responsiveness:
```tsx
onMouseEnter={() => router.prefetch(href)}
onTouchStart={() => router.prefetch(href)}
```

**Files to modify**:
- `src/components/ui/bottomNav.tsx`

---

### Phase 2: Resource Hints (Low Effort, Quick Win)

Add preconnect for external APIs to reduce connection latency:

```tsx
// In layout.tsx metadata or head
<link rel="preconnect" href="https://api.coingecko.com" />
<link rel="preconnect" href="https://api.arbiscan.io" />
<link rel="dns-prefetch" href="https://api.coingecko.com" />
<link rel="dns-prefetch" href="https://api.arbiscan.io" />
```

**Files to modify**:
- `src/app/layout.tsx`

---

### Phase 3: Homepage Data Prefetching (Medium Effort)

Prefetch data for likely next pages during idle time on wallet page.

```tsx
// In wallet page
useEffect(() => {
  // Use requestIdleCallback for non-blocking prefetch
  requestIdleCallback(() => {
    prefetchTransactionHistory(walletAddress);
    prefetchReferralStats(userId);
  });
}, [walletAddress, userId]);
```

**Files to modify**:
- `src/app/(main)/wallet/page.tsx`
- Create prefetch utilities in `src/lib/prefetch.ts`

---

### Phase 4: TanStack Query Migration (High Impact, Medium-High Effort)

Replace manual caching with TanStack Query for:
- **Shared cache** — fetch once, use everywhere
- **Stale-while-revalidate** — show cached data instantly, refresh in background
- **Request deduplication** — multiple components = 1 request
- **Background refetching** — keeps data fresh without blocking UI

#### Expected Performance Improvement
- **50-70% reduction in perceived load time** for repeat page visits
- First visit: Same as now
- Subsequent visits: Near-instant (cached data shown immediately)

#### Migration Steps

1. **Install TanStack Query**
   ```bash
   npm install @tanstack/react-query
   ```

2. **Add QueryClientProvider** to providers
   ```tsx
   // src/providers/providers.tsx
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 30_000,      // 30s before considered stale
         gcTime: 5 * 60_000,     // 5min garbage collection
         refetchOnWindowFocus: false,
       },
     },
   });
   ```

3. **Migrate hooks** (in order of impact):
   - `useWalletBalance.ts` → highest impact
   - `useTransactionHistory.ts` → history page
   - `useCompound.ts` → loan data
   - `useTokenPrices` (via provider) → prices
   - `useReferral.ts` → referral data

4. **Example migration**:
   ```tsx
   // Before: Manual caching
   const [data, setData] = useState(null);
   useEffect(() => { fetch().then(setData); }, []);

   // After: TanStack Query
   const { data, isLoading, refetch } = useQuery({
     queryKey: ['walletBalance', address],
     queryFn: () => fetchWalletBalance(address),
     staleTime: 30_000,
   });
   ```

**Files to modify**:
- `package.json` (add dependency)
- `src/providers/providers.tsx`
- `src/hooks/useWalletBalance.ts`
- `src/hooks/useTransactionHistory.ts`
- `src/hooks/useCompound.ts`
- `src/providers/TokenPriceProvider.tsx`
- `src/hooks/useReferral.ts`

---

### Phase 5: Code Splitting (Medium Impact, Low Effort)

Split heavy components that aren't needed immediately:

```tsx
import dynamic from 'next/dynamic';

const QRCodeModal = dynamic(
  () => import('@/components/QRCodeModal'),
  { loading: () => <Skeleton /> }
);
```

**Candidates for splitting**:
- Modal components (only loaded on interaction)
- QR code generators
- Complex form components
- Chart/graph components (if any)

**Files to analyze**:
- Components in `src/components/` that are only used conditionally

---

## Final Implementation Priority

| Priority | Solution | Impact | Effort | Status |
|----------|----------|--------|--------|--------|
| 1 | **Navbar Route Prefetching** | High | Low | 🔲 To Do |
| 2 | **Resource Hints** | Low | Very Low | 🔲 To Do |
| 3 | **Homepage Data Prefetching** | High | Medium | 🔲 To Do |
| 4 | **TanStack Query Migration** | Very High | Medium-High | 🔲 To Do |
| 5 | **Code Splitting** | Medium | Low | 🔲 To Do |

---

## Out of Scope (Deprioritized)

- ~~iOS PWA navigation fix~~ — Not a priority
- ~~Server-side rendering (SSR)~~ — No server maintenance desired
- ~~Streaming SSR~~ — Requires server infrastructure

---

## Success Metrics

After implementation, measure:
- Navigation timing between navbar pages
- Time to Interactive (TTI) per page
- Cache hit rates (via TanStack Query DevTools)
- User-perceived load time improvements

---

## Notes

- All changes are client-side only (no server required)
- TanStack Query adds ~13KB gzipped to bundle
- Prefetching happens automatically with `<Link>` components
- Background refetching keeps data fresh without blocking UI
