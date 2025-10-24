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
  },
  defaultVariants: {
    padding: "default",
    shadow: "none",
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
    { className, asChild = false, padding, shadow, children, ...props },
    ref
  ) => {
    const Comp: any = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ padding, shadow }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Card.displayName = "Card";

export default Card;
