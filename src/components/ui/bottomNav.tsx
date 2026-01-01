"use client";

import { cn } from "@/lib/utils";
import { History, Menu, Wallet, Sparkles, LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  subHrefs: string[];
}

// Defined outside component to avoid recreation on each render
const navItems: NavItem[] = [
  {
    href: "/wallet",
    icon: Wallet,
    label: "Wallet",
    subHrefs: ["/wallet/tx/borrow", "/wallet/tx/repay"],
  },
  { href: "/history", icon: History, label: "History", subHrefs: [] },
  {
    href: "/referrals",
    icon: Sparkles,
    label: "Rewards",
    subHrefs: []
  },
  {
    href: "/menu",
    icon: Menu,
    label: "Menu",
    subHrefs: ["/withdraw", "/withdraw/otc", "/profile"],
  },
];

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch all main routes on mount for faster navigation
  useEffect(() => {
    navItems.forEach(({ href, subHrefs }) => {
      router.prefetch(href);
      // Also prefetch common sub-routes
      subHrefs.forEach((subHref) => router.prefetch(subHref));
    });
    // Prefetch other commonly accessed routes
    router.prefetch('/wallet/loan');
    router.prefetch('/wallet/deposit/WBTC');
    router.prefetch('/referrals/tiers');
  }, [router]);

  // Prefetch on hover/touch for extra responsiveness
  const handlePrefetch = useCallback((href: string, subHrefs: string[]) => {
    router.prefetch(href);
    subHrefs.forEach((subHref) => router.prefetch(subHref));
  }, [router]);

  // Detect if running as iOS PWA (standalone mode)
  const isIOSPWA = typeof window !== 'undefined' &&
    (("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches);

  const handleNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (isIOSPWA) {
      // On iOS PWA, use window.location to ensure navigation stays within app
      // This is more reliable than router.push() for iOS WebView
      window.location.href = href;
    } else {
      // On regular browsers, use Next.js router for SPA navigation
      router.push(href);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[calc(env(safe-area-inset-bottom)+8px)] px-4 pointer-events-none">
      {/* Liquid Glass Floating Pill */}
      <div
        className="pointer-events-auto flex items-center justify-around gap-1 px-4 py-2 rounded-[24px] border border-white/20"
        style={{
          background: 'rgba(30, 30, 35, 0.75)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {navItems.map(({ href, icon: Icon, label, subHrefs }) => {
          const isActive = pathname === href || subHrefs.includes(pathname);
          return (
            <button
              key={href}
              onClick={(e) => handleNavigation(e, href)}
              onMouseEnter={() => handlePrefetch(href, subHrefs)}
              onTouchStart={() => handlePrefetch(href, subHrefs)}
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
    </div>
  );
};

export default BottomNav;


