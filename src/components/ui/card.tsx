"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva("w-full rounded-xl bg-card/30", {
  variants: {
    padding: {
      default: "p-6",
      compact: "p-3",
      none: "p-0",
    },
    shadow: {
      none: "",
      sm: "shadow-sm",
    },
    appearance: {
      default: "",
      container: "border-1 rounded border-neutral-500 flex flex-col gap-2 py-2 px-4 bg-black",
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
