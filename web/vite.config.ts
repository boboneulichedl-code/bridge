import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon.svg"],
      manifest: {
        id: "/",
        name: "Bridge Control",
        short_name: "Bridge",
        description: "Steuere Cursor- und Android-Studio-Agenten von überall.",
        theme_color: "#0f1419",
        background_color: "#0f1419",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        lang: "de",
        categories: ["developer", "productivity", "utilities"],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "bridge-api",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3847",
        changeOrigin: true,
      },
    },
  },
});
