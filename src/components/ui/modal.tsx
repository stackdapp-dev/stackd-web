"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "./button";
import Text from "./text";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  icon?: ReactNode;
  primaryButtonText?: string;
  primaryButtonAction?: () => void;
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
  showCloseButton?: boolean;
  showActionButtons?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  icon,
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText,
  secondaryButtonAction,
  showCloseButton = true,
  showActionButtons = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6 overflow-auto scrollbar-hide animate-in fade-in-0 duration-300"
    >
      <div
        data-testid="modal-content"
        className="relative text-white rounded-3xl p-8 max-w-md w-full overflow-auto scrollbar-hide border border-white/10 animate-in fade-in-0 zoom-in-95 duration-300"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        {showCloseButton && (
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <div className="flex flex-col gap-6 items-center text-center">
          {icon && icon}

          <div className="flex flex-col gap-2">
            <Text size="xl" weight="semibold">
              {title}
            </Text>
            <div>{message}</div>
          </div>

          {showActionButtons && (
            <div className="flex w-full gap-3">
              {secondaryButtonText && (
                <button
                  onClick={secondaryButtonAction}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                >
                  {secondaryButtonText}
                </button>
              )}
              {primaryButtonText && (
                <Button className="flex-1 rounded-xl" onClick={primaryButtonAction}>
                  {primaryButtonText}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
