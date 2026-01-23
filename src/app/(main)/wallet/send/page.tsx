"use client";

import PageHeader from "@/components/common/PageHeader";
import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/providers/Web3Provider";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { formatAmount } from "@/lib/utils";
import { TOKEN_METADATA, ETHEREUM_TOKEN_METADATA } from "@/constants/Tokens";
import { ChevronDown, ScanLine, AlertTriangle } from "lucide-react";
import { QRScannerModal } from "@/components/wallet";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { parseUnits, isAddress, encodeFunctionData } from "viem";
import { arbitrum, mainnet } from "viem/chains";
import { toast } from "react-toastify";

// Available tokens for sending
const SENDABLE_TOKENS = ["WBTC", "USDT", "XAUT"] as const;
type SendableToken = (typeof SENDABLE_TOKENS)[number];

// Network types for USDT multi-chain support
type UsdtNetwork = "arbitrum" | "ethereum";

// Token display names
const TOKEN_NAMES: Record<SendableToken, string> = {
    WBTC: "Wrapped Bitcoin",
    USDT: "Tether USD",
    XAUT: "Tether Gold",
};

// Network display names
const NETWORK_NAMES: Record<UsdtNetwork, string> = {
    arbitrum: "Arbitrum One",
    ethereum: "Ethereum",
};

// Token chain mapping - which chain each token lives on (default for non-USDT)
const TOKEN_CHAINS: Record<SendableToken, typeof arbitrum | typeof mainnet> = {
    WBTC: arbitrum,
    USDT: arbitrum, // Default, but can be overridden for multi-chain
    XAUT: mainnet,
};

// Chain mapping for USDT network selection
const USDT_CHAIN_MAP: Record<UsdtNetwork, typeof arbitrum | typeof mainnet> = {
    arbitrum: arbitrum,
    ethereum: mainnet,
};

