import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "dark" | "accent" | "green";
    children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        const variants = {
            default: "backdrop-blur-xl bg-white/5 border-white/10",
            dark: "backdrop-blur-xl bg-black/20 border-white/5",
            accent: "backdrop-blur-xl bg-[#ffa02d]/10 border-[#ffa02d]/20",
            green: "backdrop-blur-xl bg-emerald-900/20 border-emerald-500/20",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl border", // Base styles from guidelines (Radius: rounded-2xl, Border: 1px)
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
