/**
 * @vitest-environment jsdom
 */
/**
 * CardBalance Component Tests
 * TDD tests for card balance display
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCardDetails, mockCardWithBalance } from '../../mocks/card';

describe('CardBalance Component', () => {
    describe('Balance Display', () => {
        it('should display "Card Balance" label', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            expect(screen.getByText('Card Balance')).toBeInTheDocument();
        });

        it('should display balance amount', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            expect(screen.getByText('$0')).toBeInTheDocument();
            expect(screen.getByText('.00')).toBeInTheDocument();
        });

        it('should display balance with formatting for larger amounts', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardWithBalance} />);

            expect(screen.getByText('$4,250')).toBeInTheDocument();
            expect(screen.getByText('.75')).toBeInTheDocument();
        });
    });

    describe('Limit Display', () => {
        it('should display limit text', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            expect(screen.getByText('LIMIT $10,000')).toBeInTheDocument();
        });

        it('should display progress bar', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            expect(screen.getByTestId('limit-progress-bar')).toBeInTheDocument();
        });

        it('should reflect usage percentage in progress bar', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            const { container } = render(<CardBalance card={mockCardWithBalance} />);

            const progressFill = container.querySelector('[data-testid="progress-fill"]');
            // 4250.75 / 10000 = 42.5%
            expect(progressFill).toHaveStyle({ width: '42.5075%' });
        });
    });

    describe('Settings Icon', () => {
        it('should display settings icon', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
        });

        it('should call onSettings when settings icon is clicked', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            const onSettings = vi.fn();
            render(<CardBalance card={mockCardDetails} onSettings={onSettings} />);

            await userEvent.click(screen.getByTestId('settings-icon'));
            expect(onSettings).toHaveBeenCalledTimes(1);
        });
    });

    describe('View Balances Button', () => {
        it('should display "View balances" button', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            expect(screen.getByRole('button', { name: /view balances/i })).toBeInTheDocument();
        });

        it('should toggle expanded state when clicked', async () => {
            const { CardBalance } = await import('@/components/card/CardBalance');
            render(<CardBalance card={mockCardDetails} />);

            const button = screen.getByRole('button', { name: /view balances/i });
            await userEvent.click(button);

            // Should show expanded content
            expect(screen.getByTestId('balances-expanded')).toBeInTheDocument();
        });
    });
});
