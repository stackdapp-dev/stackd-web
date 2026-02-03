/**
 * @vitest-environment jsdom
 * Unit tests for LoginScreen component layout
 * TDD: Write tests FIRST, then implement
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginScreen from "@/components/modules/auth/LoginScreen";

// Mock Privy
vi.mock("@privy-io/react-auth", () => ({
    usePrivy: () => ({
        login: vi.fn(),
    }),
}));

// Mock next/image
vi.mock("next/image", () => ({
    default: ({ src, alt, ...props }: { src: string; alt: string }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} {...props} />
    ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children, ...props }: { children: React.ReactNode }) => (
            <div {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("LoginScreen Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Button Layout Order", () => {
        it("should show Connect External Wallet as the first/primary button", () => {
            render(<LoginScreen />);
            const buttonsContainer = screen.getByTestId("login-buttons-container");
            const buttons = buttonsContainer.querySelectorAll("button");

            // First button should be Connect External Wallet
            expect(buttons[0]).toHaveTextContent("Connect External Wallet");
        });

        it("should show Connect External Wallet with primary styling (amber background)", () => {
            render(<LoginScreen />);
            const walletButton = screen.getByTestId("login-wallet-button");

            // Should have solid amber background for primary action
            expect(walletButton).toHaveClass("bg-amber-500");
            expect(walletButton).toHaveClass("text-black");
        });
    });

    describe("Other Login Options Dropdown", () => {
        it("should have an 'Other Login Options' dropdown button", () => {
            render(<LoginScreen />);
            const dropdownButton = screen.getByTestId("login-other-options-button");

            expect(dropdownButton).toBeInTheDocument();
            expect(dropdownButton).toHaveTextContent("Other Login Options");
        });

        it("should show chevron icon on dropdown button", () => {
            render(<LoginScreen />);
            const chevronIcon = screen.getByTestId("login-other-options-chevron");

            expect(chevronIcon).toBeInTheDocument();
        });

        it("should hide Email and Passkey buttons by default (collapsed)", () => {
            render(<LoginScreen />);

            // Email and Passkey buttons should not be visible initially
            expect(screen.queryByTestId("login-email-button")).not.toBeInTheDocument();
            expect(screen.queryByTestId("login-passkey-button")).not.toBeInTheDocument();
        });

        it("should show Email and Passkey buttons when dropdown is expanded", async () => {
            render(<LoginScreen />);
            const dropdownButton = screen.getByTestId("login-other-options-button");

            // Click to expand
            fireEvent.click(dropdownButton);

            // Now Email and Passkey buttons should be visible
            await waitFor(() => {
                expect(screen.getByTestId("login-email-button")).toBeInTheDocument();
                expect(screen.getByTestId("login-passkey-button")).toBeInTheDocument();
            });
        });

        it("should rotate chevron when dropdown is expanded", async () => {
            render(<LoginScreen />);
            const dropdownButton = screen.getByTestId("login-other-options-button");
            const chevronIcon = screen.getByTestId("login-other-options-chevron");

            // Initially chevron should point down (not rotated)
            expect(chevronIcon).not.toHaveClass("rotate-180");

            // Click to expand
            fireEvent.click(dropdownButton);

            // Chevron should rotate to point up
            await waitFor(() => {
                expect(chevronIcon).toHaveClass("rotate-180");
            });
        });

        it("should hide Email and Passkey buttons when dropdown is collapsed again", async () => {
            render(<LoginScreen />);
            const dropdownButton = screen.getByTestId("login-other-options-button");

            // Expand
            fireEvent.click(dropdownButton);

            await waitFor(() => {
                expect(screen.getByTestId("login-email-button")).toBeInTheDocument();
            });

            // Collapse
            fireEvent.click(dropdownButton);

            await waitFor(() => {
                expect(screen.queryByTestId("login-email-button")).not.toBeInTheDocument();
                expect(screen.queryByTestId("login-passkey-button")).not.toBeInTheDocument();
            });
        });
    });

    describe("Removed Elements", () => {
        it("should NOT have a RECOMMENDED badge", () => {
            render(<LoginScreen />);

            // The RECOMMENDED badge should not exist
            expect(screen.queryByTestId("login-wallet-badge")).not.toBeInTheDocument();
            expect(screen.queryByText("RECOMMENDED")).not.toBeInTheDocument();
        });
    });

    describe("Alpha Badge at Top", () => {
        it("should display 'Alpha - Invite Only Testing' text in the alpha badge", () => {
            render(<LoginScreen />);
            const alphaBadge = screen.getByTestId("login-beta-badge");

            expect(alphaBadge).toBeInTheDocument();
            expect(alphaBadge).toHaveTextContent("Alpha - Invite Only Testing");
        });
    });

    describe("BETA Badges on Dropdown Options", () => {
        it("should show BETA badge on Email option when expanded", async () => {
            render(<LoginScreen />);
            const dropdownButton = screen.getByTestId("login-other-options-button");

            fireEvent.click(dropdownButton);

            await waitFor(() => {
                expect(screen.getByTestId("login-email-badge")).toBeInTheDocument();
                expect(screen.getByTestId("login-email-badge")).toHaveTextContent("BETA");
            });
        });

        it("should show BETA badge on Passkey option when expanded", async () => {
            render(<LoginScreen />);
            const dropdownButton = screen.getByTestId("login-other-options-button");

            fireEvent.click(dropdownButton);

            await waitFor(() => {
                expect(screen.getByTestId("login-passkey-badge")).toBeInTheDocument();
                expect(screen.getByTestId("login-passkey-badge")).toHaveTextContent("BETA");
            });
        });
    });
});
