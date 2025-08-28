import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable scroll restoration
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;
