import fs from "node:fs";
import path from "node:path";

const photosDir = path.join(process.cwd(), "public/photos");
const publicManifestPath = path.join(photosDir, "manifest.json");
const srcManifestPath = path.join(process.cwd(), "src/data/photo-manifest.json");

export function syncPhotoManifest() {
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  const manifest = {};
  for (const file of fs.readdirSync(photosDir)) {
    if (file.startsWith(".") || file === "manifest.json") continue;
    const match = file.match(/^(\d+)\.[^.]+$/);
    if (match) manifest[match[1]] = file;
  }

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.mkdirSync(path.dirname(srcManifestPath), { recursive: true });
  fs.writeFileSync(publicManifestPath, json);
  fs.writeFileSync(srcManifestPath, json);

  return manifest;
}

if (process.argv[1]?.endsWith("sync-photo-manifest.mjs")) {
  const manifest = syncPhotoManifest();
  console.log(
    `Photo manifest synced (${Object.keys(manifest).length} files):\n  ${publicManifestPath}\n  ${srcManifestPath}`,
  );
}
