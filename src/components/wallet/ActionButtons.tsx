"use client";

import { ArrowDownToLine, ArrowRightLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

function ActionButton({ icon, label, onClick, disabled }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
        >
            <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${disabled
                        ? "bg-white/5 border border-white/10"
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
            >
                {icon}
            </div>
            <span className="text-white text-sm font-medium">{label}</span>
        </button>
    );
}

export default function ActionButtons() {
    const router = useRouter();

    return (
        <div className="px-4">
            <div className="flex justify-center gap-8 py-4">
                <ActionButton
                    icon={<ArrowDownToLine className="w-6 h-6 text-amber-500" />}
                    label="Cash In"
                    onClick={() => router.push("/wallet/cash-in")}
                />
                <ActionButton
                    icon={<Send className="w-6 h-6 text-purple-400" />}
                    label="Send"
                    onClick={() => { }}
                    disabled
                />
                <ActionButton
                    icon={<ArrowRightLeft className="w-6 h-6 text-blue-400" />}
                    label="Convert"
                    onClick={() => { }}
                    disabled
                />
            </div>
        </div>
    );
}
