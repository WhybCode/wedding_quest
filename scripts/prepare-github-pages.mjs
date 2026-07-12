import fs from "node:fs";
import path from "node:path";

const clientDir = path.join(process.cwd(), "dist/client");
const shellPath = path.join(clientDir, "_shell.html");
const indexPath = path.join(clientDir, "index.html");
const notFoundPath = path.join(clientDir, "404.html");

if (!fs.existsSync(clientDir)) {
  console.error("Chýba dist/client — najprv spusti build.");
  process.exit(1);
}

if (fs.existsSync(shellPath)) {
  fs.copyFileSync(shellPath, indexPath);
  fs.copyFileSync(shellPath, notFoundPath);
  console.log("Vytvorené index.html a 404.html zo _shell.html");
} else if (!fs.existsSync(indexPath)) {
  console.error("Chýba _shell.html aj index.html — skontroluj prerender v vite.config.ts");
  process.exit(1);
}

fs.writeFileSync(path.join(clientDir, ".nojekyll"), "");
console.log("GitHub Pages artefakt pripravený:", clientDir);
