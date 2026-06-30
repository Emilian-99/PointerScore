import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./generate-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const environment = globalThis.process?.env ?? {};
const port = Number(environment.PORT || 4173);
const host = environment.HOST || "127.0.0.1";
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function safePath(base, requestPath) {
  const resolved = path.resolve(base, "." + requestPath);
  return resolved === base || resolved.startsWith(base + path.sep) ? resolved : null;
}

async function findFile(urlPath) {
  let pathname = decodeURIComponent(urlPath);
  if (pathname === "/") pathname = "/index.html";

  const publicCandidate = safePath(publicDir, pathname);
  const rootCandidate = safePath(root, pathname);
  for (const candidate of [publicCandidate, rootCandidate]) {
    if (!candidate) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {}
  }
  return null;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || host}`);
    const file = await findFile(url.pathname);
    if (file) {
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      response.end(await readFile(file));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(await readFile(path.join(root, "404.html")));
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  }
});

server.listen(port, host, () => {
  console.log(`PointerScore is running at http://${host}:${port}`);
});
