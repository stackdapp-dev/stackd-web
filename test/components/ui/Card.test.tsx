/**
 * @vitest-environment jsdom
 * Unit tests for Card component appearance variants
 * TDD: Write tests FIRST, then implement
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Card from "@/components/ui/card";

describe("Card Component", () => {
    describe("Appearance Variants", () => {
        it("should render with default glass appearance", () => {
            render(<Card data-testid="card">Content</Card>);
            const card = screen.getByTestId("card");
            // Default appearance uses the "glass" CSS class from globals.css
            expect(card).toHaveClass("glass");
        });

        it("should render with glassDark appearance", () => {
            render(
                <Card appearance="glassDark" data-testid="card">
                    Content
                </Card>
            );
            const card = screen.getByTestId("card");
            expect(card).toHaveClass("backdrop-blur-xl");
            expect(card).toHaveClass("bg-black/20");
        });

        it("should render with glassAccent appearance", () => {
            render(
                <Card appearance="glassAccent" data-testid="card">
                    Content
                </Card>
            );
            const card = screen.getByTestId("card");
            expect(card).toHaveClass("backdrop-blur-xl");
        });

        it("should render with container appearance", () => {
            render(
                <Card appearance="container" data-testid="card">
                    Content
                </Card>
            );
            const card = screen.getByTestId("card");
            expect(card).toHaveClass("bg-white/5");
            expect(card).toHaveClass("border-white/10");
        });
    });

    describe("Dropdown Variant - Readability", () => {
        /**
         * The dropdown variant must have sufficient opacity for readability.
         * This test ensures the dropdown appearance uses a more opaque background
         * to prevent transparency issues when displayed over other content.
         *
         * Regression test for: Network dropdown too transparent bug
         */
        it("should have dropdown appearance with sufficient opacity for readability", () => {
            render(
                <Card appearance="dropdown" data-testid="card">
                    Dropdown Content
                </Card>
            );
            const card = screen.getByTestId("card");
            // Dropdown must use bg-slate-900/95 for adequate readability
            // This is more opaque than glassDark (bg-black/20)
            expect(card).toHaveClass("bg-slate-900/95");
            expect(card).toHaveClass("backdrop-blur-xl");
            expect(card).toHaveClass("border-white/10");
        });

        it("should NOT use low opacity backgrounds for dropdown appearance", () => {
            render(
                <Card appearance="dropdown" data-testid="card">
                    Dropdown Content
                </Card>
            );
            const card = screen.getByTestId("card");
            // Ensure low opacity backgrounds are NOT used (too transparent)
            expect(card).not.toHaveClass("bg-black/20");
            expect(card).not.toHaveClass("bg-white/5");
        });
    });

    describe("Padding Variants", () => {
        it("should render with default padding", () => {
            render(<Card data-testid="card">Content</Card>);
            const card = screen.getByTestId("card");
            expect(card).toHaveClass("p-4");
        });

        it("should render with compact padding", () => {
            render(
                <Card padding="compact" data-testid="card">
                    Content
                </Card>
            );
            const card = screen.getByTestId("card");
            expect(card).toHaveClass("p-3");
        });

        it("should render with no padding", () => {
            render(
                <Card padding="none" data-testid="card">
                    Content
                </Card>
            );
            const card = screen.getByTestId("card");
            expect(card).toHaveClass("p-0");
        });
    });
});
