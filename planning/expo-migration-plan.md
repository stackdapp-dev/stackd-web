# Stack'd: Next.js to Expo Migration Plan

## Context

Stack'd is a Next.js 15.5.9 web3 financial app (BTC lending, swaps, wallet management) with PWA support. The goal is to convert it to an Expo project to ship iOS, Android native builds, and web/PWA from a single codebase using Expo Router.

**Current stack**: Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui (Radix UI), Privy auth, TanStack Query, Viem/Solana/SwapKit (web3), Vitest + Playwright (testing), Vercel deployment.

**Target stack**: Expo + Expo Router, React Native + Web, NativeWind v4, custom cross-platform UI components, Privy (web + expo SDK), same web3 stack, same testing with RN adaptations.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Backend** | Separate Vercel Serverless Functions | Minimal change, same hosting. Native app calls absolute URL via `EXPO_PUBLIC_API_BASE_URL` |
| **UI Components** | Custom NativeWind components (same CVA variant APIs) | Keeps existing component interfaces, avoids new library learning curve |
| **Styling** | NativeWind v4 | Direct Tailwind compatibility, works on web + native |
| **Auth (native)** | `@privy-io/expo` with platform-split providers | Official Expo SDK, platform-specific `.web.tsx`/`.native.tsx` files |
| **Animations** | `react-native-reanimated` + `moti` | Replaces Framer Motion (only 3 files affected) |
| **Storage** | Platform abstraction: localStorage (web) / expo-secure-store + AsyncStorage (native) | 11 files use localStorage/sessionStorage |
| **Navigation** | Expo Router (file-based, same as App Router) | Same mental model, supports route groups, dynamic routes, layouts |
| **Priority** | Web parity first, then native builds | Ensure no regression on web before shipping native |

---

## Token & Cost Estimates

| Task | Estimated Tokens | Recommended Model | Rationale |
|------|-----------------|-------------------|-----------|
| feat-1 (scaffold) | ~60-80K | **Sonnet 4.6** | Boilerplate config, dependency installation |
| feat-2 (API backend) | ~60-100K | **Sonnet 4.6** | Mechanical extraction of route handlers |
| feat-3 (platform abstraction) | ~40-70K | **Sonnet 4.6** | Pattern-based abstractions, new files |
| feat-4 (UI components) | ~100-150K | **Opus 4.6** | Complex cross-platform component APIs, Radix replacement |
| feat-5 (theming) | ~40-60K | **Sonnet 4.6** | Config + token mapping, mostly mechanical |
| feat-6 (providers) | ~60-90K | **Sonnet 4.6** | Mechanical storage swaps + Privy split |
| feat-7 (hooks) | ~40-60K | **Sonnet 4.6** | 7 hooks need changes, rest untouched |
| feat-8 (router structure) | ~50-80K | **Sonnet 4.6** | File scaffolding, route mapping |
| feat-9 (page migration) | ~200-300K | **Opus 4.6** | Largest task: 31 pages + 40+ components, needs careful judgment |
| feat-10 (test migration) | ~80-120K | **Sonnet 4.6** | Mechanical import/mock updates across 115 tests |
| **Total** | **~730K-1.1M** | **2 Opus + 8 Sonnet** | ~$25-45 estimated total cost |

**Opus 4.6 tasks (2)**: feat-4 and feat-9 - These require deep understanding of cross-platform nuances, complex component API preservation, and careful judgment calls.

**Sonnet 4.6 tasks (8)**: Everything else - These are more mechanical/pattern-based with clear instructions.

---

## Parallelization Groups

```
                    ┌── feat-1 (scaffold) ──── feat-5 (theming) ──── feat-4 (UI) ──┐
START ──────────────┤                                                                ├── feat-8 (routes) ── feat-9 (pages) ── feat-10 (tests)
                    ├── feat-2 (API backend) ────────────────────────────────────────┘
                    └── feat-3 (platform) ───── feat-6 (providers) ──────────────────┘
                                           └── feat-7 (hooks) ──────────────────────┘
```

| Phase | Tasks (parallel) | Blocked by |
|-------|-----------------|------------|
| **Phase 1** | feat-1, feat-2, feat-3 | Nothing (start immediately) |
| **Phase 2** | feat-5 | feat-1 |
| **Phase 3** | feat-4, feat-6, feat-7 | feat-5 (for feat-4), feat-3 (for feat-6/7) |
| **Phase 4** | feat-8 | feat-1, feat-4, feat-5, feat-6 |
| **Phase 5** | feat-9 | ALL previous |
| **Phase 6** | feat-10 | feat-9 |

