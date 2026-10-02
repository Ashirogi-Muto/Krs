import type { NextConfig } from "next";

// In production nginx sends /api/* straight to the backend; this rewrite is the fallback for
// local development or setups without nginx. API_INTERNAL_URL is read at build time.
const apiInternalUrl = process.env.API_INTERNAL_URL || "http://127.0.0.1:8050";

const nextConfig: NextConfig = {
  output: "standalone", // required by the Dockerfile (copies .next/standalone)
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
