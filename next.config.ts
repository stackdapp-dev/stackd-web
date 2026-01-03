import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

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
