import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
  },
  // Same as vercel.json: /api goes to the backend, so the session cookie is first-party in dev too.
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://127.0.0.1:3000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: ["prototypes/**", "**/node_modules/**"],
  },
});
