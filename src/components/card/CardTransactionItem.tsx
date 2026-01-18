"use client";

/**
 * CardTransactionItem Component
 * Individual transaction row display
 */
import { cn } from "@/lib/utils";
import { formatCardCurrency, getCategoryIcon } from "@/lib/card/cardUtils";
import type { CardTransaction } from "@/types/card";
import {
    Phone,
    Utensils,
    Building,
    ShoppingCart,
    Fuel,
    Car,
    Film,
    ShoppingBag,
    CreditCard,
} from "lucide-react";

interface CardTransactionItemProps {
    transaction: CardTransaction;
    className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
    phone: <Phone className="w-5 h-5" />,
    utensils: <Utensils className="w-5 h-5" />,
    building: <Building className="w-5 h-5" />,
    "shopping-cart": <ShoppingCart className="w-5 h-5" />,
    fuel: <Fuel className="w-5 h-5" />,
    car: <Car className="w-5 h-5" />,
    film: <Film className="w-5 h-5" />,
    "shopping-bag": <ShoppingBag className="w-5 h-5" />,
    "credit-card": <CreditCard className="w-5 h-5" />,
};

export function CardTransactionItem({ transaction, className }: CardTransactionItemProps) {
    const iconKey = getCategoryIcon(transaction.merchantCategory);
    const icon = iconMap[iconKey] || iconMap["credit-card"];

    return (
        <div
            className={cn(
                "flex items-center gap-4 p-4 rounded-xl",
                "bg-gray-800/30 hover:bg-gray-800/50 transition-colors",
                className
            )}
        >
            {/* Merchant Icon */}
            <div
                data-testid={`merchant-icon-${transaction.id}`}
                className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-300"
            >
                {transaction.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={transaction.iconUrl}
                        alt={transaction.merchantName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    icon
                )}
            </div>

            {/* Merchant Info */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                    {transaction.merchantName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                    {transaction.merchantCategory}
                </div>
            </div>

            {/* Amount & Cashback */}
            <div className="text-right">
                <div className="font-medium text-white">
                    {formatCardCurrency(transaction.amount)}
                </div>
                {transaction.cashbackAmount && transaction.cashbackAmount > 0 && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                            <span className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white font-bold">
                                $
                            </span>
                            {transaction.cashbackAmount.toFixed(2)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CardTransactionItem;
