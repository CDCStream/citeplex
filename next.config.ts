import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/tools",
        destination: "https://seo-tools-container.onrender.com/",
      },
      {
        source: "/tools/:path*",
        destination: "https://seo-tools-container.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
