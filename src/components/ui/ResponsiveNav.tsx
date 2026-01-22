"use client";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { History, CreditCard, Wallet, Sparkles, LucideIcon } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
    subHrefs: string[];
    desktopOnly?: boolean;
    mobileOnly?: boolean;
}

// Navigation items
const navItems: NavItem[] = [
    {
        href: "/wallet",
        icon: Wallet,
        label: "Wallet",
        subHrefs: ["/wallet/tx/borrow", "/wallet/tx/repay"],
    },
    {
        href: "/history",
        icon: History,
        label: "History",
        subHrefs: [],
    },
    {
        href: "/referrals",
        icon: Sparkles,
        label: "Rewards",
        subHrefs: [],
    },
    {
        href: "/card",
        icon: CreditCard,
        label: "Card",
        subHrefs: [],
    },
];

export const ResponsiveNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Prefetch all main routes on mount for faster navigation
    useEffect(() => {
        navItems.forEach(({ href, subHrefs }) => {
            router.prefetch(href);
            subHrefs.forEach((subHref) => router.prefetch(subHref));
        });
        router.prefetch("/wallet/loan");
        router.prefetch("/wallet/cash-in");
        router.prefetch("/referrals/tiers");
    }, [router]);

    // Prefetch on hover/touch
    const handlePrefetch = useCallback(
        (href: string, subHrefs: string[]) => {
            router.prefetch(href);
            subHrefs.forEach((subHref) => router.prefetch(subHref));
        },
        [router]
    );

    // Detect if running as iOS PWA
    const isIOSPWA =
        typeof window !== "undefined" &&
        (("standalone" in navigator &&
            (navigator as unknown as { standalone: boolean }).standalone) ||
            window.matchMedia("(display-mode: standalone)").matches);

    const handleNavigation = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (isIOSPWA) {
            window.location.href = href;
        } else {
            router.push(href);
        }
    };

    // Filter items based on viewport
    const filteredItems = navItems.filter((item) => {
        if (isDesktop && item.mobileOnly) return false;
        if (!isDesktop && item.desktopOnly) return false;
        return true;
    });

    if (isDesktop) {
        return <DesktopNav items={filteredItems} pathname={pathname} onNavigate={handleNavigation} onPrefetch={handlePrefetch} />;
    }

    return <MobileNav items={filteredItems} pathname={pathname} onNavigate={handleNavigation} onPrefetch={handlePrefetch} />;
};

interface NavProps {
    items: NavItem[];
    pathname: string;
    onNavigate: (e: React.MouseEvent, href: string) => void;
    onPrefetch: (href: string, subHrefs: string[]) => void;
}

// Desktop Top Navigation
const DesktopNav = ({ items, pathname, onNavigate, onPrefetch }: NavProps) => {
    return (
        <nav
            role="navigation"
            className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
        >
            <div
                className="flex items-center gap-2 px-4 py-2 rounded-[24px] border border-white/20"
                style={{
                    background: "rgba(30, 30, 35, 0.85)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    boxShadow:
                        "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-2 pr-4 border-r border-white/10" data-testid="stackd-logo">
                    <Image
                        src="/logo.png"
                        alt="Stack'd"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                    />
                    <span className="text-[#ffa02d] font-semibold text-lg tracking-tight">
                        STACK&apos;D
                    </span>
                </div>

                {/* Navigation Items */}
                <div className="flex items-center gap-1">
                    {items.map(({ href, icon: Icon, label, subHrefs }) => {
                        const isActive = pathname === href || subHrefs.includes(pathname);
                        return (
                            <button
                                key={href}
                                onClick={(e) => onNavigate(e, href)}
                                onMouseEnter={() => onPrefetch(href, subHrefs)}
                                aria-label={label}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                                    isActive
                                        ? "bg-[#ffa02d] text-black font-medium"
                                        : "text-white/60 hover:text-white/90 hover:bg-white/5"
                                )}
                            >
                                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-sm">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

// Mobile Bottom Navigation
const MobileNav = ({ items, pathname, onNavigate, onPrefetch }: NavProps) => {
    return (
        <nav
            role="navigation"
            className="fixed left-0 right-0 z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+8px)] px-4 pointer-events-none"
            style={{ bottom: 0, transform: 'translateZ(0)' }}
        >
            <div
                className="pointer-events-auto flex items-center justify-around gap-1 px-4 py-2 rounded-[24px] border border-white/20"
                style={{
                    background: "rgba(30, 30, 35, 0.75)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    boxShadow:
                        "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
            >
                {items.map(({ href, icon: Icon, label, subHrefs }) => {
                    const isActive = pathname === href || subHrefs.includes(pathname);
                    return (
                        <button
                            key={href}
                            onClick={(e) => onNavigate(e, href)}
                            onMouseEnter={() => onPrefetch(href, subHrefs)}
                            onTouchStart={() => onPrefetch(href, subHrefs)}
                            aria-label={label}
                            className={cn(
                                "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                                isActive
                                    ? "text-[#ffa02d] bg-[#ffa02d]/15"
                                    : "text-white/50 hover:text-white/70 active:bg-white/5"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-6 h-6 transition-transform duration-200",
                                    isActive && "scale-110 drop-shadow-[0_0_12px_rgba(255,160,45,0.6)]"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#ffa02d] shadow-[0_0_6px_#ffa02d]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default ResponsiveNav;
