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
      "@features": path.resolve(__dirname, "./src/features"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@utils": path.resolve(__dirname, "./src/lib/utils"),
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  build: {
    outDir: "dist/renderer",
  },
});
