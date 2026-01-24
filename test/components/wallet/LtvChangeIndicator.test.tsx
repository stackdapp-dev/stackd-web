/**
 * @vitest-environment jsdom
 */

/**
 * Tests for LtvChangeIndicator Component
 *
 * The LtvChangeIndicator component displays:
 * - Current LTV percentage on the left
 * - Arrow icon in the middle
 * - New LTV percentage on the right (color-coded based on direction)
 * - Warning icon when approaching max LTV
 *
 * Color Logic:
 * - newLtv < currentLtv: text-emerald-400 (improvement - risk reducing)
 * - newLtv > currentLtv: text-amber-400 (worsening - risk increasing)
 * - equal: text-white/70 (no change)
 *
 * Warning State:
 * - Shows AlertTriangle icon when newLtv > maxLtv * 0.9
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LtvChangeIndicator from "@/components/wallet/LtvChangeIndicator";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    ArrowRight: () => <span data-testid="arrow-right-icon">→</span>,
    AlertTriangle: () => <span data-testid="alert-triangle-icon">⚠</span>,
}));

describe("LtvChangeIndicator Component", () => {
    describe("Display Format", () => {
        it("should display correct percentages formatted to 1 decimal place", () => {
            render(<LtvChangeIndicator currentLtv={29.4} newLtv={15.0} />);

            expect(screen.getByText("29.4%")).toBeInTheDocument();
            expect(screen.getByText("15.0%")).toBeInTheDocument();
        });

        it("should display arrow icon between current and new LTV", () => {
            render(<LtvChangeIndicator currentLtv={20} newLtv={30} />);

            expect(screen.getByTestId("arrow-right-icon")).toBeInTheDocument();
        });

        it("should format percentages with one decimal place even for whole numbers", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={25} />);

            expect(screen.getByText("50.0%")).toBeInTheDocument();
            expect(screen.getByText("25.0%")).toBeInTheDocument();
        });

        it("should round long decimals to 1 decimal place", () => {
            render(<LtvChangeIndicator currentLtv={33.333} newLtv={66.666} />);

            expect(screen.getByText("33.3%")).toBeInTheDocument();
            expect(screen.getByText("66.7%")).toBeInTheDocument();
        });
    });

    describe("Color Logic - LTV Improvement (decrease)", () => {
        it("should use emerald color for new LTV when LTV decreases (improvement)", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={30} />);

            const newLtvElement = screen.getByText("30.0%");
            expect(newLtvElement).toHaveClass("text-emerald-400");
        });

        it("should keep current LTV neutral when LTV improves", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={30} />);

            const currentLtvElement = screen.getByText("50.0%");
            expect(currentLtvElement).toHaveClass("text-white/60");
        });
    });

    describe("Color Logic - LTV Worsening (increase)", () => {
        it("should use amber color for new LTV when LTV increases (worsening)", () => {
            render(<LtvChangeIndicator currentLtv={30} newLtv={50} />);

            const newLtvElement = screen.getByText("50.0%");
            expect(newLtvElement).toHaveClass("text-amber-400");
        });

        it("should keep current LTV neutral when LTV worsens", () => {
            render(<LtvChangeIndicator currentLtv={30} newLtv={50} />);

            const currentLtvElement = screen.getByText("30.0%");
            expect(currentLtvElement).toHaveClass("text-white/60");
        });
    });

    describe("Color Logic - No Change", () => {
        it("should use neutral color when LTV is unchanged", () => {
            render(<LtvChangeIndicator currentLtv={40} newLtv={40} />);

            const newLtvElement = screen.getByText("40.0%");
            expect(newLtvElement).toHaveClass("text-white/70");
        });

        it("should keep both values neutral colored when unchanged", () => {
            render(<LtvChangeIndicator currentLtv={40} newLtv={40} />);

            const elements = screen.getAllByText("40.0%");
            expect(elements[0]).toHaveClass("text-white/60");
            expect(elements[1]).toHaveClass("text-white/70");
        });
    });

    describe("Warning State - Approaching Max LTV", () => {
        it("should show warning icon when newLtv > maxLtv * 0.9", () => {
            // maxLtv = 80, 90% of 80 = 72
            // newLtv = 75 > 72, should show warning
            render(<LtvChangeIndicator currentLtv={50} newLtv={75} maxLtv={80} />);

            expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
        });

        it("should show warning icon when newLtv equals maxLtv", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={80} maxLtv={80} />);

            expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
        });

        it("should show warning icon when newLtv exceeds maxLtv", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={85} maxLtv={80} />);

            expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
        });

        it("should NOT show warning icon when within safe range", () => {
            // maxLtv = 80, 90% of 80 = 72
            // newLtv = 60 < 72, should NOT show warning
            render(<LtvChangeIndicator currentLtv={30} newLtv={60} maxLtv={80} />);

            expect(screen.queryByTestId("alert-triangle-icon")).not.toBeInTheDocument();
        });

        it("should NOT show warning icon when exactly at 90% threshold", () => {
            // maxLtv = 80, 90% of 80 = 72
            // newLtv = 72 is NOT > 72, should NOT show warning
            render(<LtvChangeIndicator currentLtv={30} newLtv={72} maxLtv={80} />);

            expect(screen.queryByTestId("alert-triangle-icon")).not.toBeInTheDocument();
        });

        it("should NOT show warning icon when maxLtv is not provided", () => {
            render(<LtvChangeIndicator currentLtv={30} newLtv={90} />);

            expect(screen.queryByTestId("alert-triangle-icon")).not.toBeInTheDocument();
        });

        it("should apply amber color to warning icon", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={75} maxLtv={80} />);

            const warningIcon = screen.getByTestId("alert-triangle-icon");
            // Check the parent span has amber styling
            expect(warningIcon.parentElement).toHaveClass("text-amber-400");
        });
    });

    describe("Layout", () => {
        it("should have horizontal flex layout", () => {
            const { container } = render(
                <LtvChangeIndicator currentLtv={30} newLtv={40} />
            );

            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass("flex");
            expect(wrapper).toHaveClass("items-center");
        });

        it("should have gap between elements", () => {
            const { container } = render(
                <LtvChangeIndicator currentLtv={30} newLtv={40} />
            );

            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass("gap-1");
        });
    });

    describe("Edge Cases", () => {
        it("should handle zero LTV values", () => {
            render(<LtvChangeIndicator currentLtv={0} newLtv={0} />);

            const elements = screen.getAllByText("0.0%");
            expect(elements).toHaveLength(2);
        });

        it("should handle very small decimal differences", () => {
            render(<LtvChangeIndicator currentLtv={50.0} newLtv={50.1} />);

            const newLtvElement = screen.getByText("50.1%");
            expect(newLtvElement).toHaveClass("text-amber-400");
        });

        it("should handle 100% LTV", () => {
            render(<LtvChangeIndicator currentLtv={50} newLtv={100} />);

            expect(screen.getByText("100.0%")).toBeInTheDocument();
        });
    });
});
