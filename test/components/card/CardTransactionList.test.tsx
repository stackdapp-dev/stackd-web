/**
 * @vitest-environment jsdom
 */
/**
 * CardTransactionList Component Tests
 * TDD tests for transaction list display
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockTransactions, emptyTransactions } from '../../mocks/card';

describe('CardTransactionList Component', () => {
    describe('List Display', () => {
        it('should display "Recent transactions" header', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            expect(screen.getByText('Recent transactions')).toBeInTheDocument();
        });

        it('should display all transactions', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            expect(screen.getByText('SMART APP')).toBeInTheDocument();
            expect(screen.getByText('SPOTTED PIG CAFE')).toBeInTheDocument();
            expect(screen.getByText('Shangrila Canton Road')).toBeInTheDocument();
            expect(screen.getByText('Spotted Pig Proscenium')).toBeInTheDocument();
        });

        it('should display transaction amounts', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            expect(screen.getByText('-$34.48')).toBeInTheDocument();
            // Multiple transactions have -$4.12
            expect(screen.getAllByText('-$4.12').length).toBeGreaterThanOrEqual(1);
        });

        it('should display merchant categories', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            expect(screen.getByText('Telecommunication Services')).toBeInTheDocument();
            // Multiple transactions have 'Eating Places, Restaurants'
            expect(screen.getAllByText('Eating Places, Restaurants').length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Transaction Items', () => {
        it('should display merchant icons', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            const icons = screen.getAllByTestId(/merchant-icon/);
            expect(icons.length).toBeGreaterThan(0);
        });

        it('should display cashback amounts when present', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            // Should show cashback badges with amounts
            expect(screen.getByText('34.48')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should display empty state when no transactions', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={emptyTransactions} />);

            expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
        });
    });

    describe('View All Button', () => {
        it('should display "View all transactions" button', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} />);

            expect(screen.getByRole('button', { name: /view all transactions/i })).toBeInTheDocument();
        });

        it('should call onViewAll when button is clicked', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            const onViewAll = vi.fn();
            render(<CardTransactionList transactions={mockTransactions} onViewAll={onViewAll} />);

            await userEvent.click(screen.getByRole('button', { name: /view all transactions/i }));
            expect(onViewAll).toHaveBeenCalledTimes(1);
        });

        it('should hide View all button when showViewAll is false', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={mockTransactions} showViewAll={false} />);

            expect(screen.queryByRole('button', { name: /view all transactions/i })).not.toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('should display skeleton loaders when loading', async () => {
            const { CardTransactionList } = await import('@/components/card/CardTransactionList');
            render(<CardTransactionList transactions={[]} isLoading />);

            expect(screen.getByTestId('transactions-loading')).toBeInTheDocument();
        });
    });
});
