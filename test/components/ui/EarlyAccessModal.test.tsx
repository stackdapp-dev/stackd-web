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
        it("should display the XAUT Ethereum wallet warning text", () => {
            render(<EarlyAccessModal />);

            const warningText = screen.getByText(
                /XAUT Ethereum is not yet supported on email or passkey wallets/i
            );
            expect(warningText).toBeInTheDocument();
        });

        it("should display instruction to use External Wallet option", () => {
            render(<EarlyAccessModal />);

            const instructionText = screen.getByText(
                /For XAUT positions, please login using the External Wallet option/i
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
