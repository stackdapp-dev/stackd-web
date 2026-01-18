"use client";

/**
 * WalletMenuButton Component
 * Three-dot menu button for wallet page header
 */
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoreVertical, ArrowDownToLine, User, Settings } from "lucide-react";

interface WalletMenuButtonProps {
    className?: string;
}

interface MenuItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
    {
        label: "Withdraw",
        href: "/withdraw",
        icon: <ArrowDownToLine className="w-4 h-4" />,
    },
    {
        label: "Profile",
        href: "/profile",
        icon: <User className="w-4 h-4" />,
    },
    {
        label: "Settings",
        href: "/menu",
        icon: <Settings className="w-4 h-4" />,
    },
];

export function WalletMenuButton({ className }: WalletMenuButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleItemClick = (href: string) => {
        setIsOpen(false);
        router.push(href);
    };

    return (
        <div ref={menuRef} className={cn("relative", className)}>
            {/* Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menu"
                className={cn(
                    "p-2 rounded-full",
                    "bg-gray-800/50 hover:bg-gray-700/50",
                    "border border-gray-700/50",
                    "transition-colors"
                )}
            >
                <MoreVertical
                    data-testid="menu-dots-icon"
                    className="w-5 h-5 text-gray-400"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    data-testid="menu-dropdown"
                    className={cn(
                        "absolute right-0 top-full mt-2",
                        "w-48 py-2 rounded-xl",
                        "bg-gray-800 border border-gray-700",
                        "shadow-xl shadow-black/50",
                        "z-50"
                    )}
                >
                    {menuItems.map((item) => (
                        <button
                            key={item.href}
                            onClick={() => handleItemClick(item.href)}
                            className={cn(
                                "w-full px-4 py-3",
                                "flex items-center gap-3",
                                "text-gray-300 hover:text-white",
                                "hover:bg-gray-700/50",
                                "transition-colors text-left"
                            )}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WalletMenuButton;
