import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "m.media-amazon.com" },
      { hostname: "img.youtube.com" },
      { hostname: "upload.wikimedia.org" },
      { hostname: "res.cloudinary.com" },
      { hostname: "storage.icograms.com" },
      { hostname: "invention.si.edu" },
      { hostname: "www.mac-history.net" },
    ],
  },
};

export default nextConfig;
