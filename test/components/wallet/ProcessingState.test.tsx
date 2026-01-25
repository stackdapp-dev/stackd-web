/**
 * @vitest-environment jsdom
 */
/**
 * ProcessingState Component Tests
 * TDD tests for the wallet transaction processing state component
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

describe('ProcessingState Component', () => {
    beforeEach(() => {
        cleanup();
    });

    describe('Default Messages', () => {
        it('should display correct default message for processing state', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            render(<ProcessingState state="processing" />);

            expect(screen.getByText('Please confirm the transaction in your wallet.')).toBeInTheDocument();
        });

        it('should display correct default message for approving state', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            render(<ProcessingState state="approving" />);

            expect(screen.getByText('Please approve token spending in your wallet.')).toBeInTheDocument();
        });

        it('should display correct default message for confirming state', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            render(<ProcessingState state="confirming" />);

            expect(screen.getByText('Waiting for blockchain confirmation...')).toBeInTheDocument();
        });
    });

    describe('Custom Message', () => {
        it('should display custom message when provided', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            const customMessage = 'Custom processing message';
            render(<ProcessingState state="processing" message={customMessage} />);

            expect(screen.getByText(customMessage)).toBeInTheDocument();
            expect(screen.queryByText('Please confirm the transaction in your wallet.')).not.toBeInTheDocument();
        });

        it('should use custom message for approving state', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            const customMessage = 'Approving your tokens...';
            render(<ProcessingState state="approving" message={customMessage} />);

            expect(screen.getByText(customMessage)).toBeInTheDocument();
            expect(screen.queryByText('Please approve token spending in your wallet.')).not.toBeInTheDocument();
        });

        it('should use custom message for confirming state', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            const customMessage = 'Almost done...';
            render(<ProcessingState state="confirming" message={customMessage} />);

            expect(screen.getByText(customMessage)).toBeInTheDocument();
            expect(screen.queryByText('Waiting for blockchain confirmation...')).not.toBeInTheDocument();
        });
    });

    describe('Loading Component', () => {
        it('should render the Loading component', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            render(<ProcessingState state="processing" />);

            // Loading component renders a LoaderCircle with animate-spin
            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should have animate-pulse class on container', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            const { container } = render(<ProcessingState state="processing" />);

            const containerDiv = container.firstChild;
            expect(containerDiv).toHaveClass('animate-pulse');
        });

        it('should have flex column layout with centered items', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            const { container } = render(<ProcessingState state="processing" />);

            const containerDiv = container.firstChild;
            expect(containerDiv).toHaveClass('flex');
            expect(containerDiv).toHaveClass('flex-col');
            expect(containerDiv).toHaveClass('items-center');
        });

        it('should have gap-4 spacing between elements', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            const { container } = render(<ProcessingState state="processing" />);

            const containerDiv = container.firstChild;
            expect(containerDiv).toHaveClass('gap-4');
        });

        it('should have centered text with muted color', async () => {
            const { ProcessingState } = await import('@/components/wallet/ProcessingState');
            render(<ProcessingState state="processing" />);

            const textElement = screen.getByText('Please confirm the transaction in your wallet.');
            expect(textElement).toHaveClass('text-center');
            expect(textElement).toHaveClass('text-white/60');
        });
    });
});
