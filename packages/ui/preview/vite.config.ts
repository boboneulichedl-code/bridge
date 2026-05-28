import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { join } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: join(__dirname),
  build: {
    outDir: join(__dirname, "dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@bridge/ui": join(__dirname, "../src"),
    },
  },
});
