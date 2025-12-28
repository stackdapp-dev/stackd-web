"use client";

import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const MenuItem = ({
  href,
  leading,
  trailing,
  label,
  disabled = false,
  customContent,
  onClick,
}: {
  href: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  label?: string;
  disabled?: boolean;
  customContent?: React.ReactNode;
  onClick?: () => void;
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick();
    } else if (href && href !== "#") {
      // Use router.push to ensure navigation stays within PWA on iOS
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl border border-white/10 flex gap-3 items-center py-4 px-4 hover:bg-white/5 transition-colors text-left",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leading && leading}
      {customContent && !label && customContent}
      {!customContent && label && <span className="flex flex-1 text-white font-medium">{label}</span>}
      {trailing ? trailing : <ArrowRightIcon className="h-5 w-5 text-white/40" />}
    </button>
  );
};

export default MenuItem;