export default function SendPage() {
    const router = useRouter();
    const { sendSponsoredTransaction, isSendingTransaction, switchToNetwork, isExternalWallet } = useWeb3();
    const { assets, refetchBalances, chainBalances } = useWalletBalanceContext();

    const [selectedToken, setSelectedToken] = useState<SendableToken>("USDT");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [showTokenDropdown, setShowTokenDropdown] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
    const [networkSwitchError, setNetworkSwitchError] = useState<string | null>(null);
    const [selectedUsdtNetwork, setSelectedUsdtNetwork] = useState<UsdtNetwork>("arbitrum");
    const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
    const networkDropdownRef = useRef<HTMLDivElement>(null);

    // Close network dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
                setShowNetworkDropdown(false);
            }
        }

        if (showNetworkDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showNetworkDropdown]);

    // Calculate USDT balances per chain
    const usdtBalances = useMemo(() => {
        const arbitrumBalance = chainBalances?.arbitrum?.USDT || 0;
        const ethereumBalance = chainBalances?.ethereum?.USDT || 0;
        const hasMultipleChains = arbitrumBalance > 0 && ethereumBalance > 0;

        return {
            arbitrum: arbitrumBalance,
            ethereum: ethereumBalance,
            total: arbitrumBalance + ethereumBalance,
            hasMultipleChains,
        };
    }, [chainBalances]);

    // Auto-select USDT network based on which chain has balance
    useEffect(() => {
        if (selectedToken !== "USDT") return;

        // If only one chain has balance, select that chain
        if (usdtBalances.arbitrum > 0 && usdtBalances.ethereum === 0) {
            setSelectedUsdtNetwork("arbitrum");
        } else if (usdtBalances.ethereum > 0 && usdtBalances.arbitrum === 0) {
            setSelectedUsdtNetwork("ethereum");
        }
        // If both have balance, keep current selection (default arbitrum)
    }, [selectedToken, usdtBalances]);

    // Auto-select token with balance (prefer USDT, then WBTC, then XAUT)
    useEffect(() => {
        if (hasInitialized || assets.length === 0) return;

        const usdtBalance = assets.find((a) => a.symbol === "USDT")?.amount || 0;
        const wbtcBalance = assets.find((a) => a.symbol === "WBTC")?.amount || 0;
        const xautBalance = assets.find((a) => a.symbol === "XAUT")?.amount || 0;

        if (usdtBalance > 0) {
            setSelectedToken("USDT");
        } else if (wbtcBalance > 0) {
            setSelectedToken("WBTC");
        } else if (xautBalance > 0) {
            setSelectedToken("XAUT");
        }
        // Default is already USDT
        setHasInitialized(true);
    }, [assets, hasInitialized]);

    // Get the active chain based on token and USDT network selection
    const activeChain = useMemo(() => {
        if (selectedToken === "USDT") {
            return USDT_CHAIN_MAP[selectedUsdtNetwork];
        }
        return TOKEN_CHAINS[selectedToken];
    }, [selectedToken, selectedUsdtNetwork]);

    // Auto-switch network when selected token or USDT network changes
    useEffect(() => {
        const switchNetwork = async () => {
            setIsSwitchingNetwork(true);
            setNetworkSwitchError(null);
            try {
                await switchToNetwork(activeChain.id);
            } catch (error) {
                // Network switch failed or was rejected
                const errorMessage = error instanceof Error ? error.message : "Network switch failed";
                console.log("[SEND] Network switch failed:", error);
                setNetworkSwitchError(errorMessage);
            } finally {
                setIsSwitchingNetwork(false);
            }
        };

        switchNetwork();
    }, [activeChain, switchToNetwork]);

    // Manual network switch handler for retry button
    const handleManualNetworkSwitch = async () => {
        setIsSwitchingNetwork(true);
        setNetworkSwitchError(null);
        try {
            await switchToNetwork(activeChain.id);
            toast.success(`Switched to ${activeChain.name}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Network switch failed";
            console.log("[SEND] Manual network switch failed:", error);
            setNetworkSwitchError(errorMessage);
        } finally {
            setIsSwitchingNetwork(false);
        }
    };

    // Get token balance - for USDT, use per-chain balance based on selected network
    const tokenBalance = useMemo(() => {
        if (selectedToken === "USDT") {
            return usdtBalances[selectedUsdtNetwork];
        }
        const asset = assets.find((a) => a.symbol === selectedToken);
        return asset?.amount || 0;
    }, [assets, selectedToken, selectedUsdtNetwork, usdtBalances]);

    // Get token metadata - for USDT on Ethereum, use Ethereum token metadata
    const tokenMeta = useMemo(() => {
        if (selectedToken === "USDT" && selectedUsdtNetwork === "ethereum") {
            return ETHEREUM_TOKEN_METADATA.USDT;
        }
        return TOKEN_METADATA[selectedToken];
    }, [selectedToken, selectedUsdtNetwork]);

    // Validation
    const isValidAddress = recipientAddress ? isAddress(recipientAddress) : false;
    const parsedAmount = parseFloat(amount) || 0;
    const isValidAmount = parsedAmount > 0 && parsedAmount <= tokenBalance;
    // For external wallets, block send if there's a network switch error
    const hasNetworkIssue = isExternalWallet && networkSwitchError;
    const canSend = isValidAddress && isValidAmount && !isSendingTransaction && !isSwitchingNetwork && !hasNetworkIssue;

    // ERC20 transfer function ABI
    const ERC20_TRANSFER_ABI = [
        {
            inputs: [
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
        },
    ] as const;

    const handleMaxPress = () => {
        setAmount(tokenBalance.toString());
    };

    const handleSend = async () => {
        if (!canSend || !tokenMeta) return;

        try {
            const amountInWei = parseUnits(amount, tokenMeta.decimals);

            // Encode ERC20 transfer call
            const data = encodeFunctionData({
                abi: ERC20_TRANSFER_ABI,
                functionName: "transfer",
                args: [recipientAddress as `0x${string}`, amountInWei],
            });

            const result = await sendSponsoredTransaction({
                to: tokenMeta.address as `0x${string}`,
                data,
                chainId: activeChain.id,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success(`Successfully sent ${amount} ${selectedToken}!`);
            await refetchBalances();
            router.push("/wallet");
        } catch (error) {
            console.error("Send failed:", error);
            toast.error("Transaction failed. Please try again.");
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
            <PageHeader title="Send" />

            {/* Asset Selector */}
            <div>
                <p className="text-white/60 text-sm mb-2">Asset</p>
                <div className="relative">
                    <Card
                        appearance="glassDark"
                        padding="default"
                        className="cursor-pointer"
                        onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TokenIcon symbol={selectedToken} width={40} height={40} />
                                <div>
                                    <p className="text-white font-semibold">{selectedToken}</p>
                                    <p className="text-white/50 text-sm">
                                        {TOKEN_NAMES[selectedToken]}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">
                                    Balance: {formatAmount(tokenBalance)}
                                </span>
                                <ChevronDown className="w-5 h-5 text-white/40" />
                            </div>
                        </div>
                    </Card>

                    {/* Token Dropdown */}
                    {showTokenDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-10">
                            <Card appearance="glassDark" padding="none">
                                {SENDABLE_TOKENS.map((token) => {
                                    const balance =
                                        assets.find((a) => a.symbol === token)?.amount || 0;
                                    return (
                                        <button
                                            key={token}
                                            onClick={() => {
                                                setSelectedToken(token);
                                                setShowTokenDropdown(false);
                                                setAmount("");
                                            }}
                                            className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${token === selectedToken ? "bg-white/5" : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <TokenIcon symbol={token} width={32} height={32} />
                                                <span className="text-white font-medium">{token}</span>
                                            </div>
                                            <span className="text-white/60 text-sm">
                                                {formatAmount(balance)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Recipient Address */}
            <div>
                <p className="text-white/60 text-sm mb-2">Recipient Address</p>
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="0x..."
                            className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30"
                        />
                        <button
                            type="button"
                            onClick={() => setShowQRScanner(true)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            aria-label="Scan QR code"
                        >
                            <ScanLine className="w-5 h-5" />
                        </button>
                    </div>
                </Card>
                {recipientAddress && !isValidAddress && (
                    <p className="text-red-400 text-sm mt-1">Invalid address</p>
                )}
            </div>

            {/* Amount */}
            <div>
                <p className="text-white/60 text-sm mb-2">Amount</p>
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            className="flex-1 bg-transparent text-white text-2xl font-semibold outline-none placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                            onClick={handleMaxPress}
                            className="text-amber-500 font-medium hover:text-amber-400 transition-colors"
                        >
                            MAX
                        </button>
                    </div>
                </Card>
                {parsedAmount > tokenBalance && (
                    <p className="text-red-400 text-sm mt-1">Insufficient balance</p>
                )}
            </div>

            {/* Network & Fee Info */}
            <Card appearance="glassDark" padding="default">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Network</span>
                        {/* Show dropdown for USDT when multi-chain balances exist */}
                        {selectedToken === "USDT" && usdtBalances.hasMultipleChains ? (
                            <div className="relative" ref={networkDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                                    className="flex items-center gap-2 text-white font-medium hover:text-amber-400 transition-colors"
                                >
                                    <span>{NETWORK_NAMES[selectedUsdtNetwork]}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showNetworkDropdown ? "rotate-180" : ""}`} />
                                </button>

                                {/* Network Dropdown */}
                                {showNetworkDropdown && (
                                    <div className="absolute top-full right-0 mt-2 z-20 min-w-[180px]">
                                        <Card appearance="dropdown" padding="none">
                                            {(["arbitrum", "ethereum"] as const).map((network) => {
                                                const balance = usdtBalances[network];
                                                if (balance === 0) return null;
                                                return (
                                                    <button
                                                        key={network}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedUsdtNetwork(network);
                                                            setShowNetworkDropdown(false);
                                                            setAmount(""); // Clear amount when switching networks
                                                        }}
                                                        className={`w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left ${network === selectedUsdtNetwork ? "bg-white/5" : ""
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${network === "arbitrum"
                                                                ? "bg-blue-500/20"
                                                                : "bg-purple-500/20"
                                                                }`}>
                                                                <span className={`text-[10px] font-bold ${network === "arbitrum"
                                                                    ? "text-blue-400"
                                                                    : "text-purple-400"
                                                                    }`}>
                                                                    {network === "arbitrum" ? "A" : "E"}
                                                                </span>
                                                            </div>
                                                            <span className="text-white text-sm">{NETWORK_NAMES[network]}</span>
                                                        </div>
                                                        <span className="text-white/60 text-xs">
                                                            {formatAmount(balance)} USDT
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </Card>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-white font-medium">{activeChain.name}</span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Estimated Fee</span>
                        <div className="flex items-center gap-2">
                            <span className="text-green-400 font-medium">FREE</span>
                            <span className="text-white/40 line-through text-sm">~$0.50</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Network Switch Warning for External Wallets */}
            {networkSwitchError && isExternalWallet && (
                <Card appearance="glassDark" padding="default" className="border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-amber-500 font-medium text-sm">Network Switch Required</p>
                            <p className="text-white/60 text-sm mt-1">
                                Please switch your wallet to {activeChain.name} to send {selectedToken}.
                            </p>
                            <Button
                                onClick={handleManualNetworkSwitch}
                                disabled={isSwitchingNetwork}
                                size="sm"
                                variant="outline"
                                className="mt-3 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                            >
                                {isSwitchingNetwork ? "Switching..." : `Switch to ${activeChain.name}`}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Send Button */}
            <Button
                onClick={handleSend}
                disabled={!canSend}
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSwitchingNetwork
                    ? "Switching Network..."
                    : isSendingTransaction
                        ? "Sending..."
                        : `Send ${selectedToken}`}
            </Button>

            {/* QR Scanner Modal */}
            <QRScannerModal
                open={showQRScanner}
                onOpenChange={setShowQRScanner}
                onScan={(address) => setRecipientAddress(address)}
            />
        </div>
    );
}
