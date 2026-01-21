import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";
import BetaBadge from "@/components/ui/BetaBadge";

export default function ReferralsPage() {
    return (
        <div className="w-full max-w-xl mx-auto px-4 md:px-6 py-6 pb-24 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
            {/* BETA Badge */}
            <div className="flex justify-center mb-4">
                <BetaBadge />
            </div>

            <div className="pb-6">
                <h1 className="text-white text-2xl font-medium mb-2">Rewards</h1>
                <p className="text-white/60">Invite friends and earn passive income.</p>
            </div>

            <ReferralDashboard />
        </div>
    );
}