---

## Task Breakdown

---

### feat-1-expo-scaffold | Sonnet 4.6

**Branch**: `claude/feat-1-expo-scaffold` from `develop`
**Worktree**: `worktrees/feat-1-expo-scaffold`

**Description**: Initialize Expo project with Expo Router, NativeWind v4, TypeScript, core deps, Metro config with crypto polyfills.

**Acceptance Criteria**:
- [ ] Expo runs on web (port 3000), iOS sim, Android emulator
- [ ] Expo Router file-based routing with placeholder index
- [ ] NativeWind v4 renders Tailwind classes on web + native
- [ ] TypeScript strict mode, `@/*` path alias
- [ ] Core deps: expo-router, nativewind, reanimated, gesture-handler, safe-area-context, expo-secure-store, async-storage, moti, cva, clsx, tailwind-merge, zod, tanstack-query, supabase-js, viem, lucide-react-native
- [ ] Metro bundler with crypto/Buffer polyfills for web3 libs
- [ ] `app.config.ts` with splash, icons, scheme "stackd", PWA web metadata
- [ ] Environment variables via `expo-constants`

**Test Cases**: cn() utility works, path aliases resolve, env vars accessible

**Key Files**: `app.config.ts`, `metro.config.js`, `babel.config.js`, `tailwind.config.ts`, `src/app/_layout.tsx`, `src/app/index.tsx`

**Depends on**: none | **Blocks**: feat-4, feat-5, feat-6, feat-7, feat-8, feat-9, feat-10

---

### feat-2-api-backend | Sonnet 4.6

**Branch**: `claude/feat-2-api-backend` from `develop`
**Worktree**: `worktrees/feat-2-api-backend`

**Description**: Extract 16 Next.js API routes into standalone `/api-server/` directory deployable as Vercel Serverless Functions. Create `src/lib/api/client.ts` abstraction that prepends `API_BASE_URL` on native.

**16 API Routes to extract**:
- `/api/0x` (gasless swap), `/api/btc/{deposit,quote,status/[id],withdraw}`, `/api/debug/fluid`, `/api/deposit-ath/seed`, `/api/referrals/{index,claim,join,leaderboard,validate}`, `/api/swap`, `/api/token-prices`, `/api/transactions`, `/api/velora`

**Acceptance Criteria**:
- [ ] All 16 routes in `/api-server/` with identical functionality
- [ ] `NextRequest`/`NextResponse` replaced with standard Web Request/Response
- [ ] `src/lib/api/client.ts` with configurable base URL (empty on web, absolute on native)
- [ ] Privy server auth extracted without Next.js deps
- [ ] `vercel.json` deployment config
- [ ] All existing API tests (`test/api/`) pass

**Depends on**: none | **Blocks**: feat-8, feat-9

---

### feat-3-platform-abstraction | Sonnet 4.6

**Branch**: `claude/feat-3-platform-abstraction` from `develop`
**Worktree**: `worktrees/feat-3-platform-abstraction`

**Description**: Platform abstraction layers for all Web APIs: storage (8 files), linking (3 files), clipboard, haptics, media queries, PWA utilities.

**Files to create in `src/lib/platform/`**:
- `storage.ts` (.web.ts / .native.ts) - localStorage/sessionStorage -> AsyncStorage/SecureStore
- `linking.ts` (.web.ts / .native.ts) - window.open -> expo-linking/expo-web-browser
- `clipboard.ts` - navigator.clipboard -> expo-clipboard
- `haptics.ts` (.web.ts / .native.ts) - navigator.vibrate -> expo-haptics
- `media-query.ts` - window.matchMedia -> useWindowDimensions
- `pwa.ts` - web-only service worker/install prompt utilities (no-op on native)

**Depends on**: none | **Blocks**: feat-6, feat-7, feat-8

---

### feat-4-ui-components | Opus 4.6

**Branch**: `claude/feat-4-ui-components` from `develop`
**Worktree**: `worktrees/feat-4-ui-components`

**Description**: Replace all 11 Radix UI / shadcn components + other DOM-dependent UI components with cross-platform equivalents using RN primitives + NativeWind. **Keep identical component APIs** (same props, same CVA variants).

