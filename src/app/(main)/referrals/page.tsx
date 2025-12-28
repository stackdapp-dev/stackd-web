import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";

export default function ReferralsPage() {
    return (
        <div className="pb-24">
            <div className="pt-12 pb-6 px-4">
                <h1 className="text-white text-2xl font-medium mb-2">Rewards</h1>
                <p className="text-white/60">Invite friends and earn passive income.</p>
            </div>

            <div className="px-4">
                <ReferralDashboard />
            </div>
        </div>
    );
}
