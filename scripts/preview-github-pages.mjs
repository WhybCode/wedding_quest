import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../dist/client");
const base = (process.env.GITHUB_PAGES_BASE || "/wedding_quest/").replace(/\/$/, "");
const port = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function safePath(urlPath) {
  const normalized = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) return null;
  return full;
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("Chýba dist/client/index.html — najprv spusti: npm run build:pages");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const raw = (req.url ?? "/").split("?")[0];

  if (raw === "/" || raw === "") {
    res.writeHead(302, { Location: `${base}/` });
    res.end();
    return;
  }

  if (!raw.startsWith(`${base}/`) && raw !== base) {
    send(res, 404, `Nájdeš na ${base}/`);
    return;
  }

  let relative = raw.slice(base.length) || "/";
  if (relative.endsWith("/")) relative += "index.html";

  const filePath = safePath(relative);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  const tryFiles = [filePath];
  if (!path.extname(filePath)) tryFiles.push(`${filePath}.html`);

  for (const candidate of tryFiles) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      const data = fs.readFileSync(candidate);
      send(res, 200, data, MIME[ext] ?? "application/octet-stream");
      return;
    }
  }

  const fallback = path.join(root, "404.html");
  if (fs.existsSync(fallback)) {
    send(res, 200, fs.readFileSync(fallback), MIME[".html"]);
    return;
  }

  send(res, 404, "Not found");
});

server.listen(port, () => {
  console.log(`GitHub Pages preview: http://localhost:${port}${base}/`);
});