**Radix replacements**:
| Current | Replacement |
|---------|-------------|
| Dialog (Radix) | RN Modal + Pressable overlay |
| Select (Radix) | Custom Modal + FlatList picker |
| Tabs (Radix) | useState + Pressable + View |
| Tooltip (Radix) | Web-only via Platform.select |
| Switch (Radix) | RN Switch + NativeWind |
| Checkbox (Radix) | Pressable + Check icon |
| Separator (Radix) | Styled View |
| Label (Radix) | Text component |
| Drawer (vaul) | @gorhom/bottom-sheet |
| Button Slot (Radix) | Direct Pressable |
| Card Slot (Radix) | Direct View |

**Also**: input -> TextInput, text -> RN Text, loading -> ActivityIndicator, next/image -> expo-image, lucide-react -> lucide-react-native, react-toastify -> react-native-toast-message

**26 files** in `src/components/ui/` to modify

**Depends on**: feat-1, feat-5 | **Blocks**: feat-8, feat-9

---

### feat-5-theming-globals | Sonnet 4.6

**Branch**: `claude/feat-5-theming-globals` from `develop`
**Worktree**: `worktrees/feat-5-theming-globals`

**Description**: Migrate CSS theming (globals.css variables, glass utilities, animations) to NativeWind theme config + cross-platform animation presets.

**Key work**:
- CSS custom properties -> `src/lib/theme/tokens.ts` JS constants + NativeWind theme
- Glass morphism -> GlassView component (backdrop-blur on web, expo-blur on native)
- Animations (shimmer, slide-up) -> `src/lib/theme/animations.ts` with Moti presets
- Safe area CSS env() -> `react-native-safe-area-context` useSafeAreaInsets
- Font (SF Pro Display) -> expo-font configuration
- tailwindcss-animate -> NativeWind/Reanimated alternatives

**Depends on**: feat-1 | **Blocks**: feat-4, feat-8, feat-9

---

### feat-6-providers | Sonnet 4.6

**Branch**: `claude/feat-6-providers` from `develop`
**Worktree**: `worktrees/feat-6-providers`

**Description**: Migrate 10 context providers. Split PrivyProvider into `.web.tsx`/`.native.tsx`. Replace localStorage with platform storage abstraction (async API). Conditionally render PWA components on web only.

**Providers**: providers.tsx (root), TokenPriceProvider, Web3Provider, UserProvider, DeveloperModeProvider, visibility, MultiLoanProvider, LoanCalculationsProvider, TransactionsProvider, WithrawOTCProvider

**Key changes**: Storage calls become async (useEffect init), PrivyProvider platform-split, PWA components wrapped in `Platform.OS === 'web'` check, TooltipProvider no-op on native

**Depends on**: feat-1, feat-3 | **Blocks**: feat-8, feat-9

---

### feat-7-hooks-migration | Sonnet 4.6

**Branch**: `claude/feat-7-hooks-migration` from `develop`
**Worktree**: `worktrees/feat-7-hooks-migration`

**Description**: Migrate 7 hooks that use Web APIs or Next.js APIs. 20 hooks need no changes (pure logic/TanStack Query/web3).

**Hooks needing changes**:
1. `useHapticFeedback` -> platform/haptics
2. `useInstallPrompt` -> web-only, no-op on native
3. `useMediaQuery` -> platform/media-query
4. `usePullToRefresh` -> RN gesture handler / RefreshControl
5. `useFullLogout` -> platform/storage + expo-router
6. `useReferralGate` -> platform/storage + expo-router useLocalSearchParams
7. `useTxMode` -> expo-router useRouter

**Depends on**: feat-3 | **Blocks**: feat-8, feat-9

---

### feat-8-expo-router-structure | Sonnet 4.6

**Branch**: `claude/feat-8-expo-router-structure` from `develop`
**Worktree**: `worktrees/feat-8-expo-router-structure`

**Description**: Create Expo Router file structure mirroring all 31 Next.js routes with placeholder pages. Set up layouts, route groups, dynamic routes, deep linking.

**Route mapping** (Next.js -> Expo Router):
- `page.tsx` -> `index.tsx`
- `layout.tsx` -> `_layout.tsx`
- `not-found.tsx` -> `+not-found.tsx`
- `(main)` group, `[param]` dynamic routes -> same syntax

**31 route files** + 5 layout files to create as placeholders

**Deep linking**: scheme "stackd://", universal links for web URLs

**Depends on**: feat-1, feat-4, feat-5, feat-6 | **Blocks**: feat-9

---

### feat-9-page-migration | Opus 4.6

**Branch**: `claude/feat-9-page-migration` from `develop`
**Worktree**: `worktrees/feat-9-page-migration`

**Description**: Migrate all 31 pages + 40+ feature components from Next.js to Expo. Replace all HTML elements with RN primitives, update all imports, fix all platform-specific code.

