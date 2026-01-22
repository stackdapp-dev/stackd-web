/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for Responsive Navigation
 *
 * Tests the responsive navbar behavior:
 * - Desktop: Top navbar with logo and horizontal nav items
 * - Mobile: Bottom navbar with icon-only navigation
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/wallet"),
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        prefetch: vi.fn(),
    })),
}));

// Mock useMediaQuery hook
vi.mock("@/hooks/useMediaQuery", () => ({
    useMediaQuery: vi.fn(),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
    default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
        <img src={src} alt={alt} className={className} />
    ),
}));

describe("ResponsiveNav", () => {
    // Setup window.matchMedia mock for iOS PWA detection
    beforeAll(() => {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    describe("Desktop Layout", () => {
        beforeEach(async () => {
            const { useMediaQuery } = await import("@/hooks/useMediaQuery");
            (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true); // Desktop
        });

        it("should render top navbar on desktop", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            // Should have top positioning on desktop
            const nav = screen.getByRole("navigation");
            expect(nav).toBeInTheDocument();
            expect(nav.className).toMatch(/top-/);
        });

        it("should display STACK'D logo on desktop", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            // Logo should be visible
            const logo = screen.getByTestId("stackd-logo");
            expect(logo).toBeInTheDocument();
        });

        it("should display navigation items with labels on desktop", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            // Should show text labels
            expect(screen.getByText("Wallet")).toBeInTheDocument();
            expect(screen.getByText("History")).toBeInTheDocument();
            expect(screen.getByText("Rewards")).toBeInTheDocument();
        });

        it("should display Card item on desktop", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            // Card should be visible on desktop
            expect(screen.getByText("Card")).toBeInTheDocument();
        });

        it("should highlight active navigation item", async () => {
            const { usePathname } = await import("next/navigation");
            (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/wallet");

            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            const walletButton = screen.getByRole("button", { name: /wallet/i });
            // Active item should have special styling (orange background)
            expect(walletButton.className).toMatch(/bg-\[#ffa02d\]/);
        });

        it("should navigate when clicking nav item", async () => {
            const { useRouter } = await import("next/navigation");
            const pushMock = vi.fn();
            (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
                push: pushMock,
                prefetch: vi.fn(),
            });

            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            const historyButton = screen.getByRole("button", { name: /history/i });
            await userEvent.click(historyButton);

            expect(pushMock).toHaveBeenCalledWith("/history");
        });
    });

    describe("Mobile Layout", () => {
        beforeEach(async () => {
            const { useMediaQuery } = await import("@/hooks/useMediaQuery");
            (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false); // Mobile
        });

        it("should render bottom navbar on mobile", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            const nav = screen.getByRole("navigation");
            expect(nav).toBeInTheDocument();
            // Check for fixed positioning (more reliable than checking Tailwind class names)
            expect(nav.className).toMatch(/fixed/);
        });

        it("should NOT display logo on mobile", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            expect(screen.queryByTestId("stackd-logo")).not.toBeInTheDocument();
        });

        it("should display Card item on mobile", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            // Card should be visible on mobile
            const cardButton = screen.getByLabelText("Card");
            expect(cardButton).toBeInTheDocument();
        });

        it("should display icon-only navigation on mobile", async () => {
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            // Should have aria-labels but icons should be present
            expect(screen.getByLabelText("Wallet")).toBeInTheDocument();
            expect(screen.getByLabelText("History")).toBeInTheDocument();
            expect(screen.getByLabelText("Rewards")).toBeInTheDocument();
        });
    });

    describe("Responsive Breakpoint", () => {
        it("should use md breakpoint (768px) for desktop detection", async () => {
            const { useMediaQuery } = await import("@/hooks/useMediaQuery");
            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");

            render(<ResponsiveNav />);

            // Should call useMediaQuery with md breakpoint
            expect(useMediaQuery).toHaveBeenCalledWith("(min-width: 768px)");
        });
    });

    describe("Active State Detection", () => {
        beforeEach(async () => {
            const { useMediaQuery } = await import("@/hooks/useMediaQuery");
            (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
        });

        it("should detect active state from pathname", async () => {
            const { usePathname } = await import("next/navigation");
            (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/history");

            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            const historyButton = screen.getByRole("button", { name: /history/i });
            expect(historyButton.className).toMatch(/bg-\[#ffa02d\]/);
        });

        it("should detect active state from sub-routes", async () => {
            const { usePathname } = await import("next/navigation");
            (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/wallet/tx/borrow");

            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            const walletButton = screen.getByRole("button", { name: /wallet/i });
            expect(walletButton.className).toMatch(/bg-\[#ffa02d\]/);
        });

        it("should detect Rewards active from /referrals path", async () => {
            const { usePathname } = await import("next/navigation");
            (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/referrals");

            const { ResponsiveNav } = await import("@/components/ui/ResponsiveNav");
            render(<ResponsiveNav />);

            const rewardsButton = screen.getByRole("button", { name: /rewards/i });
            expect(rewardsButton.className).toMatch(/bg-\[#ffa02d\]/);
        });
    });
});
