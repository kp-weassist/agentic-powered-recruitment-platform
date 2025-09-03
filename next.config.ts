import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avoid bundling Node-only libs that rely on dynamic requires (e.g., log4js)
    serverComponentsExternalPackages: [
      "@adobe/pdfservices-node-sdk",
      "log4js",
      "unzipper",
    ],
  },
};

export default nextConfig;
