import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // Keep packages that need native Node.js modules as server externals
  serverExternalPackages: [
    '@meshsdk/core',
    '@meshsdk/core-cst',
    '@cardano-sdk/crypto',
    'libsodium-wrappers-sumo',
  ],
};

export default withSerwist(nextConfig);
