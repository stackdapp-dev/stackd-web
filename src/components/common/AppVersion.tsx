"use client";

const version = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || "unknown";

export default function AppVersion() {
    return (
        <p className="text-center text-white/20 text-[10px] font-mono pb-20">
            v{version}-{commitHash}
        </p>
    );
}
