"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva("w-full rounded-2xl transition-all", {
  variants: {
    padding: {
      default: "p-4",
      compact: "p-3",
      none: "p-0",
    },
    shadow: {
      none: "",
      sm: "shadow-sm",
    },
    appearance: {
      default: "glass",
      glass: "backdrop-blur-xl bg-white/5 border border-white/10",
      glassDark: "backdrop-blur-xl bg-black/20 border border-white/5",
      glassAccent: "backdrop-blur-xl bg-[#ffa02d]/10 border border-[#ffa02d]/20",
      container: "border border-white/10 bg-white/5",
    },
  },
  defaultVariants: {
    padding: "default",
    shadow: "none",
    appearance: "default",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  asChild?: boolean;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, asChild = false, padding, shadow, appearance, children, ...props },
    ref
  ) => {
    const Comp: any = asChild ? Slot : "div";

    const effectivePadding = appearance === "container" && padding === undefined ? "none" : padding;

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ padding: effectivePadding, shadow, appearance }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Card.displayName = "Card";

export default Card;
