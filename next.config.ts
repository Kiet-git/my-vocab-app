import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default for `next dev`
  // No need to enable experimentalTurbopack anymore
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Recommended for Next.js 16
  reactStrictMode: true,
};

export default nextConfig;
