"use client";

import { Trash2 } from "lucide-react";
import Card from "./card";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function BottomSheet({ isOpen, onClose, onDelete }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center">
      {/* backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div className="relative w-full md:w-sm bottom-0">
        <div className="pb-[env(safe-area-inset-bottom,1rem)]">
          <Card appearance="container" className="rounded-t-2xl overflow-visible w-full relative z-10">
            <div className="py-6">
            <ul className="flex flex-col gap-3">
              <li>
                <div className="px-2">
                  <button
                    onClick={() => {
                      onDelete();
                    }}
                    className="w-full"
                    aria-label="Delete payment method"
                  >
                    <div className="w-full bg-black/80 border border-neutral-700 rounded-lg px-4 py-3 flex items-center justify-center gap-3 hover:bg-white/5 transition">
                      <Trash2 className="h-5 w-5 text-white" />
                      <span className="text-white font-semibold">Delete</span>
                    </div>
                  </button>
                </div>
              </li>
            </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
