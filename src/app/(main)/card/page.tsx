"use client";

/**
 * Card Page
 * Virtual Visa card management page
 */
import {
    VisaCard,
    CardQuickActions,
    CardBalance,
    CardTransactionList,
    AddToWalletButton,
} from "@/components/card";
import BetaBadge from "@/components/ui/BetaBadge";
import type { CardDetails, CardTransaction } from "@/types/card";

// Mock data for frontend-only display
const mockCard: CardDetails = {
    id: "card_001",
    lastFour: "1234",
    expiryMonth: "12",
    expiryYear: "2028",
    isLocked: false,
    balance: 0,
    limit: 10000,
    status: "active",
    cardholderName: "JOHN DOE",
};

const mockTransactions: CardTransaction[] = [
    {
        id: "tx_001",
        merchantName: "SMART APP",
        merchantCategory: "Telecommunication Services",
        amount: -34.48,
        cashbackAmount: 34.48,
        date: "2026-01-18T10:30:00Z",
        status: "completed",
    },
    {
        id: "tx_002",
        merchantName: "SPOTTED PIG CAFE",
        merchantCategory: "Eating Places, Restaurants",
        amount: -4.12,
        cashbackAmount: 4.12,
        date: "2026-01-17T14:22:00Z",
        status: "completed",
    },
    {
        id: "tx_003",
        merchantName: "Shangrila Canton Road",
        merchantCategory: "Hotels, Motels, and Resorts",
        amount: 0,
        cashbackAmount: 0,
        date: "2026-01-16T09:00:00Z",
        status: "pending",
    },
    {
        id: "tx_004",
        merchantName: "Spotted Pig Proscenium",
        merchantCategory: "Eating Places, Restaurants",
        amount: -4.12,
        cashbackAmount: 4.12,
        date: "2026-01-15T18:45:00Z",
        status: "completed",
    },
];

export default function CardPage() {
    // Placeholder handlers (no functionality)
    const handleShowDetails = () => {
        console.log("Show details clicked - coming soon");
    };

    const handleCardPin = () => {
        console.log("Card PIN clicked - coming soon");
    };

    const handleLock = () => {
        console.log("Lock clicked - coming soon");
    };

    const handleChangeLimit = () => {
        console.log("Change limit clicked - coming soon");
    };

    const handleSettings = () => {
        console.log("Settings clicked - coming soon");
    };

    const handleViewAllTransactions = () => {
        console.log("View all transactions clicked - coming soon");
    };

    const handleAddToWallet = () => {
        console.log("Add to wallet clicked - coming soon");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black pb-24">
            <div className="max-w-md mx-auto px-4 pt-6">
                {/* BETA Badge */}
                <div className="flex justify-center mb-4">
                    <BetaBadge />
                </div>

                {/* Header */}
                <h1 className="text-2xl font-bold text-white mb-4">Card</h1>

                {/* Visa Card */}
                <div className="mb-6">
                    <VisaCard
                        card={mockCard}
                        showComingSoon
                        onReveal={handleShowDetails}
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <CardQuickActions
                        isCardLocked={mockCard.isLocked}
                        onShowDetails={handleShowDetails}
                        onCardPin={handleCardPin}
                        onLock={handleLock}
                        onChangeLimit={handleChangeLimit}
                    />
                </div>

                {/* Card Balance */}
                <div className="mb-6">
                    <CardBalance
                        card={mockCard}
                        onSettings={handleSettings}
                    />
                </div>

                {/* Recent Transactions */}
                <div className="mb-6">
                    <CardTransactionList
                        transactions={mockTransactions}
                        onViewAll={handleViewAllTransactions}
                    />
                </div>

                {/* Add to Wallet */}
                <AddToWalletButton onAddToWallet={handleAddToWallet} />
            </div>
        </div>
    );
}
