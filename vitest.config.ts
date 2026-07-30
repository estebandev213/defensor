import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Match Next.js: components use the automatic runtime and never import React.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "src/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
});
