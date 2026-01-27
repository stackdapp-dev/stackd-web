/**
 * @vitest-environment jsdom
 * TDD Tests for EarlyAccessModal Component
 * Tests written FIRST before implementation
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EarlyAccessModal from "@/components/ui/EarlyAccessModal";

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("EarlyAccessModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Modal should open when localStorage has no stored value
        localStorageMock.getItem.mockReturnValue(null);
    });

    describe("XAUT Warning Text", () => {
        it("should display the XAUT hidden warning text", () => {
            render(<EarlyAccessModal />);

            const warningText = screen.getByText(
                /XAUT is hidden for passkey and email logins/i
            );
            expect(warningText).toBeInTheDocument();
        });

        it("should display instruction to enable via Menu", () => {
            render(<EarlyAccessModal />);

            const instructionText = screen.getByText(
                /Enable it in the Menu page by clicking the 3 dot button/i
            );
            expect(instructionText).toBeInTheDocument();
        });
    });

    describe("Existing Content", () => {
        it("should still display the Early Access Campaign title", () => {
            render(<EarlyAccessModal />);

            expect(screen.getByText("Early Access Campaign")).toBeInTheDocument();
        });

        it("should still display the beta testing description", () => {
            render(<EarlyAccessModal />);

            expect(
                screen.getByText(/Stack'd is in Beta testing before our full launch/i)
            ).toBeInTheDocument();
        });

        it("should have a Got it! button", () => {
            render(<EarlyAccessModal />);

            expect(screen.getByText("Got it!")).toBeInTheDocument();
        });
    });
});
