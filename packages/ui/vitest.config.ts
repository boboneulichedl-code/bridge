import { defineConfig } from "vitest/config";
import { join } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@bridge/ui": join(__dirname, "src"),
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@bridge/ui": join(__dirname, "src"),
          },
        },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: {
            "@bridge/ui": join(__dirname, "src"),
          },
        },
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["tests/**/*.test.tsx"],
          setupFiles: ["tests/setup-dom.ts"],
        },
      },
    ],
  },
});
