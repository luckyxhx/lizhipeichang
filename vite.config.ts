import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const basePath = process.env.VITE_BASE_PATH ?? "/";

if (!basePath.startsWith("/") || !basePath.endsWith("/")) {
  throw new Error("VITE_BASE_PATH must start and end with a slash");
}

export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: "./src/test/setup.ts",
  },
});
