import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./generate-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const sourceEntries = [
  "index.html",
  "auth.html",
  "dashboard.html",
  "calculator.html",
  "404.html",
  "style.css",
  "script.js",
  "i18n.js",
  "runtime-config.js",
  "auth-client.js",
  "auth-page.js",
  "dashboard.js",
  "calculator-app.js",
  "calculator-logic.js",
  "demo-calculator.js",
  "demo-company-data.js",
  "assets",
  "pages",
  "CNAME"
];

async function copyEntry(source, destination) {
  const info = await stat(source);
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source)) {
      await copyEntry(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, await readFile(source));
}

await mkdir(dist, { recursive: true });

for (const entry of sourceEntries) {
  await copyEntry(path.join(root, entry), path.join(dist, entry));
}

const publicDir = path.join(root, "public");
for (const entry of await readdir(publicDir)) {
  await copyEntry(path.join(publicDir, entry), path.join(dist, entry));
}

console.log("PointerScore build created in dist/");
