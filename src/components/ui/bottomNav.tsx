"use client";

import { cn } from "@/lib/utils";
import { History, Menu, Wallet, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
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

  const handleNavigation = (href: string) => {
    // Use router.push to ensure navigation stays within PWA on iOS
    router.push(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ href, icon: Icon, label, subHrefs }) => {
          const isActive = pathname === href || subHrefs.includes(pathname);
          return (
            <button
              key={href}
              onClick={() => handleNavigation(href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-all relative w-16 h-full",
                isActive
                  ? "text-[#ffa02d]"
                  : "text-white/40 hover:text-white/60 active:text-white/80"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#ffa02d] rounded-b-full shadow-[0_0_8px_#ffa02d]" />
              )}
              <Icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(255,160,45,0.4)]")} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

