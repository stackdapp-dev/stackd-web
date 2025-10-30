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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="relative bg-neutral-900 text-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {showCloseButton && (
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-3 right-3 text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          {icon && icon}

          <Text size="xl" weight="semibold" className="mb-2">
            {title}
          </Text>
          {message}

          {showActionButtons && (
            <div className="flex w-full gap-3">
              {secondaryButtonText && (
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={secondaryButtonAction}
                >
                  {secondaryButtonText}
                </Button>
              )}
              {primaryButtonText && (
                <Button className="flex-1" onClick={primaryButtonAction}>
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
