import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/* -------------------------------------------- */

// https://vitejs.dev/config
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@utils": path.resolve(__dirname, "./src/lib/utils"),
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  build: {
    outDir: "dist/renderer",
  },
});
