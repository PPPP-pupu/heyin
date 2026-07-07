import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CloudBase JS SDK is browser-only — exclude from SSR bundling
  serverExternalPackages: ["@cloudbase/js-sdk"],
};

export default nextConfig;
