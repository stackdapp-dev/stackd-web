import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#ffa02d] to-[#ff8c00] text-black rounded-full hover:shadow-[0_0_20px_rgba(255,160,45,0.5)] hover:scale-105 shadow-lg",
        secondary:
          "backdrop-blur-xl bg-gradient-to-br from-[#ffa02d]/20 to-[#ff8c00]/10 border-2 border-[#ffa02d]/40 text-[#ffa02d] rounded-2xl hover:border-[#ffa02d]/60 hover:bg-[#ffa02d]/30 hover:shadow-[0_0_20px_rgba(255,160,45,0.3)] hover:scale-[1.02]",
        outline:
          "backdrop-blur-xl bg-gradient-to-br from-[#ffa02d]/20 to-[#ff8c00]/10 border-2 border-[#ffa02d]/40 text-[#ffa02d] rounded-2xl hover:border-[#ffa02d]/60 hover:bg-[#ffa02d]/30 hover:shadow-[0_0_20px_rgba(255,160,45,0.3)] hover:scale-[1.02]",
        ghost:
          "rounded-full backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-white",
        link: "text-[#ffa02d] underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        xs: "h-6 px-3 text-xs",
        sm: "h-8 px-4 text-sm rounded-full",
        lg: "h-12 rounded-2xl px-8 py-3.5 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
