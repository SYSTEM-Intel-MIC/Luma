import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import electronRenderer from "vite-plugin-electron-renderer";
import path from "node:path";

const desktopRoot = __dirname;
const lumaAliases = {
  "@luma/shared": path.resolve(desktopRoot, "../../packages/shared/src"),
  "@luma/agent": path.resolve(desktopRoot, "../../packages/agent/src"),
  "@luma/models": path.resolve(desktopRoot, "../../packages/models/src"),
  "@luma/tools": path.resolve(desktopRoot, "../../packages/tools/src"),
  "@luma/permissions": path.resolve(
    desktopRoot,
    "../../packages/permissions/src",
  ),
  "@luma/memory": path.resolve(desktopRoot, "../../packages/memory/src"),
  "@luma/storage": path.resolve(desktopRoot, "../../packages/storage/src"),
};

export default defineConfig({
  root: "renderer",
  base: "./",
  plugins: [
    react(),
    electron([
      {
        entry: path.resolve(desktopRoot, "electron/src/main.ts"),
        vite: {
          resolve: { alias: lumaAliases },
          build: {
            outDir: path.resolve(desktopRoot, "dist-electron"),
            rollupOptions: {
              external: ["electron", "better-sqlite3"],
            },
          },
        },
      },
      {
        entry: path.resolve(desktopRoot, "electron/src/preload.ts"),
        onstart(args) {
          args.reload();
        },
        vite: {
          resolve: { alias: lumaAliases },
          build: {
            outDir: path.resolve(desktopRoot, "dist-electron"),
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
    ]),
    electronRenderer(),
  ],
  resolve: {
    alias: lumaAliases,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
