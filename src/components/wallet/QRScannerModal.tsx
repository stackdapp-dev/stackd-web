"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isAddress } from "viem";

interface QRScannerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (address: string) => void;
}

export default function QRScannerModal({
    open,
    onOpenChange,
    onScan,
}: QRScannerModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) { // Html5QrcodeScannerState.SCANNING
                    await scannerRef.current.stop();
                }
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    }, []);

    const startScanner = useCallback(async () => {
        if (!containerRef.current || scannerRef.current) return;

        setError(null);
        setIsScanning(true);

        try {
            const scanner = new Html5Qrcode("qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    // Extract address from QR code
                    // Handle formats like "ethereum:0x..." or just "0x..."
                    let address = decodedText;

                    // Check for ethereum: URI format
                    if (decodedText.toLowerCase().startsWith("ethereum:")) {
                        address = decodedText.slice(9).split("@")[0].split("?")[0];
                    }

                    // Validate it's a valid Ethereum address
                    if (isAddress(address)) {
                        stopScanner();
                        onScan(address);
                        onOpenChange(false);
                    } else {
                        setError("Invalid wallet address in QR code");
                    }
                },
                () => {
                    // QR code detection in progress (no valid QR found yet)
                }
            );
        } catch (err) {
            console.error("Error starting scanner:", err);
            setIsScanning(false);
            if (err instanceof Error) {
                if (err.message.includes("Permission denied") || err.message.includes("NotAllowedError")) {
                    setError("Camera access denied. Please allow camera access to scan QR codes.");
                } else if (err.message.includes("NotFoundError")) {
                    setError("No camera found on this device.");
                } else {
                    setError("Failed to start camera. Please try again.");
                }
            } else {
                setError("Failed to start camera. Please try again.");
            }
        }
    }, [onScan, onOpenChange, stopScanner]);

    useEffect(() => {
        if (open) {
            // Small delay to ensure the DOM element is rendered
            const timer = setTimeout(() => {
                startScanner();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            stopScanner();
        }
    }, [open, startScanner, stopScanner]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [stopScanner]);

    const handleClose = () => {
        stopScanner();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-[#0a0a0f] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-white">Scan QR Code</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Scan a wallet address QR code to autofill the recipient field.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div
                        ref={containerRef}
                        className="relative w-full max-w-[300px] aspect-square bg-black/50 rounded-xl overflow-hidden"
                    >
                        <div id="qr-reader" className="w-full h-full" />

                        {!isScanning && !error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-pulse text-white/40 text-sm">
                                    Starting camera...
                                </div>
                            </div>
                        )}

                        {isScanning && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Scanner overlay corners */}
                                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-amber-500" />
                                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-amber-500" />
                                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-amber-500" />
                                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-amber-500" />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center px-4">
                            {error}
                        </div>
                    )}

                    {error && (
                        <Button
                            onClick={() => {
                                setError(null);
                                startScanner();
                            }}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            Try Again
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
