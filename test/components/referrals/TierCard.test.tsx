/**
 * Unit tests for TierCard component
 * TDD: Write tests FIRST, then implement
 *
 * Tests individual tier card rendering including:
 * - Tier name and icon
 * - Requirements list
 * - Benefits list
 * - Current/Locked/Unlocked states
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TierCard } from "@/components/referrals/TierCard";
import type { UserTier } from "@/lib/referrals/tiers";

// Helper to create tier card props
const createTierCardProps = (overrides: {
    tier?: UserTier;
    isCurrent?: boolean;
    isUnlocked?: boolean;
} = {}) => ({
    tier: overrides.tier ?? "SILVER",
    isCurrent: overrides.isCurrent ?? false,
    isUnlocked: overrides.isUnlocked ?? false,
});

describe("TierCard Component", () => {
    describe("Tier Name and Icon Display", () => {
        it("should display tier name for Bronze", () => {
            render(<TierCard {...createTierCardProps({ tier: "BRONZE" })} />);
            expect(screen.getByText("Bronze")).toBeInTheDocument();
        });

        it("should display tier name for Silver", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER" })} />);
            expect(screen.getByText("Silver")).toBeInTheDocument();
        });

        it("should display tier name for Gold", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            expect(screen.getByText("Gold")).toBeInTheDocument();
        });

        it("should display tier name for Platinum", () => {
            render(<TierCard {...createTierCardProps({ tier: "PLATINUM" })} />);
            expect(screen.getByText("Platinum")).toBeInTheDocument();
        });

        it("should display tier name for Black", () => {
            render(<TierCard {...createTierCardProps({ tier: "BLACK" })} />);
            expect(screen.getByText("Black")).toBeInTheDocument();
        });

        it("should display tier icon", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            expect(screen.getByTestId("tier-icon")).toBeInTheDocument();
        });

        it("should display Trophy icon for Bronze/Silver/Gold tiers", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            const icon = screen.getByTestId("tier-icon");
            expect(icon).toHaveAttribute("data-icon", "trophy");
        });

        it("should display Crown icon for Platinum tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "PLATINUM" })} />);
            const icon = screen.getByTestId("tier-icon");
            expect(icon).toHaveAttribute("data-icon", "crown");
        });

        it("should display CreditCard icon for Black tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "BLACK" })} />);
            const icon = screen.getByTestId("tier-icon");
            expect(icon).toHaveAttribute("data-icon", "credit-card");
        });
    });

    describe("Tier Requirements Display", () => {
        it("should list tier requirements for Bronze", () => {
            render(<TierCard {...createTierCardProps({ tier: "BRONZE" })} />);
            const requirementsList = screen.getByTestId("tier-requirements");
            expect(within(requirementsList).getByText(/starting tier/i)).toBeInTheDocument();
        });

        it("should list tier requirements for Silver (personal loan >= $500)", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER" })} />);
            const requirementsList = screen.getByTestId("tier-requirements");
            expect(within(requirementsList).getByText(/personal loan/i)).toBeInTheDocument();
            expect(within(requirementsList).getByText(/\$500/i)).toBeInTheDocument();
        });

        it("should list tier requirements for Gold (network volume >= $5,000)", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            const requirementsList = screen.getByTestId("tier-requirements");
            expect(within(requirementsList).getByText(/network volume/i)).toBeInTheDocument();
            expect(within(requirementsList).getByText(/\$5,000/i)).toBeInTheDocument();
        });

        it("should list tier requirements for Platinum (network volume >= $10,000)", () => {
            render(<TierCard {...createTierCardProps({ tier: "PLATINUM" })} />);
            const requirementsList = screen.getByTestId("tier-requirements");
            expect(within(requirementsList).getByText(/network volume/i)).toBeInTheDocument();
            expect(within(requirementsList).getByText(/\$10,000/i)).toBeInTheDocument();
        });

        it("should list tier requirements for Black (network volume >= $50,000)", () => {
            render(<TierCard {...createTierCardProps({ tier: "BLACK" })} />);
            const requirementsList = screen.getByTestId("tier-requirements");
            expect(within(requirementsList).getByText(/network volume/i)).toBeInTheDocument();
            expect(within(requirementsList).getByText(/\$50,000/i)).toBeInTheDocument();
        });

        it("should mention Silver requirement for network tiers (Gold/Platinum/Black)", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            const requirementsList = screen.getByTestId("tier-requirements");
            expect(within(requirementsList).getByText(/requires silver/i)).toBeInTheDocument();
        });
    });

    describe("Tier Benefits Display", () => {
        it("should list tier benefits for Bronze", () => {
            render(<TierCard {...createTierCardProps({ tier: "BRONZE" })} />);
            const benefitsList = screen.getByTestId("tier-benefits");
            expect(within(benefitsList).getByText(/base earnings/i)).toBeInTheDocument();
            expect(within(benefitsList).getByText(/track referral network/i)).toBeInTheDocument();
        });

        it("should list tier benefits for Silver", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER" })} />);
            const benefitsList = screen.getByTestId("tier-benefits");
            expect(within(benefitsList).getByText(/payouts unlocked/i)).toBeInTheDocument();
            expect(within(benefitsList).getByText(/withdraw earnings/i)).toBeInTheDocument();
        });

        it("should list tier benefits for Gold", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            const benefitsList = screen.getByTestId("tier-benefits");
            expect(within(benefitsList).getByText(/\+5% APY boost/i)).toBeInTheDocument();
        });

        it("should list tier benefits for Platinum", () => {
            render(<TierCard {...createTierCardProps({ tier: "PLATINUM" })} />);
            const benefitsList = screen.getByTestId("tier-benefits");
            expect(within(benefitsList).getByText(/priority support/i)).toBeInTheDocument();
        });

        it("should list tier benefits for Black", () => {
            render(<TierCard {...createTierCardProps({ tier: "BLACK" })} />);
            const benefitsList = screen.getByTestId("tier-benefits");
            expect(within(benefitsList).getByText(/metal visa/i)).toBeInTheDocument();
            expect(within(benefitsList).getByText(/exclusive events/i)).toBeInTheDocument();
        });

        it("should show inherited benefits for higher tiers", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            const benefitsList = screen.getByTestId("tier-benefits");
            expect(within(benefitsList).getByText(/all silver benefits/i)).toBeInTheDocument();
        });
    });

    describe("Current Tier State", () => {
        it("should show 'Current' badge when tier is current", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER", isCurrent: true })} />);
            expect(screen.getByText(/current/i)).toBeInTheDocument();
        });

        it("should have data-current attribute set to true when current", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER", isCurrent: true })} />);
            const card = screen.getByTestId("tier-card-SILVER");
            expect(card).toHaveAttribute("data-current", "true");
        });

        it("should apply special styling when current", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD", isCurrent: true })} />);
            const card = screen.getByTestId("tier-card-GOLD");
            expect(card).toHaveClass("ring-2");
        });

        it("should not show 'Current' badge when tier is not current", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER", isCurrent: false })} />);
            expect(screen.queryByText(/^current$/i)).not.toBeInTheDocument();
        });
    });

    describe("Locked State", () => {
        it("should show 'Locked' state when not achieved and not current", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD", isCurrent: false, isUnlocked: false })} />);
            expect(screen.getByTestId("tier-status")).toHaveTextContent(/locked/i);
        });

        it("should show lock icon when locked", () => {
            render(<TierCard {...createTierCardProps({ tier: "PLATINUM", isCurrent: false, isUnlocked: false })} />);
            expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
        });

        it("should apply reduced opacity when locked", () => {
            render(<TierCard {...createTierCardProps({ tier: "BLACK", isCurrent: false, isUnlocked: false })} />);
            const card = screen.getByTestId("tier-card-BLACK");
            expect(card).toHaveClass("opacity-50");
        });
    });

    describe("Unlocked State", () => {
        it("should show 'Unlocked' state when achieved but not current", () => {
            render(<TierCard {...createTierCardProps({ tier: "BRONZE", isCurrent: false, isUnlocked: true })} />);
            expect(screen.getByTestId("tier-status")).toHaveTextContent(/unlocked/i);
        });

        it("should show check icon when unlocked", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER", isCurrent: false, isUnlocked: true })} />);
            expect(screen.getByTestId("check-icon")).toBeInTheDocument();
        });

        it("should not apply reduced opacity when unlocked", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER", isCurrent: false, isUnlocked: true })} />);
            const card = screen.getByTestId("tier-card-SILVER");
            expect(card).not.toHaveClass("opacity-50");
        });
    });

    describe("Tier Colors", () => {
        it("should apply correct color styling for Bronze tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "BRONZE" })} />);
            const card = screen.getByTestId("tier-card-BRONZE");
            expect(card).toHaveClass("border-orange-500/20");
        });

        it("should apply correct color styling for Silver tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "SILVER" })} />);
            const card = screen.getByTestId("tier-card-SILVER");
            expect(card).toHaveClass("border-gray-400/20");
        });

        it("should apply correct color styling for Gold tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "GOLD" })} />);
            const card = screen.getByTestId("tier-card-GOLD");
            expect(card).toHaveClass("border-yellow-500/20");
        });

        it("should apply correct color styling for Platinum tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "PLATINUM" })} />);
            const card = screen.getByTestId("tier-card-PLATINUM");
            expect(card).toHaveClass("border-purple-500/20");
        });

        it("should apply correct color styling for Black tier", () => {
            render(<TierCard {...createTierCardProps({ tier: "BLACK" })} />);
            const card = screen.getByTestId("tier-card-BLACK");
            expect(card).toHaveClass("border-slate-600/30");
        });
    });
});
