"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COLLATERAL_OPTIONS, CollateralOption } from "@/types/loans";
import { showInfoToast } from "@/components/ui/custom-toast";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewLoanModal({ isOpen, onClose }: NewLoanModalProps) {
  const router = useRouter();
  const { assets } = useWalletBalanceContext();
  const [selectedCollateral, setSelectedCollateral] = useState<CollateralOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCollateral(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  const handleContinue = () => {
    if (!selectedCollateral) return;

    // Check if user has balance of selected collateral
    const collateralAsset = assets.find((a) => a.symbol === selectedCollateral.symbol);
    const hasBalance = (collateralAsset?.amount || 0) > 0;

    if (hasBalance) {
      // Navigate to loan page for that collateral
      router.push(`/wallet/loan/${selectedCollateral.type.toLowerCase()}`);
      onClose();
    } else {
      // Show toast and redirect to deposit page
      const depositSymbol = selectedCollateral.type === "WBTC" ? "BTC" : "XAUT";
      showInfoToast(`${selectedCollateral.name} deposit required before borrowing`);
      setTimeout(() => {
        router.push("/wallet/cash-in");
        onClose();
      }, 2000);
    }
  };

  // Get icon letter based on collateral type
  const getIconLetter = (type: string) => {
    if (type === "WBTC") return "B";
    if (type === "XAUT") return "G";
    return type[0];
  };

  // Get icon background color
  const getIconBgColor = (type: string) => {
    if (type === "WBTC") return "bg-amber-500";
    if (type === "XAUT") return "bg-yellow-500";
    return "bg-gray-500";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 rounded-2xl p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-xl font-semibold">New Loan Position</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-white/60 text-sm mb-6">
          Select the collateral type you want to use to open a new loan position
        </p>

        {/* Collateral Type Label */}
        <label className="text-amber-500 text-xs font-semibold uppercase tracking-wider mb-2 block">
          Collateral Type
        </label>

        {/* Dropdown */}
        <div className="relative mb-6" ref={dropdownRef}>
          {/* Dropdown Trigger */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
          >
            {selectedCollateral ? (
              <div className="flex items-center gap-3">
                {/* Token Icon */}
                <div className={`w-10 h-10 rounded-full ${getIconBgColor(selectedCollateral.type)} flex items-center justify-center`}>
                  <span className="text-black font-bold text-lg">
                    {getIconLetter(selectedCollateral.type)}
                  </span>
                </div>
                {/* Token Info */}
                <div className="text-left">
                  <p className="text-white font-medium">{selectedCollateral.name}</p>
                  <p className="text-white/50 text-sm">{selectedCollateral.symbol}</p>
                </div>
              </div>
            ) : (
              <span className="text-white/40">Select collateral...</span>
            )}
            {isDropdownOpen ? (
              <ChevronUp className="w-5 h-5 text-white/50" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/50" />
            )}
          </button>

          {/* Dropdown Options */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl overflow-hidden z-10">
              {COLLATERAL_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    setSelectedCollateral(option);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Token Icon */}
                    <div className={`w-10 h-10 rounded-full ${getIconBgColor(option.type)} flex items-center justify-center`}>
                      <span className="text-black font-bold text-lg">
                        {getIconLetter(option.type)}
                      </span>
                    </div>
                    {/* Token Info */}
                    <div className="text-left">
                      <p className="text-white font-medium">{option.name}</p>
                      <p className="text-white/50 text-sm">{option.symbol}</p>
                    </div>
                  </div>
                  {/* Network Badge */}
                  <span className="text-white/40 text-sm bg-white/5 px-3 py-1 rounded-full">
                    {option.network}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 bg-white/10 hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedCollateral}
            className={`flex-1 ${selectedCollateral
                ? "bg-amber-500 hover:bg-amber-600 text-black"
                : "bg-white/10 text-white/40"
              }`}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
