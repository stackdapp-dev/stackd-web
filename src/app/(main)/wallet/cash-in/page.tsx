"use client";

import PageHeader from "@/components/common/PageHeader";
import WalletAddressWithCopyButton from "@/components/common/WalletAddressWithCopyButton";
import Card from "@/components/ui/card";
import { useWeb3 } from "@/providers/Web3Provider";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";

import { useDeveloperMode } from "@/providers/developerMode";
import { useHasXautPosition } from "@/hooks/useHasXautPosition";

type TabType = "crypto" | "otc";
type NetworkType = "ethereum" | "arbitrum";

export default function CashInPage() {
    const { walletClient, activeWalletAddress } = useWeb3();
    const [activeTab, setActiveTab] = useState<TabType>("crypto");
    const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("ethereum");

    // Developer mode and XAUT position detection for conditional hiding
    const { developerMode } = useDeveloperMode();
    const { hasXautPosition } = useHasXautPosition();
    // Show XAUT if developerMode=false OR hasXautPosition=true
    // Hide XAUT if developerMode=true AND hasXautPosition=false
    const shouldShowXaut = !developerMode || hasXautPosition;

    // Conditional warning text based on network and shouldShowXaut
    const warningText = selectedNetwork === "ethereum"
        ? "Send only XAUT, USDT and ETH to this address. Sending any other asset may result in permanent loss."
        : shouldShowXaut
            ? "Send only WBTC, ETH, XAUT and USDT to this address. Sending any other asset may result in permanent loss."
            : "Send only WBTC, ETH and USDT to this address. Sending any other asset may result in permanent loss.";

    const address = walletClient?.account?.address || activeWalletAddress;

    const qrNode = React.useMemo(
        () => (
            <QRCodeSVG
                value={address || ""}
                size={220}
                marginSize={1}
                fgColor="#000000"
                bgColor="#ffffff"
            />
        ),
        [address]
    );

    return (
        <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
            <PageHeader title="Cash In" />

            {/* Tab Switcher */}
            <div className="flex gap-3">
                <button
                    onClick={() => setActiveTab("crypto")}
                    className={`flex-1 py-3 px-6 rounded-full font-medium transition-all ${activeTab === "crypto"
                        ? "bg-amber-500 text-black"
                        : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                        }`}
                >
                    Crypto/Stablecoins
                </button>
                <button
                    onClick={() => setActiveTab("otc")}
                    className={`flex-1 py-3 px-6 rounded-full font-medium transition-all ${activeTab === "otc"
                        ? "bg-amber-500 text-black"
                        : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                        }`}
                >
                    OTC
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "crypto" ? (
                <div className="flex flex-col gap-6">
                    {/* QR Code Card */}
                    <Card appearance="glassDark" padding="default">
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-white/60 text-sm">Deposit WBTC or stablecoins</p>
                            <div className="bg-white rounded-xl p-2">{qrNode}</div>
                        </div>
                    </Card>

                    {/* Wallet Address */}
                    <div className="flex flex-col gap-2">
                        <p className="text-white/40 text-xs uppercase tracking-wider text-center">
                            Wallet Address
                        </p>
                        <WalletAddressWithCopyButton walletAddress={address || ""} />
                    </div>

                    {/* Warning */}
                    <div className="flex gap-3 p-4 rounded-xl bg-white/5">
                        <span className="text-amber-500 text-lg">●</span>
                        <p className="text-white/60 text-sm">
                            {warningText}
                        </p>
                    </div>

                    {/* Network Info */}
                    <Card appearance="glassDark" padding="default">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-white/40 text-xs uppercase tracking-wider">
                                    Network
                                </p>
                                <select
                                    value={selectedNetwork}
                                    onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
                                    className="bg-transparent text-white font-medium mt-1 outline-none cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_center]"
                                >
                                    <option value="ethereum" className="bg-zinc-900 text-white">Ethereum ERC20</option>
                                    <option value="arbitrum" className="bg-zinc-900 text-white">Arbitrum One</option>
                                </select>
                            </div>
                            <div className="text-right">
                                <p className="text-white/40 text-xs uppercase tracking-wider">
                                    Fee
                                </p>
                                <p className="text-green-400 font-medium">FREE</p>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <Card appearance="glassDark" padding="default">
                    <div className="py-12 flex items-center justify-center">
                        <p className="text-white/50 text-lg">Coming Soon</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
