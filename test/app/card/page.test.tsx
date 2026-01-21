/**
 * @vitest-environment jsdom
 */
/**
 * Card Page Tests
 * TDD tests for Issue #4: Card Page Background Inconsistency
 *
 * The Card page should NOT have custom background classes since the body
 * already has the correct gradient defined in globals.css.
 * This prevents color mismatch during scroll/pull-to-refresh.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock the card components to simplify testing
vi.mock('@/components/card', () => ({
    VisaCard: () => <div data-testid="visa-card">VisaCard</div>,
    CardQuickActions: () => <div data-testid="card-quick-actions">CardQuickActions</div>,
    CardBalance: () => <div data-testid="card-balance">CardBalance</div>,
    CardTransactionList: () => <div data-testid="card-transaction-list">CardTransactionList</div>,
    AddToWalletButton: () => <div data-testid="add-to-wallet">AddToWalletButton</div>,
}));

vi.mock('@/components/ui/BetaBadge', () => ({
    default: () => <div data-testid="beta-badge">BetaBadge</div>,
}));

describe('CardPage', () => {
    describe('Background Consistency (Issue #4)', () => {
        it('should NOT have bg-gradient-to-b class on container', async () => {
            const CardPage = (await import('@/app/(main)/card/page')).default;
            const { container } = render(<CardPage />);

            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).not.toHaveClass('bg-gradient-to-b');
        });

        it('should NOT have from-gray-900 class on container', async () => {
            const CardPage = (await import('@/app/(main)/card/page')).default;
            const { container } = render(<CardPage />);

            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).not.toHaveClass('from-gray-900');
        });

        it('should NOT have to-black class on container', async () => {
            const CardPage = (await import('@/app/(main)/card/page')).default;
            const { container } = render(<CardPage />);

            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).not.toHaveClass('to-black');
        });
    });

    describe('Essential Layout Classes', () => {
        it('should have min-h-screen class for full viewport height', async () => {
            const CardPage = (await import('@/app/(main)/card/page')).default;
            const { container } = render(<CardPage />);

            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).toHaveClass('min-h-screen');
        });

        it('should have pb-24 class for bottom padding (nav clearance)', async () => {
            const CardPage = (await import('@/app/(main)/card/page')).default;
            const { container } = render(<CardPage />);

            const mainContainer = container.firstChild as HTMLElement;
            expect(mainContainer).toHaveClass('pb-24');
        });
    });
});