**Global replacements**:
- `next/image` -> `expo-image` (7 files)
- `next/link` -> `expo-router Link` (3 files)
- `next/navigation` -> `expo-router` (25+ files)
- `<div>` -> `<View>`, `<span>/<p>/<h*>` -> `<Text>`, `<button>` -> `<Pressable>`, `<input>` -> `<TextInput>`
- `onClick` -> `onPress`, `className` -> `className` (NativeWind)
- `window.open()` -> platform/linking
- `document.*` -> RN equivalents

**Special migrations**:
- QRScannerModal: html5-qrcode -> expo-camera barcode scanner
- QR display: qrcode.react -> react-native-qrcode-svg
- PageTransition: Framer Motion -> Moti
- Web-only components: wrap in `Platform.OS === 'web'`

**Component migration order**: common/ -> modules/auth/ -> wallet/ -> card/ -> btc/ -> referrals/ -> transactions/

**Depends on**: ALL previous tasks | **Blocks**: feat-10

---

### feat-10-test-migration | Sonnet 4.6

**Branch**: `claude/feat-10-test-migration` from `develop`
**Worktree**: `worktrees/feat-10-test-migration`

**Description**: Update 115 tests for Expo. Update Vitest config for Metro module resolution, update component test rendering, update E2E for Expo web, add native smoke tests with Maestro.

**Key changes**:
- Vitest: moduleNameMapper for react-native -> react-native-web, expo-router mocks
- Component tests: update renders for RN primitives, mock expo-router
- API tests: update imports if routes moved
- E2E (Playwright): update webServer command to `npx expo start --web`
- New: Maestro native smoke tests (app launch, login screen, navigation)
- CI: GitHub Actions for web tests + native EAS builds

**Coverage threshold**: Maintain 80% on statements/branches/functions/lines

**Depends on**: ALL previous | **Blocks**: none (final task)

---

## Post-Completion Merge Process

### Merge Branch
`claude/merge-branches-1-2-3-4-5-6-7-8-9-10` (from `develop`)

### Merge Order (minimizes conflicts)

| Step | Branch | Risk Level |
|------|--------|------------|
| 1 | feat-1-expo-scaffold | None (new files) |
| 2 | feat-3-platform-abstraction | None (new files) |
| 3 | feat-2-api-backend | Low (new dir + client abstraction) |
| 4 | feat-5-theming-globals | Low (new theme files + config) |
| 5 | feat-4-ui-components | Medium (replaces UI files) |
| 6 | feat-6-providers | Medium (modifies provider files) |
| 7 | feat-7-hooks-migration | Low (modifies 7 hook files) |
| 8 | feat-8-expo-router-structure | Low (new route files) |
| 9 | feat-9-page-migration | High (touches all pages + components) |
| 10 | feat-10-test-migration | Medium (modifies all test files) |

### Per-Step Protocol
1. Merge target branch
2. Resolve conflicts (prefer Expo/RN version for component conflicts, keep both for tests)
3. Run `npx vitest run` and `npx expo export --platform web`
4. If tests fail: **adjust logic to fit tests, NOT the other way around**. If test needs changing, STOP and ask for approval
5. After all merges: full test suite + build for web/iOS/Android + create PR to `develop`

---

## Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Web3 lib RN compatibility (viem, solana) | HIGH | Test in feat-1 scaffold with crypto polyfills; fallback to API proxy |
| SwapKit SDK Node.js deps | HIGH | May need to proxy through API routes instead of client-side |
| NativeWind v4 maturity | MEDIUM | Fallback to StyleSheet.create for problematic classes |
| Privy Expo SDK feature parity | MEDIUM | Verify email login + passkeys + embedded wallets work |
| Glassmorphism on native | LOW | expo-blur BlurView fallback; accept visual difference |
| Test coverage regression | MEDIUM | Check coverage at each merge step; never merge below 80% |

---

## Files to Remove After Migration
- `next.config.ts`, `next-env.d.ts`
- `postcss.config.mjs` (replaced by NativeWind PostCSS)
- `src/components/orig/` (legacy components)
- `src/app/page.orig.tsx` (legacy page)

## Verification Plan
1. **Web**: `npx expo start --web` on port 3000, run full Playwright E2E suite
2. **iOS**: `npx expo run:ios`, verify login + wallet + navigation
3. **Android**: `npx expo run:android`, verify same flows
4. **PWA**: Test install prompt, offline mode, service worker on web
5. **All tests**: `npx vitest run` passes with 80%+ coverage
