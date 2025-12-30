/**
 * TDD Tests for PnLCarousel Component
 *
 * The PnLCarousel is a swipeable carousel that displays PnL data across 3 cards:
 * 1. Total PnL Overview
 * 2. PnL by Asset
 * 3. PnL by Source
 *
 * Uses Framer Motion for swipe gestures and animations.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the components that PnLCarousel will render
vi.mock("@/components/wallet/pnl/PnLOverviewCard", () => ({
    PnLOverviewCard: () => <div data-testid="pnl-overview-card">Total PnL Card</div>,
}));

vi.mock("@/components/wallet/pnl/PnLByAssetCard", () => ({
    PnLByAssetCard: () => <div data-testid="pnl-by-asset-card">PnL by Asset Card</div>,
}));

vi.mock("@/components/wallet/pnl/PnLBySourceCard", () => ({
    PnLBySourceCard: () => <div data-testid="pnl-by-source-card">PnL by Source Card</div>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useDragControls: () => ({}),
}));

// The component doesn't exist yet - this is TDD
// Tests will fail until implementation is complete
describe("PnLCarousel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Rendering", () => {
        it("should render carousel with 3 cards", async () => {
            // Import will fail until component is created
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            // All 3 card types should be present in the carousel
            expect(screen.getByTestId("pnl-overview-card")).toBeInTheDocument();
            expect(screen.getByTestId("pnl-by-asset-card")).toBeInTheDocument();
            expect(screen.getByTestId("pnl-by-source-card")).toBeInTheDocument();
        });

        it("should show Total PnL card first (index 0)", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            // The Total PnL card should be visible/active first
            const carouselContainer = screen.getByTestId("pnl-carousel");
            expect(carouselContainer).toHaveAttribute("data-active-index", "0");

            // Or check that Total PnL card is visible
            const overviewCard = screen.getByTestId("pnl-overview-card");
            expect(overviewCard).toBeVisible();
        });

        it("should show navigation dots", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            // Should have 3 navigation dots
            const dots = screen.getAllByTestId("carousel-dot");
            expect(dots).toHaveLength(3);
        });

        it("should highlight current card dot", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            const dots = screen.getAllByTestId("carousel-dot");

            // First dot should be active (highlighted)
            expect(dots[0]).toHaveClass("bg-amber-500");
            // Other dots should be inactive
            expect(dots[1]).toHaveClass("bg-white/30");
            expect(dots[2]).toHaveClass("bg-white/30");
        });
    });

    describe("Navigation", () => {
        it("should navigate to PnL by Asset on next swipe/click", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const user = userEvent.setup();

            render(<PnLCarousel />);

            // Click next button or swipe left
            const nextButton = screen.getByTestId("carousel-next");
            await user.click(nextButton);

            // Should now be on index 1 (PnL by Asset)
            const carouselContainer = screen.getByTestId("pnl-carousel");
            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "1");
            });

            // Second dot should now be highlighted
            const dots = screen.getAllByTestId("carousel-dot");
            expect(dots[1]).toHaveClass("bg-amber-500");
        });

        it("should navigate to PnL by Source on second swipe", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const user = userEvent.setup();

            render(<PnLCarousel />);

            const nextButton = screen.getByTestId("carousel-next");

            // Navigate twice: Total -> Asset -> Source
            await user.click(nextButton);
            await user.click(nextButton);

            const carouselContainer = screen.getByTestId("pnl-carousel");
            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "2");
            });

            // Third dot should be highlighted
            const dots = screen.getAllByTestId("carousel-dot");
            expect(dots[2]).toHaveClass("bg-amber-500");
        });

        it("should navigate backwards with previous button", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const user = userEvent.setup();

            render(<PnLCarousel />);

            const nextButton = screen.getByTestId("carousel-next");
            const prevButton = screen.getByTestId("carousel-prev");

            // Go forward then back
            await user.click(nextButton);
            await user.click(prevButton);

            const carouselContainer = screen.getByTestId("pnl-carousel");
            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "0");
            });
        });

        it("should navigate to specific card when clicking dot", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const user = userEvent.setup();

            render(<PnLCarousel />);

            const dots = screen.getAllByTestId("carousel-dot");

            // Click on third dot directly
            await user.click(dots[2]);

            const carouselContainer = screen.getByTestId("pnl-carousel");
            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "2");
            });
        });

        it("should wrap around from last to first card", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const user = userEvent.setup();

            render(<PnLCarousel />);

            const nextButton = screen.getByTestId("carousel-next");

            // Navigate to end and beyond
            await user.click(nextButton); // 0 -> 1
            await user.click(nextButton); // 1 -> 2
            await user.click(nextButton); // 2 -> 0 (wrap)

            const carouselContainer = screen.getByTestId("pnl-carousel");
            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "0");
            });
        });
    });

    describe("Swipe Gestures", () => {
        it("should respond to left swipe gesture", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            const carouselContainer = screen.getByTestId("pnl-carousel");

            // Simulate drag/swipe gesture
            fireEvent.mouseDown(carouselContainer, { clientX: 300 });
            fireEvent.mouseMove(carouselContainer, { clientX: 100 }); // Swipe left
            fireEvent.mouseUp(carouselContainer);

            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "1");
            });
        });

        it("should respond to right swipe gesture", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const user = userEvent.setup();

            render(<PnLCarousel />);

            // First go to index 1
            const nextButton = screen.getByTestId("carousel-next");
            await user.click(nextButton);

            const carouselContainer = screen.getByTestId("pnl-carousel");

            // Swipe right to go back
            fireEvent.mouseDown(carouselContainer, { clientX: 100 });
            fireEvent.mouseMove(carouselContainer, { clientX: 300 }); // Swipe right
            fireEvent.mouseUp(carouselContainer);

            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "0");
            });
        });

        it("should ignore small swipe movements", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            const carouselContainer = screen.getByTestId("pnl-carousel");

            // Small movement should not trigger navigation
            fireEvent.mouseDown(carouselContainer, { clientX: 200 });
            fireEvent.mouseMove(carouselContainer, { clientX: 180 }); // Only 20px
            fireEvent.mouseUp(carouselContainer);

            // Should stay at index 0
            expect(carouselContainer).toHaveAttribute("data-active-index", "0");
        });
    });

    describe("Accessibility", () => {
        it("should have proper ARIA labels", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            const carouselContainer = screen.getByTestId("pnl-carousel");
            expect(carouselContainer).toHaveAttribute("aria-label", "PnL breakdown carousel");
            expect(carouselContainer).toHaveAttribute("role", "region");
        });

        it("should announce current slide to screen readers", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            // Should have aria-live region for announcements
            const liveRegion = screen.getByRole("status");
            expect(liveRegion).toHaveTextContent(/slide 1 of 3/i);
        });

        it("should support keyboard navigation", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel />);

            const carouselContainer = screen.getByTestId("pnl-carousel");
            carouselContainer.focus();

            // Arrow right should go to next
            fireEvent.keyDown(carouselContainer, { key: "ArrowRight" });

            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "1");
            });

            // Arrow left should go back
            fireEvent.keyDown(carouselContainer, { key: "ArrowLeft" });

            await waitFor(() => {
                expect(carouselContainer).toHaveAttribute("data-active-index", "0");
            });
        });
    });

    describe("Props", () => {
        it("should accept initialIndex prop", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");

            render(<PnLCarousel initialIndex={2} />);

            const carouselContainer = screen.getByTestId("pnl-carousel");
            expect(carouselContainer).toHaveAttribute("data-active-index", "2");
        });

        it("should call onSlideChange callback when navigating", async () => {
            const { PnLCarousel } = await import("@/components/wallet/PnLCarousel");
            const onSlideChange = vi.fn();
            const user = userEvent.setup();

            render(<PnLCarousel onSlideChange={onSlideChange} />);

            const nextButton = screen.getByTestId("carousel-next");
            await user.click(nextButton);

            expect(onSlideChange).toHaveBeenCalledWith(1);
        });
    });
});
