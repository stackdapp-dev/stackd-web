"use client";

import PageHeader from "@/components/common/PageHeader";
import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletBalanceContext } from "@/hooks/useWalletBalanceContext";
import { formatAmount } from "@/lib/utils";
import { useGaslessSwap } from "@/hooks/useGaslessSwap";
import { ArrowDownUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { parseUnits } from "viem";
import { toast } from "react-toastify";

type NetworkType = "ethereum" | "arbitrum";

// Available tokens per network
const NETWORK_TOKENS: Record<NetworkType, string[]> = {
    arbitrum: ["WBTC", "ETH", "USDT"],
    ethereum: ["XAUT", "USDT", "ETH"],
};

const NETWORK_CHAIN_IDS: Record<NetworkType, number> = {
    arbitrum: 42161,
    ethereum: 1,
};

// Token display names
const TOKEN_NAMES: Record<string, string> = {
    WBTC: "Wrapped Bitcoin",
    USDT: "Tether USD",
    ETH: "Ethereum",
    XAUT: "Tether Gold",
};

// Token decimals
const TOKEN_DECIMALS: Record<string, number> = {
    WBTC: 8,
    USDT: 6,
    ETH: 18,
    XAUT: 6,
};

export default function ConvertPage() {
    const router = useRouter();
    const { assets, refetchBalances, chainBalances } = useWalletBalanceContext();

    const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("arbitrum");
    const [maxSlippage, setMaxSlippage] = useState("1.0");
    const chainId = NETWORK_CHAIN_IDS[selectedNetwork];
    const availableTokens = NETWORK_TOKENS[selectedNetwork];

    const {
        quote,
        isLoading,
        error,
        getQuote,
        executeSwap,
        getDestAmount,
    } = useGaslessSwap(chainId, parseFloat(maxSlippage) || 1.0);

    const [fromToken, setFromToken] = useState<string>(availableTokens[0]);
    const [toToken, setToToken] = useState<string>(availableTokens[1]);
    const [amount, setAmount] = useState("");
    const [isSwapping, setIsSwapping] = useState(false);

    // Reset tokens when network changes
    useEffect(() => {
        const tokens = NETWORK_TOKENS[selectedNetwork];
        setFromToken(tokens[0]);
        setToToken(tokens[1]);
        setAmount("");
    }, [selectedNetwork]);

    // Get chain-specific token balances
    const getChainBalance = useCallback((token: string): number => {
        const balances = selectedNetwork === "arbitrum" ? chainBalances.arbitrum : chainBalances.ethereum;
        return balances[token] || 0;
    }, [chainBalances, selectedNetwork]);

    const fromBalance = useMemo(() => getChainBalance(fromToken), [getChainBalance, fromToken]);
    const toBalance = useMemo(() => getChainBalance(toToken), [getChainBalance, toToken]);

    // Calculate output amount from quote
    const outputAmount = useMemo(() => {
        if (!quote) return "0.00";
        const dest = getDestAmount(TOKEN_DECIMALS[toToken]);
        return dest || "0.00";
    }, [quote, getDestAmount, toToken]);

    // Calculate exchange rate
    const exchangeRate = useMemo(() => {
        if (!quote) return null;

        const srcAmount = parseFloat(quote.sellAmount) / Math.pow(10, TOKEN_DECIMALS[fromToken]);
        const destAmount = parseFloat(quote.buyAmount) / Math.pow(10, TOKEN_DECIMALS[toToken]);

        if (srcAmount === 0) return null;

        const rate = destAmount / srcAmount;
        return `1 ${fromToken} = ${formatAmount(rate)} ${toToken}`;
    }, [quote, fromToken, toToken]);

    // Fetch quote when amount changes
    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) === 0) return;

            const amountInWei = parseUnits(amount, TOKEN_DECIMALS[fromToken]).toString();
            await getQuote(fromToken, toToken, amountInWei);
        };

        const debounce = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounce);
    }, [amount, fromToken, toToken, getQuote]);

    // Handle swap tokens
    const handleSwapTokens = useCallback(() => {
        setFromToken(toToken);
        setToToken(fromToken);
        setAmount("");
    }, [fromToken, toToken]);

    // Handle max press
    const handleMaxPress = useCallback(() => {
        setAmount(fromBalance.toString());
    }, [fromBalance]);

    // Handle convert
    const handleConvert = async () => {
        console.log("[Convert] Button clicked, canConvert:", canConvert, "quote:", quote, "isSwapping:", isSwapping);

        if (!quote || isSwapping) {
            console.log("[Convert] Early return - no quote or already swapping");
            return;
        }

        setIsSwapping(true);
        toast.info("Starting conversion...");

        try {
            console.log("[Convert] Executing swap...");
            const result = await executeSwap();
            console.log("[Convert] Swap result:", result);

            if (result.success) {
                toast.success(`Successfully converted ${amount} ${fromToken} to ${toToken}!`);
                await refetchBalances();
                router.push("/wallet");
            } else {
                toast.error(result.error || "Conversion failed");
            }
        } catch (err) {
            console.error("[Convert] Convert failed:", err);
            toast.error("Conversion failed. Please try again.");
        } finally {
            setIsSwapping(false);
        }
    };

    // Validation
    const parsedAmount = parseFloat(amount) || 0;
    const canConvert = parsedAmount > 0 && parsedAmount <= fromBalance && quote && !isSwapping;

    return (
        <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
            <PageHeader title="Convert" />

            {/* Network Selector */}
            <Card appearance="glassDark" padding="default">
                <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">
                        Network
                    </p>
                    <select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
                        className="bg-transparent text-white font-medium mt-1 outline-none cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_center]"
                    >
                        <option value="arbitrum" className="bg-zinc-900 text-white">Arbitrum One</option>
                        <option value="ethereum" className="bg-zinc-900 text-white">Ethereum ERC20</option>
                    </select>
                </div>
            </Card>

            {/* From Token */}
            <div>
                <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-2">
                    From
                </p>
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <TokenIcon symbol={fromToken} width={40} height={40} />
                            <div>
                                <select
                                    value={fromToken}
                                    onChange={(e) => {
                                        const newFrom = e.target.value;
                                        setFromToken(newFrom);
                                        if (newFrom === toToken) {
                                            const other = availableTokens.find(t => t !== newFrom);
                                            if (other) setToToken(other);
                                        }
                                        setAmount("");
                                    }}
                                    className="bg-transparent text-white font-semibold outline-none cursor-pointer appearance-none pr-5 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_center]"
                                >
                                    {availableTokens.map(t => (
                                        <option key={t} value={t} className="bg-zinc-900 text-white">{t}</option>
                                    ))}
                                </select>
                                <p className="text-white/50 text-sm">{TOKEN_NAMES[fromToken]}</p>
                            </div>
                        </div>
                        <span className="text-white/60 text-sm">
                            Balance: {formatAmount(fromBalance)}
                        </span>
                    </div>
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
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2">
                <button
                    onClick={handleSwapTokens}
                    className="p-3 rounded-full border border-white/20 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                    <ArrowDownUp className="w-5 h-5 text-white/60" />
                </button>
            </div>

            {/* To Token */}
            <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
                    To
                </p>
                <Card appearance="glassDark" padding="default">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <TokenIcon symbol={toToken} width={40} height={40} />
                            <div>
                                <select
                                    value={toToken}
                                    onChange={(e) => {
                                        const newTo = e.target.value;
                                        setToToken(newTo);
                                        if (newTo === fromToken) {
                                            const other = availableTokens.find(t => t !== newTo);
                                            if (other) setFromToken(other);
                                        }
                                        setAmount("");
                                    }}
                                    className="bg-transparent text-white font-semibold outline-none cursor-pointer appearance-none pr-5 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_center]"
                                >
                                    {availableTokens.map(t => (
                                        <option key={t} value={t} className="bg-zinc-900 text-white">{t}</option>
                                    ))}
                                </select>
                                <p className="text-white/50 text-sm">{TOKEN_NAMES[toToken]}</p>
                            </div>
                        </div>
                        <span className="text-white/60 text-sm">
                            Balance: {formatAmount(toBalance)}
                        </span>
                    </div>
                    <div className="text-white/40 text-2xl font-semibold">
                        {isLoading ? "Loading..." : outputAmount}
                    </div>
                </Card>
            </div>

            {/* Exchange Rate, Slippage & Fee */}
            <Card appearance="glassDark" padding="default">
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Exchange Rate</span>
                        <span className="text-white font-medium">
                            {exchangeRate || "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Max Slippage</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={maxSlippage}
                                onChange={(e) => setMaxSlippage(e.target.value)}
                                min="0.1"
                                max="50"
                                step="0.1"
                                className="w-14 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white text-right text-sm font-medium outline-none focus:border-amber-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-white/60 text-sm">%</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Fee</span>
                        <span className="font-medium">
                            <span className="text-white/40 line-through mr-2">0.3%</span>
                            <span className="text-green-400">FREE</span>
                        </span>
                    </div>
                </div>
            </Card>

            {/* Error Display */}
            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Convert Button */}
            <Button
                onClick={handleConvert}
                disabled={!canConvert}
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSwapping ? "Converting..." : "Convert"}
            </Button>
        </div>
    );
}
