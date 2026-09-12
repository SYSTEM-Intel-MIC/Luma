import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import electronRenderer from "vite-plugin-electron-renderer";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const buildRendererOnly = mode === "renderer";

  return {
    root: "renderer",
    base: "./",
    plugins: [
      react(),
      !buildRendererOnly &&
        electron([
          {
            entry: path.resolve(__dirname, "electron/src/main.ts"),
            vite: {
              build: {
                outDir: path.resolve(__dirname, "dist-electron"),
                rollupOptions: {
                  external: ["electron", "better-sqlite3"],
                },
              },
            },
          },
          {
            entry: path.resolve(__dirname, "electron/src/preload.ts"),
            onstart(args) {
              args.reload();
            },
            vite: {
              build: {
                outDir: path.resolve(__dirname, "dist-electron"),
                rollupOptions: {
                  external: ["electron"],
                },
              },
            },
          },
        ]),
      !buildRendererOnly && electronRenderer(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@luma/shared": path.resolve(__dirname, "../../packages/shared/src"),
        "@luma/agent": path.resolve(__dirname, "../../packages/agent/src"),
        "@luma/models": path.resolve(__dirname, "../../packages/models/src"),
        "@luma/tools": path.resolve(__dirname, "../../packages/tools/src"),
        "@luma/permissions": path.resolve(
          __dirname,
          "../../packages/permissions/src",
        ),
        "@luma/memory": path.resolve(__dirname, "../../packages/memory/src"),
        "@luma/storage": path.resolve(__dirname, "../../packages/storage/src"),
      },
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
