"use client";

import { cn } from "@/lib/utils";
import { History, Menu, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/history", icon: History, label: "History" },
    { href: "/menu", icon: Menu, label: "Menu" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 w-full md:w-sm md:mx-auto md:left-auto md:right-auto items-center justify-around bg-background shadow-[0_-2px_4px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors uppercase",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-primary focus:text-primary"
            )}
            prefetch={false}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
