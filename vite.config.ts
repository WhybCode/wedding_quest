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

/** Dátum posledného gitu (YYYY-MM-DD → dd.MM.yyyy) pre footer „Last updated“. */
function lastUpdatedLabel() {
  try {
    const iso = execSync("git log -1 --format=%cs", { encoding: "utf8" }).trim();
    const [y, m, d] = iso.split("-");
    if (y && m && d) return `${d}.${m}.${y}`;
  } catch {
    /* fallback nižšie */
  }
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${now.getFullYear()}`;
}

const LAST_UPDATED = process.env.VITE_LAST_UPDATED?.trim() || lastUpdatedLabel();

export default defineConfig({
  nitro: false,
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: true },
    spa: { enabled: true },
    pages: [{ path: "/" }, { path: "/afterparty" }],
    router: {
      ...(routerBasepath ? { basepath: routerBasepath } : {}),
    },
  },
  vite: {
    base: pagesBase,
    plugins: [photoManifestPlugin()],
    define: {
      "import.meta.env.VITE_LAST_UPDATED": JSON.stringify(LAST_UPDATED),
    },
  },
});
