import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://iraniandragons.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
