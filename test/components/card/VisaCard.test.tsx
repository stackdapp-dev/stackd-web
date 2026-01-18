/**
 * @vitest-environment jsdom
 */
/**
 * VisaCard Component Tests
 * TDD tests for the virtual card visual component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCardDetails, mockLockedCard } from '../../mocks/card';

// Mock the card utilities
vi.mock('@/lib/card/cardUtils', () => ({
    maskCardNumber: vi.fn((lastFour: string) => `•• •• ${lastFour.split('').join(' ')}`),
}));

describe('VisaCard Component', () => {
    describe('Card Display', () => {
        it('should display STACK\'D logo', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            render(<VisaCard card={mockCardDetails} />);

            expect(screen.getByTestId('stackd-card-logo')).toBeInTheDocument();
        });

        it('should display masked card number', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            render(<VisaCard card={mockCardDetails} />);

            expect(screen.getByText(/•• •• 1 2 3 4/)).toBeInTheDocument();
        });

        it('should display VISA logo', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            render(<VisaCard card={mockCardDetails} />);

            expect(screen.getByTestId('visa-logo')).toBeInTheDocument();
        });

        it('should display EMV chip graphic', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            render(<VisaCard card={mockCardDetails} />);

            expect(screen.getByTestId('emv-chip')).toBeInTheDocument();
        });
    });

    describe('Card States', () => {
        it('should show "Coming Soon" badge when specified', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            render(<VisaCard card={mockCardDetails} showComingSoon />);

            expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        });

        it('should show locked state when card is locked', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            render(<VisaCard card={mockLockedCard} />);

            expect(screen.getByTestId('card-locked-indicator')).toBeInTheDocument();
        });

        it('should have reduced opacity when locked', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            const { container } = render(<VisaCard card={mockLockedCard} />);

            const cardElement = container.querySelector('[data-testid="visa-card"]');
            expect(cardElement).toHaveClass('opacity-60');
        });
    });

    describe('Card Reveal', () => {
        it('should show reveal button when onReveal is provided', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            const onReveal = vi.fn();
            render(<VisaCard card={mockCardDetails} onReveal={onReveal} />);

            const revealButton = screen.getByRole('button', { name: /show/i });
            expect(revealButton).toBeInTheDocument();
        });

        it('should call onReveal when reveal button is clicked', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            const onReveal = vi.fn();
            render(<VisaCard card={mockCardDetails} onReveal={onReveal} />);

            const revealButton = screen.getByRole('button', { name: /show/i });
            await userEvent.click(revealButton);

            expect(onReveal).toHaveBeenCalledTimes(1);
        });

        it('should display full card number when revealed', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            const revealedCard = {
                ...mockCardDetails,
                fullNumber: '4111111111111234',
            };
            render(<VisaCard card={revealedCard} isRevealed />);

            expect(screen.getByText(/4111.*1234/)).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should have dark gradient background', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            const { container } = render(<VisaCard card={mockCardDetails} />);

            const cardElement = container.querySelector('[data-testid="visa-card"]');
            expect(cardElement).toHaveClass('bg-gradient-to-br');
        });

        it('should have rounded corners', async () => {
            const { VisaCard } = await import('@/components/card/VisaCard');
            const { container } = render(<VisaCard card={mockCardDetails} />);

            const cardElement = container.querySelector('[data-testid="visa-card"]');
            expect(cardElement).toHaveClass('rounded-2xl');
        });
    });
});
