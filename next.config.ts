import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@swapkit/sdk',
    '@swapkit/toolboxes',
    '@swapkit/helpers',
    '@swapkit/wallets',
    '@swapkit/plugins',
    '@swapkit/core',
    '@meshsdk/core',
    '@meshsdk/core-cst',
    '@cardano-sdk/crypto',
    'libsodium-wrappers-sumo',
    '@near-wallet-selector/modal-ui-js',
    '@near-wallet-selector/core',
  ],
};

export default withSerwist(nextConfig);
