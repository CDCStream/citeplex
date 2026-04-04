import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["remotion", "@remotion/player", "@remotion/transitions"],
  webpack(config) {
    const editorNodeModules = path.resolve(__dirname, "node_modules");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@video": path.resolve(__dirname, "../video/src"),
      "remotion": path.resolve(editorNodeModules, "remotion"),
      "@remotion/player": path.resolve(editorNodeModules, "@remotion/player"),
      "@remotion/transitions": path.resolve(editorNodeModules, "@remotion/transitions"),
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["@remotion/cli"],
  },
};

export default nextConfig;
