/**
 * @vitest-environment jsdom
 * Unit tests for Modal component entry animations
 * TDD: Write tests FIRST, then implement
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/ui/modal";

describe("Modal Component", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        title: "Test Modal",
        message: "Test message content",
    };

    describe("Entry Animations", () => {
        /**
         * The backdrop should have a fade-in animation for smooth appearance.
         * Using tailwindcss-animate: animate-in fade-in-0 duration-300
         */
        it("should have fade-in animation on backdrop", () => {
            render(<Modal {...defaultProps} />);
            // The backdrop is the outer fixed container with data-testid="modal-backdrop"
            const backdrop = screen.getByTestId("modal-backdrop");
            expect(backdrop).toHaveClass("animate-in");
            expect(backdrop).toHaveClass("fade-in-0");
            expect(backdrop).toHaveClass("duration-300");
        });

        /**
         * The modal content should have zoom-in animation for smooth appearance.
         * Using tailwindcss-animate: animate-in fade-in-0 zoom-in-95 duration-300
         */
        it("should have zoom-in animation on modal content", () => {
            render(<Modal {...defaultProps} />);
            // The modal content has data-testid="modal-content"
            const modalContent = screen.getByTestId("modal-content");
            expect(modalContent).toHaveClass("animate-in");
            expect(modalContent).toHaveClass("fade-in-0");
            expect(modalContent).toHaveClass("zoom-in-95");
            expect(modalContent).toHaveClass("duration-300");
        });
    });

    describe("Rendering", () => {
        it("should render modal content correctly when open", () => {
            render(<Modal {...defaultProps} />);
            expect(screen.getByText("Test Modal")).toBeInTheDocument();
            expect(screen.getByText("Test message content")).toBeInTheDocument();
        });

        it("should not render when isOpen is false", () => {
            render(<Modal {...defaultProps} isOpen={false} />);
            expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
        });

        it("should render with icon when provided", () => {
            render(
                <Modal
                    {...defaultProps}
                    icon={<span data-testid="test-icon">Icon</span>}
                />
            );
            expect(screen.getByTestId("test-icon")).toBeInTheDocument();
        });

        it("should render primary and secondary buttons when provided", () => {
            render(
                <Modal
                    {...defaultProps}
                    primaryButtonText="Confirm"
                    secondaryButtonText="Cancel"
                />
            );
            expect(screen.getByText("Confirm")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });
    });

    describe("Close Button Functionality", () => {
        it("should have a close button by default", () => {
            render(<Modal {...defaultProps} />);
            const closeButton = screen.getByLabelText("Close");
            expect(closeButton).toBeInTheDocument();
        });

        it("should call onClose when close button is clicked", () => {
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} />);
            const closeButton = screen.getByLabelText("Close");
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should not render close button when showCloseButton is false", () => {
            render(<Modal {...defaultProps} showCloseButton={false} />);
            expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
        });
    });

    describe("Action Buttons", () => {
        it("should call primaryButtonAction when primary button is clicked", () => {
            const primaryAction = vi.fn();
            render(
                <Modal
                    {...defaultProps}
                    primaryButtonText="Confirm"
                    primaryButtonAction={primaryAction}
                />
            );
            fireEvent.click(screen.getByText("Confirm"));
            expect(primaryAction).toHaveBeenCalledTimes(1);
        });

        it("should call secondaryButtonAction when secondary button is clicked", () => {
            const secondaryAction = vi.fn();
            render(
                <Modal
                    {...defaultProps}
                    secondaryButtonText="Cancel"
                    secondaryButtonAction={secondaryAction}
                />
            );
            fireEvent.click(screen.getByText("Cancel"));
            expect(secondaryAction).toHaveBeenCalledTimes(1);
        });

        it("should not render action buttons when showActionButtons is false", () => {
            render(
                <Modal
                    {...defaultProps}
                    showActionButtons={false}
                    primaryButtonText="Confirm"
                    secondaryButtonText="Cancel"
                />
            );
            expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
        });
    });
});
