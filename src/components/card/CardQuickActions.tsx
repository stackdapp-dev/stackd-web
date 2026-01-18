"use client";

/**
 * CardQuickActions Component
 * Quick action buttons for card management
 */
import { cn } from "@/lib/utils";
import { Eye, Grid3X3, Lock, Unlock, FileText, Loader2 } from "lucide-react";

interface CardQuickActionsProps {
    isCardLocked?: boolean;
    actionsDisabled?: boolean;
    isLocking?: boolean;
    onShowDetails?: () => void;
    onCardPin?: () => void;
    onLock?: () => void;
    onChangeLimit?: () => void;
    className?: string;
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    testId?: string;
}

function ActionButton({ icon, label, onClick, disabled, loading, testId }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            aria-label={label}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4",
                "bg-gray-800/50 hover:bg-gray-700/50 rounded-xl",
                "border border-gray-700/50 transition-all",
                "min-w-[80px]",
                disabled && "opacity-50 cursor-not-allowed",
                loading && "cursor-wait"
            )}
        >
            <div className="w-6 h-6 text-gray-300" data-testid={testId}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
            </div>
            <span className="text-xs text-gray-400">{label}</span>
        </button>
    );
}

export function CardQuickActions({
    isCardLocked = false,
    actionsDisabled = false,
    isLocking = false,
    onShowDetails,
    onCardPin,
    onLock,
    onChangeLimit,
    className,
}: CardQuickActionsProps) {
    return (
        <div className={cn("flex items-center justify-between gap-2", className)}>
            <ActionButton
                icon={<Eye className="w-6 h-6" />}
                label="Show details"
                onClick={onShowDetails}
                disabled={actionsDisabled}
                testId="icon-show-details"
            />
            <ActionButton
                icon={<Grid3X3 className="w-6 h-6" />}
                label="Card PIN"
                onClick={onCardPin}
                disabled={actionsDisabled}
                testId="icon-card-pin"
            />
            <ActionButton
                icon={isCardLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                label={isCardLocked ? "Unlock" : "Lock"}
                onClick={onLock}
                loading={isLocking}
                testId={isLocking ? "lock-loading" : "icon-lock"}
            />
            <ActionButton
                icon={<FileText className="w-6 h-6" />}
                label="Change limit"
                onClick={onChangeLimit}
                disabled={actionsDisabled}
                testId="icon-change-limit"
            />
        </div>
    );
}

export default CardQuickActions;
