"use client";

import PageHeader from "@/components/common/PageHeader";
import TokenIcon from "@/components/common/TokenIcon";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletBalanceContext } from "@/app/(main)/wallet/layout";
import { formatAmount } from "@/lib/utils";
import { TOKEN_METADATA } from "@/constants/Tokens";
import { useVeloraSwap } from "@/hooks/useVeloraSwap";
import { ArrowDownUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { parseUnits } from "viem";
import { toast } from "react-toastify";

// Available tokens for swapping
const SWAP_TOKENS = ["WBTC", "USDT"] as const;
type SwapToken = (typeof SWAP_TOKENS)[number];

// Token display names
const TOKEN_NAMES: Record<SwapToken, string> = {
    WBTC: "Wrapped Bitcoin",
    USDT: "Tether USD",
};

// Token decimals
const TOKEN_DECIMALS: Record<SwapToken, number> = {
    WBTC: 8,
    USDT: 6,
};

export default function ConvertPage() {
    const router = useRouter();
    const { assets, refetchBalances } = useWalletBalanceContext();
    const {
        quote,
        isLoading,
        error,
        getQuote,
        executeSwap,
        getDestAmount,
    } = useVeloraSwap();

    const [fromToken, setFromToken] = useState<SwapToken>("WBTC");
    const [toToken, setToToken] = useState<SwapToken>("USDT");
    const [amount, setAmount] = useState("");
    const [isSwapping, setIsSwapping] = useState(false);

    // Get token balances
    const fromBalance = useMemo(() => {
        const asset = assets.find((a) => a.symbol === fromToken);
        return asset?.amount || 0;
    }, [assets, fromToken]);

    const toBalance = useMemo(() => {
        const asset = assets.find((a) => a.symbol === toToken);
        return asset?.amount || 0;
    }, [assets, toToken]);

    // Calculate output amount from quote
    const outputAmount = useMemo(() => {
        if (!quote) return "0.00";
        const dest = getDestAmount(TOKEN_DECIMALS[toToken]);
        return dest || "0.00";
    }, [quote, getDestAmount, toToken]);

    // Calculate exchange rate
    const exchangeRate = useMemo(() => {
        if (!quote) return null;
        const priceData = quote.delta || quote.market;
        if (!priceData) return null;

        const srcAmount = parseFloat(priceData.srcAmount) / Math.pow(10, TOKEN_DECIMALS[fromToken]);
        const destAmount = parseFloat(priceData.destAmount) / Math.pow(10, TOKEN_DECIMALS[toToken]);

        if (srcAmount === 0) return null;

        const rate = destAmount / srcAmount;
        return `1 ${fromToken} = ${formatAmount(rate)} ${toToken}`;
    }, [quote, fromToken, toToken]);

    // Fetch quote when amount changes
    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) === 0) return;

            const tokenMeta = TOKEN_METADATA[fromToken];
            if (!tokenMeta) return;

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
        if (!quote || isSwapping) return;

        setIsSwapping(true);
        try {
            const result = await executeSwap();

            if (result.success) {
                toast.success(`Successfully converted ${amount} ${fromToken} to ${toToken}!`);
                await refetchBalances();
                router.push("/wallet");
            } else {
                toast.error(result.error || "Conversion failed");
            }
        } catch (err) {
            console.error("Convert failed:", err);
            toast.error("Conversion failed. Please try again.");
        } finally {
            setIsSwapping(false);
        }
    };

    // Validation
    const parsedAmount = parseFloat(amount) || 0;
    const canConvert = parsedAmount > 0 && parsedAmount <= fromBalance && quote && !isSwapping;

    return (
        <div className="w-full max-w-xl mx-auto p-6 flex flex-col gap-6 pt-[calc(80px+env(safe-area-inset-top)+0.5rem)]">
            <PageHeader title="Convert" />

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
                                <p className="text-white font-semibold">{fromToken}</p>
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
                                <p className="text-white font-semibold">{toToken}</p>
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

            {/* Exchange Rate & Fee */}
            <Card appearance="glassDark" padding="default">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Exchange Rate</span>
                        <span className="text-white font-medium">
                            {exchangeRate || "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/60">Fee</span>
                        <span className="text-white font-medium">0.3%</span>
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
