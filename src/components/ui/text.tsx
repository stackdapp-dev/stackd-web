"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const textVariants = cva("text-xs", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
    },
    weight: {
      normal: "font-normal",
      semibold: "font-semibold",
    },
    case: {
      normal: "",
      upper: "uppercase tracking-wide",
    },
    tone: {
      muted: "text-muted",
      white: "text-white/80",
      whiteStrong: "text-white",
    },
  },
  defaultVariants: {
    size: "xs",
    weight: "normal",
    case: "normal",
    tone: "muted",
  },
});

export interface TextProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof textVariants> {
  children: React.ReactNode;
}

export default function Text({ children, className = "", size, weight, case: caseVariant, tone, ...rest }: TextProps) {
  return (
    <div className={cn(textVariants({ size, weight, case: caseVariant, tone }), className)} {...rest}>
      {children}
    </div>
  );
}
