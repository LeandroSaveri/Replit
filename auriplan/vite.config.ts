import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const srcDir = path.resolve(import.meta.dirname, "src");

export default defineConfig({
  base: "/",
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    alias: {
      "@": srcDir,
      "@app": path.resolve(srcDir, "app"),
      "@core": path.resolve(srcDir, "core"),
      "@engine": path.resolve(srcDir, "engine"),
      "@editor": path.resolve(srcDir, "editor"),
      "@features": path.resolve(srcDir, "features"),
      "@components": path.resolve(srcDir, "components"),
      "@ui": path.resolve(srcDir, "components/ui"),
      "@store": path.resolve(srcDir, "store"),
      "@model": path.resolve(srcDir, "model"),
      "@services": path.resolve(srcDir, "services"),
      "@hooks": path.resolve(srcDir, "hooks"),
      "@utils": path.resolve(srcDir, "utils"),
      "@auriplan-types": path.resolve(srcDir, "types"),
      "@workers": path.resolve(srcDir, "workers"),
      "@assets": path.resolve(srcDir, "assets"),
      "@library": path.resolve(srcDir, "library"),
      "@ar": path.resolve(srcDir, "ar"),
      "@rendering": path.resolve(srcDir, "rendering"),
      "@export": path.resolve(srcDir, "export"),
      "@config": path.resolve(srcDir, "config"),
      "@i18n": path.resolve(srcDir, "i18n"),
    },
    dedupe: ["react", "react-dom", "three"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"],
          "ui-vendor": ["framer-motion", "lucide-react"],
          "state-vendor": ["zustand", "immer"],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  preview: {
    port: 4173,
    host: "0.0.0.0",
  },
  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },
});
