import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Optimizaciones de compilación de alto rendimiento para Turbopack */
  reactStrictMode: true,
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
