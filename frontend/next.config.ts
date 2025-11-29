import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Set the root directory for Turbopack
    root: process.cwd(),
  },
};

export default nextConfig;
