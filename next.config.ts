import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/gful", destination: "/repogo", permanent: false },
      { source: "/api/gful/:path*", destination: "/api/repogo/:path*", permanent: false },
    ];
  },
  serverExternalPackages: ["@pump-fun/pump-sdk", "@pump-fun/pump-swap-sdk"],
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
  ],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana-mobile/wallet-adapter-mobile": path.resolve("./lib/stubs/solana-mobile.ts"),
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
