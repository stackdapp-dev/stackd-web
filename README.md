# Stack'd Web

A DeFi wallet application built with Next.js, Privy authentication, and Compound Finance integration on Arbitrum.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests (watch mode) |
| `pnpm test:coverage` | Unit tests with coverage |
| `pnpm test:e2e` | E2E tests with Playwright |
| `pnpm test:all` | Run all tests (CI-ready) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Authenticated routes
│   │   ├── wallet/        # Wallet dashboard
│   │   ├── history/       # Transaction history
│   │   ├── send/          # Send tokens
│   │   ├── convert/       # Token swaps
│   │   ├── deposit/       # Deposit funds
│   │   └── menu/          # Settings menu
│   └── api/               # API routes
│       ├── token-prices/  # CoinGecko price feed
│       └── transactions/  # Transaction history
├── components/            # Reusable UI components
│   ├── ui/               # Base components (Button, Skeleton, etc.)
│   └── wallet/           # Wallet-specific components
├── hooks/                # Custom React hooks
│   ├── useWalletBalance.ts
│   ├── useCompound.ts    # Compound Finance integration
│   └── useTokenTransfer.ts
├── lib/                  # Core library code (100% tested)
│   ├── utils.ts          # Formatting utilities
│   ├── web3/             # Blockchain interactions
│   │   ├── compound.ts   # Compound protocol
│   │   └── erc20.ts      # ERC20 token ops
│   └── config/           # Contract ABIs
└── providers/            # React context providers
    ├── Web3Provider.tsx  # Wallet + test mode
    ├── UserProvider.tsx  # User auth state
    └── TokenPriceProvider.tsx
```

## Testing

### Test Coverage
- **Unit Tests**: 70 tests, 100% coverage on `/src/lib`
- **E2E Tests**: 9 tests covering wallet, history, navigation

### Running Tests

```bash
# Unit tests (watch mode for development)
pnpm test

# Unit tests with coverage report
pnpm test:coverage

# E2E tests (requires pnpm dev running)
pnpm test:e2e

# All tests (CI-ready, no manual input)
pnpm test:all
```

### Test Mode for E2E

E2E tests use mock wallet authentication. The app checks for `window.__PRIVY_TEST_MODE__` and uses injected mock data for wallet addresses:

| Fixture | Address | Type |
|---------|---------|------|
| `externalWithLoan` | `0xfCDd6Dcc...` | External (MetaMask) |
| `embeddedNoLoan` | `0x45acE1fF...` | Embedded (Privy) |
| `embeddedWithLoan` | `0x5388B884...` | Embedded (Privy) |

## Key Technologies

- **Framework**: Next.js 15 with App Router
- **Authentication**: Privy (embedded + external wallets)
- **Blockchain**: Arbitrum One, viem
- **DeFi**: Compound Finance (lending/borrowing)
- **Testing**: Vitest + Playwright
- **Styling**: Tailwind CSS

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_SIGNER_ID=your_signer_id
```

## Links

- [Privy Dashboard](https://dashboard.privy.io)
- [Compound Docs](https://docs.compound.finance)
- [Arbitrum](https://arbiscan.io)
