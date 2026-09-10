import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        navigateFallbackDenylist: [/^\/app\/staff(?:\/|$)/]
      },
      manifest: {
        name: "RailSense AI",
        short_name: "RailSense",
        description: "File and track railway complaints in your language",
        theme_color: "#2563eb",
        background_color: "#f4f6fa",
        display: "standalone",
        orientation: "portrait",
        start_url: "/app/",
        scope: "/app/",
        icons: [
          { src: "/app/logo.png", sizes: "192x192", type: "image/png" },
          { src: "/app/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ]
});
