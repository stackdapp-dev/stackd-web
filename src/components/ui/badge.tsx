import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#1a1a1a] border border-white/20 text-white px-3 py-1",
        beta: "bg-[#1a1a1a] border border-white/20 text-white px-3 py-1",
        recommended:
          "bg-[#1a1a1a] border border-[#22c55e]/40 text-[#22c55e] px-2.5 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    { className, variant, showDot = false, dotColor = "#f59e0b", ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {showDot && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        {props.children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
