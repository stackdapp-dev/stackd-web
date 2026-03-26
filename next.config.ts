import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import { execSync } from "child_process";

const commitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

const nextConfig: NextConfig = {
  // Keep packages that need native Node.js modules as server externals
  serverExternalPackages: [
    '@meshsdk/core',
    '@meshsdk/core-cst',
    '@cardano-sdk/crypto',
    'libsodium-wrappers-sumo',
  ],
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.0.0",
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
};

export default withSerwist(nextConfig);
