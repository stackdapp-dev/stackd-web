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
import type { CardDetails } from "@/types/card";

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
        <div className="min-h-screen pb-24">
            <div className="max-w-md mx-auto px-4 pt-6">
                {/* BETA Badge */}
                <div className="flex justify-start mb-4">
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
                        transactions={[]}
                        onViewAll={handleViewAllTransactions}
                    />
                </div>

                {/* Add to Wallet */}
                <AddToWalletButton onAddToWallet={handleAddToWallet} />
            </div>
        </div>
    );
}
