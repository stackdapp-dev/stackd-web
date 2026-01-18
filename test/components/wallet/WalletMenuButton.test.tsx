/**
 * @vitest-environment jsdom
 */
/**
 * WalletMenuButton Component Tests
 * TDD tests for the menu button on Wallet page header
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
    })),
}));

describe('WalletMenuButton Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    describe('Button Display', () => {
        it('should render menu button with three dots icon', async () => {
            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(<WalletMenuButton />);

            const button = screen.getByRole('button', { name: /menu/i });
            expect(button).toBeInTheDocument();
            expect(screen.getByTestId('menu-dots-icon')).toBeInTheDocument();
        });

        it('should have accessible name', async () => {
            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(<WalletMenuButton />);

            expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
        });
    });

    describe('Menu Dropdown', () => {
        it('should open menu on click', async () => {
            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(<WalletMenuButton />);

            const button = screen.getByRole('button', { name: /menu/i });
            await userEvent.click(button);

            expect(screen.getByTestId('menu-dropdown')).toBeInTheDocument();
        });

        it('should display menu items', async () => {
            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(<WalletMenuButton />);

            const button = screen.getByRole('button', { name: /menu/i });
            await userEvent.click(button);

            expect(screen.getByText('Withdraw')).toBeInTheDocument();
            expect(screen.getByText('Profile')).toBeInTheDocument();
            expect(screen.getByText('Settings')).toBeInTheDocument();
        });

        it('should close menu when clicking outside', async () => {
            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(
                <div>
                    <WalletMenuButton />
                    <div data-testid="outside">Outside</div>
                </div>
            );

            const button = screen.getByRole('button', { name: /menu/i });
            await userEvent.click(button);
            expect(screen.getByTestId('menu-dropdown')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('outside'));
            expect(screen.queryByTestId('menu-dropdown')).not.toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate to withdraw on Withdraw click', async () => {
            const { useRouter } = await import('next/navigation');
            const pushMock = vi.fn();
            (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: pushMock });

            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(<WalletMenuButton />);

            const button = screen.getByRole('button', { name: /menu/i });
            await userEvent.click(button);
            await userEvent.click(screen.getByText('Withdraw'));

            expect(pushMock).toHaveBeenCalledWith('/withdraw');
        });

        it('should navigate to profile on Profile click', async () => {
            const { useRouter } = await import('next/navigation');
            const pushMock = vi.fn();
            (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: pushMock });

            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            render(<WalletMenuButton />);

            const button = screen.getByRole('button', { name: /menu/i });
            await userEvent.click(button);
            await userEvent.click(screen.getByText('Profile'));

            expect(pushMock).toHaveBeenCalledWith('/profile');
        });
    });

    describe('Styling', () => {
        it('should have circular background', async () => {
            const { WalletMenuButton } = await import('@/components/wallet/WalletMenuButton');
            const { container } = render(<WalletMenuButton />);

            const button = container.querySelector('button');
            expect(button).toHaveClass('rounded-full');
        });
    });
});
