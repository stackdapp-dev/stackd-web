/**
 * @vitest-environment jsdom
 */
/**
 * CardQuickActions Component Tests
 * TDD tests for card action buttons
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('CardQuickActions Component', () => {
    describe('Action Buttons Display', () => {
        it('should display all four action buttons', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            render(<CardQuickActions />);

            expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /card pin/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /lock/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /change limit/i })).toBeInTheDocument();
        });

        it('should display icons for each action', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            render(<CardQuickActions />);

            expect(screen.getByTestId('icon-show-details')).toBeInTheDocument();
            expect(screen.getByTestId('icon-card-pin')).toBeInTheDocument();
            expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
            expect(screen.getByTestId('icon-change-limit')).toBeInTheDocument();
        });
    });

    describe('Action Callbacks', () => {
        it('should call onShowDetails when Show details is clicked', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            const onShowDetails = vi.fn();
            render(<CardQuickActions onShowDetails={onShowDetails} />);

            await userEvent.click(screen.getByRole('button', { name: /show details/i }));
            expect(onShowDetails).toHaveBeenCalledTimes(1);
        });

        it('should call onCardPin when Card PIN is clicked', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            const onCardPin = vi.fn();
            render(<CardQuickActions onCardPin={onCardPin} />);

            await userEvent.click(screen.getByRole('button', { name: /card pin/i }));
            expect(onCardPin).toHaveBeenCalledTimes(1);
        });

        it('should call onLock when Lock is clicked', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            const onLock = vi.fn();
            render(<CardQuickActions onLock={onLock} />);

            await userEvent.click(screen.getByRole('button', { name: /lock/i }));
            expect(onLock).toHaveBeenCalledTimes(1);
        });

        it('should call onChangeLimit when Change limit is clicked', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            const onChangeLimit = vi.fn();
            render(<CardQuickActions onChangeLimit={onChangeLimit} />);

            await userEvent.click(screen.getByRole('button', { name: /change limit/i }));
            expect(onChangeLimit).toHaveBeenCalledTimes(1);
        });
    });

    describe('Disabled States', () => {
        it('should disable all actions when card is locked', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            render(<CardQuickActions isCardLocked actionsDisabled />);

            const buttons = screen.getAllByRole('button');
            // Lock button should still be enabled to unlock
            const lockButton = screen.getByRole('button', { name: /unlock/i });
            expect(lockButton).not.toBeDisabled();

            // Other buttons should be disabled
            const showDetails = screen.getByRole('button', { name: /show details/i });
            expect(showDetails).toBeDisabled();
        });

        it('should show "Unlock" text when card is locked', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            render(<CardQuickActions isCardLocked />);

            expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
        });
    });

    describe('Loading States', () => {
        it('should show loading spinner when action is in progress', async () => {
            const { CardQuickActions } = await import('@/components/card/CardQuickActions');
            render(<CardQuickActions isLocking />);

            expect(screen.getByTestId('lock-loading')).toBeInTheDocument();
        });
    });
});
