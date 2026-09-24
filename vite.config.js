import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Relative base so the built asset paths (JS/CSS/manifest/service worker)
  // work no matter what subfolder this ends up hosted under -- required for
  // GitHub Pages project sites, which serve from
  // https://<user>.github.io/<repo-name>/ rather than the domain root.
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Zamar Setlist",
        short_name: "Zamar Setlist",
        description: "Worship setlist picker and viewer for The Potter's House Ogden",
        start_url: ".",
        display: "standalone",
        background_color: "#e7e6de",
        theme_color: "#2f382a",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
