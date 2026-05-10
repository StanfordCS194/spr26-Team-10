import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Directory that contains this config file (the Next app root). */
const appDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Pin Turbopack to this app so `tailwindcss` and PostCSS resolve from `my-app/node_modules`.
 * Otherwise Next may infer a parent folder (monorepo root or another lockfile) and hang on
 * "Compiling..." while failing to resolve Tailwind.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: appDir,
  },
  async redirects() {
    return [
      { source: "/upload", destination: "/step/1", permanent: false },
    ];
  },
};

export default nextConfig;
