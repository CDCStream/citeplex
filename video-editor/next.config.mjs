import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["remotion", "@remotion/player", "@remotion/transitions"],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@remotion": path.resolve(__dirname, "../video/src"),
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["@remotion/cli"],
  },
};

export default nextConfig;
