"use client";

import { cn, formatCurrency, MASK_LONG, MASK_SHORT, maskString } from "@/lib/utils";
import { useVisibility } from "@/providers/visibility";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

const valueVariants = cva("", {
  variants: {
    size: {
      title: "text-center text-4xl sm:text-5xl font-bold leading-none",
      body: "text-sm font-semibold",
      small: "text-xs font-medium",
    },
  },
  defaultVariants: {
    size: "body",
  },
});

type Mask = "short" | "long";

export interface MaskedValueProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof valueVariants> {
  value?: number | string;
  mask?: Mask;
  showToggle?: boolean;
  visible?: boolean;
  onToggle?: () => void;
  buttonClassName?: string;
}

export default function MaskedValue({
  value,
  mask = "long",
  showToggle = false,
  visible,
  onToggle,
  className = "",
  buttonClassName = "",
  size,
  ...rest
}: MaskedValueProps) {
  const visibility = useVisibility();
  const isVisible = typeof visible === "boolean" ? visible : visibility.visible;
  const toggle = onToggle ?? visibility.toggle;

  const formatted = maskString(formatCurrency(value), isVisible, mask === "short" ? MASK_SHORT : MASK_LONG);

  return (
    <div className={cn("inline-flex items-center gap-3", valueVariants({ size }), className)} {...rest}>
      <span>{formatted}</span>
      {showToggle ? (
        <button
          aria-label={isVisible ? "Hide value" : "Show value"}
          onClick={toggle}
          className={cn("inline-flex items-center justify-center text-xl text-muted/80 hover:text-muted", buttonClassName)}
          type="button"
        >
          {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      ) : null}
    </div>
  );
}
