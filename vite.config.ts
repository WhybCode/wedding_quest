// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { execSync } from "node:child_process";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function syncPhotos() {
  execSync("node scripts/sync-photo-manifest.mjs", { stdio: "inherit" });
}
function photoManifestPlugin(): Plugin {
  return {
    name: "photo-manifest",
    buildStart() {
      syncPhotos();
    },
    configureServer(server) {
      const photosDir = path.join(process.cwd(), "public/photos");
      server.watcher.add(photosDir);
      const resync = (file: string) => {
        if (file.includes(`${path.sep}photos${path.sep}`) && !file.endsWith("manifest.json")) {
          syncPhotos();
          server.ws.send({ type: "full-reload", path: "*" });
        }
      };
      server.watcher.on("add", resync);
      server.watcher.on("unlink", resync);
    },
  };
}

const pagesBase = process.env.GITHUB_PAGES_BASE || "/";
const routerBasepath = pagesBase === "/" ? undefined : pagesBase.replace(/\/$/, "");

export default defineConfig({
  nitro: false,
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: true },
    spa: { enabled: true },
    pages: [{ path: "/" }],
    router: {
      ...(routerBasepath ? { basepath: routerBasepath } : {}),
    },
  },
  vite: {
    base: pagesBase,
    plugins: [photoManifestPlugin()],
  },
});
