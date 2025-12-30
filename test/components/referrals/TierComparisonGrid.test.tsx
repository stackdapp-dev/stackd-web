/**
 * Unit tests for TierComparisonGrid component
 * TDD: Write tests FIRST, then implement
 *
 * Tests the tier comparison table/grid that shows all tiers
 * side by side with requirements and benefits.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TierComparisonGrid } from "@/components/referrals/TierComparisonGrid";
import type { UserTier } from "@/lib/referrals/tiers";

// All tier names for iteration
const ALL_TIERS: UserTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "BLACK"];

describe("TierComparisonGrid Component", () => {
    describe("Table Structure", () => {
        it("should render comparison table with all tiers", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const table = screen.getByRole("table");
            expect(table).toBeInTheDocument();

            // Check all tier columns exist
            expect(screen.getByText("Bronze")).toBeInTheDocument();
            expect(screen.getByText("Silver")).toBeInTheDocument();
            expect(screen.getByText("Gold")).toBeInTheDocument();
            expect(screen.getByText("Platinum")).toBeInTheDocument();
            expect(screen.getByText("Black")).toBeInTheDocument();
        });

        it("should render 5 tier columns", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const tierHeaders = screen.getAllByTestId(/^tier-column-header-/);
            expect(tierHeaders).toHaveLength(5);
        });

        it("should render tier headers in correct order", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const headers = screen.getAllByTestId(/^tier-column-header-/);
            const headerTiers = headers.map((h) => h.getAttribute("data-tier"));

            expect(headerTiers).toEqual(["BRONZE", "SILVER", "GOLD", "PLATINUM", "BLACK"]);
        });
    });

    describe("Requirements Row", () => {
        it("should show requirements row in the table", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const requirementsRow = screen.getByTestId("requirements-row");
            expect(requirementsRow).toBeInTheDocument();
        });

        it("should display 'Requirements' label in row header", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const requirementsRow = screen.getByTestId("requirements-row");
            expect(within(requirementsRow).getByText(/requirements/i)).toBeInTheDocument();
        });

        it("should show Bronze requirement (Starting tier / None)", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const bronzeReq = screen.getByTestId("requirement-BRONZE");
            expect(bronzeReq).toHaveTextContent(/starting tier|none/i);
        });

        it("should show Silver requirement ($500 personal loan)", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const silverReq = screen.getByTestId("requirement-SILVER");
            expect(silverReq).toHaveTextContent(/\$500/i);
        });

        it("should show Gold requirement ($5,000 network volume)", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const goldReq = screen.getByTestId("requirement-GOLD");
            expect(goldReq).toHaveTextContent(/\$5,000/i);
        });

        it("should show Platinum requirement ($10,000 network volume)", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const platinumReq = screen.getByTestId("requirement-PLATINUM");
            expect(platinumReq).toHaveTextContent(/\$10,000/i);
        });

        it("should show Black requirement ($50,000 network volume)", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const blackReq = screen.getByTestId("requirement-BLACK");
            expect(blackReq).toHaveTextContent(/\$50,000/i);
        });
    });

    describe("Benefits Rows", () => {
        it("should show benefits rows in the table", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const benefitsRows = screen.getAllByTestId(/^benefit-row-/);
            expect(benefitsRows.length).toBeGreaterThan(0);
        });

        it("should show base earnings benefit row", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            expect(screen.getByTestId("benefit-row-earnings")).toBeInTheDocument();
        });

        it("should show payouts unlocked benefit row", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            expect(screen.getByTestId("benefit-row-payouts")).toBeInTheDocument();
        });

        it("should show APY boost benefit row", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            expect(screen.getByTestId("benefit-row-apy")).toBeInTheDocument();
        });

        it("should show priority support benefit row", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            expect(screen.getByTestId("benefit-row-support")).toBeInTheDocument();
        });

        it("should show Metal Visa benefit row", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            expect(screen.getByTestId("benefit-row-visa")).toBeInTheDocument();
        });

        it("should mark Bronze as having base earnings", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const earningsRow = screen.getByTestId("benefit-row-earnings");
            const bronzeCell = within(earningsRow).getByTestId("benefit-cell-BRONZE");
            expect(bronzeCell).toHaveAttribute("data-has-benefit", "true");
        });

        it("should mark Silver and above as having payouts unlocked", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const payoutsRow = screen.getByTestId("benefit-row-payouts");

            // Bronze should NOT have payouts
            const bronzeCell = within(payoutsRow).getByTestId("benefit-cell-BRONZE");
            expect(bronzeCell).toHaveAttribute("data-has-benefit", "false");

            // Silver+ should have payouts
            const silverCell = within(payoutsRow).getByTestId("benefit-cell-SILVER");
            const goldCell = within(payoutsRow).getByTestId("benefit-cell-GOLD");
            expect(silverCell).toHaveAttribute("data-has-benefit", "true");
            expect(goldCell).toHaveAttribute("data-has-benefit", "true");
        });

        it("should mark Gold and above as having APY boost", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const apyRow = screen.getByTestId("benefit-row-apy");

            // Bronze and Silver should NOT have APY boost
            const bronzeCell = within(apyRow).getByTestId("benefit-cell-BRONZE");
            const silverCell = within(apyRow).getByTestId("benefit-cell-SILVER");
            expect(bronzeCell).toHaveAttribute("data-has-benefit", "false");
            expect(silverCell).toHaveAttribute("data-has-benefit", "false");

            // Gold+ should have APY boost
            const goldCell = within(apyRow).getByTestId("benefit-cell-GOLD");
            expect(goldCell).toHaveAttribute("data-has-benefit", "true");
        });

        it("should mark Platinum and above as having priority support", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const supportRow = screen.getByTestId("benefit-row-support");

            // Below Platinum should NOT have support
            const goldCell = within(supportRow).getByTestId("benefit-cell-GOLD");
            expect(goldCell).toHaveAttribute("data-has-benefit", "false");

            // Platinum+ should have support
            const platinumCell = within(supportRow).getByTestId("benefit-cell-PLATINUM");
            const blackCell = within(supportRow).getByTestId("benefit-cell-BLACK");
            expect(platinumCell).toHaveAttribute("data-has-benefit", "true");
            expect(blackCell).toHaveAttribute("data-has-benefit", "true");
        });

        it("should mark only Black as having Metal Visa", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const visaRow = screen.getByTestId("benefit-row-visa");

            // Below Black should NOT have Visa
            const platinumCell = within(visaRow).getByTestId("benefit-cell-PLATINUM");
            expect(platinumCell).toHaveAttribute("data-has-benefit", "false");

            // Black should have Visa
            const blackCell = within(visaRow).getByTestId("benefit-cell-BLACK");
            expect(blackCell).toHaveAttribute("data-has-benefit", "true");
        });
    });

    describe("Current Tier Column Highlighting", () => {
        it("should highlight current tier column (BRONZE)", () => {
            render(<TierComparisonGrid currentTier="BRONZE" />);

            const bronzeHeader = screen.getByTestId("tier-column-header-BRONZE");
            expect(bronzeHeader).toHaveAttribute("data-current", "true");
        });

        it("should highlight current tier column (SILVER)", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const silverHeader = screen.getByTestId("tier-column-header-SILVER");
            expect(silverHeader).toHaveAttribute("data-current", "true");
        });

        it("should highlight current tier column (GOLD)", () => {
            render(<TierComparisonGrid currentTier="GOLD" />);

            const goldHeader = screen.getByTestId("tier-column-header-GOLD");
            expect(goldHeader).toHaveAttribute("data-current", "true");
        });

        it("should highlight current tier column (PLATINUM)", () => {
            render(<TierComparisonGrid currentTier="PLATINUM" />);

            const platinumHeader = screen.getByTestId("tier-column-header-PLATINUM");
            expect(platinumHeader).toHaveAttribute("data-current", "true");
        });

        it("should highlight current tier column (BLACK)", () => {
            render(<TierComparisonGrid currentTier="BLACK" />);

            const blackHeader = screen.getByTestId("tier-column-header-BLACK");
            expect(blackHeader).toHaveAttribute("data-current", "true");
        });

        it("should not highlight non-current tier columns", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const bronzeHeader = screen.getByTestId("tier-column-header-BRONZE");
            const goldHeader = screen.getByTestId("tier-column-header-GOLD");

            expect(bronzeHeader).not.toHaveAttribute("data-current", "true");
            expect(goldHeader).not.toHaveAttribute("data-current", "true");
        });

        it("should apply visual highlight styling to current tier column", () => {
            render(<TierComparisonGrid currentTier="GOLD" />);

            const goldHeader = screen.getByTestId("tier-column-header-GOLD");
            expect(goldHeader).toHaveClass("bg-yellow-500/10");
        });

        it("should show 'Your Tier' label on current tier column", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const silverHeader = screen.getByTestId("tier-column-header-SILVER");
            expect(within(silverHeader).getByText(/your tier/i)).toBeInTheDocument();
        });
    });

    describe("Benefit Indicators", () => {
        it("should show checkmark for available benefits", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const earningsRow = screen.getByTestId("benefit-row-earnings");
            const bronzeCell = within(earningsRow).getByTestId("benefit-cell-BRONZE");

            expect(within(bronzeCell).getByTestId("benefit-check")).toBeInTheDocument();
        });

        it("should show dash or X for unavailable benefits", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const visaRow = screen.getByTestId("benefit-row-visa");
            const bronzeCell = within(visaRow).getByTestId("benefit-cell-BRONZE");

            expect(within(bronzeCell).getByTestId("benefit-unavailable")).toBeInTheDocument();
        });
    });

    describe("Responsive Layout", () => {
        it("should have horizontal scroll on mobile", () => {
            render(<TierComparisonGrid currentTier="SILVER" />);

            const container = screen.getByTestId("tier-comparison-container");
            expect(container).toHaveClass("overflow-x-auto");
        });
    });
});
