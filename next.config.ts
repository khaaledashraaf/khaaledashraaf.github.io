import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "m.media-amazon.com" },
      { hostname: "img.youtube.com" },
      { hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
