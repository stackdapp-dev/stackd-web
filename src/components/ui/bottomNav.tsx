"use client";

import { cn } from "@/lib/utils";
import { History, Menu, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/wallet",
      icon: Wallet,
      label: "Wallet",
      subHrefs: ["/wallet/tx/borrow", "/wallet/tx/repay"],
    },
    { href: "/history", icon: History, label: "History", subHrefs: [] },
    {
      href: "/menu",
      icon: Menu,
      label: "Menu",
      subHrefs: ["/withdraw", "/withdraw/otc", "/profile"],
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-sm w-full z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="m-4 mb-4 backdrop-blur-2xl bg-black/30 border border-white/10 rounded-3xl px-6 py-3 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, icon: Icon, label, subHrefs }) => {
            const isActive = pathname === href || subHrefs.includes(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all relative",
                  isActive
                    ? "text-[#ffa02d]"
                    : "text-white/60 hover:text-white/80"
                )}
                prefetch={false}
              >
                {isActive && (
                  <div className="absolute -inset-2 bg-[#ffa02d]/10 rounded-xl backdrop-blur-sm" />
                )}
                <Icon className={cn("w-6 h-6 relative z-10", isActive && "drop-shadow-[0_0_8px_rgba(255,160,45,0.5)]")} />
                <span className="text-xs relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
