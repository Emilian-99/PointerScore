import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const errors = [];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
}

const files = await walk(dist);
const relativeFiles = new Set(files.map((file) => path.relative(dist, file).split(path.sep).join("/")));

for (const required of ["index.html", "auth.html", "dashboard.html", "calculator.html", "404.html", "style.css", "script.js", "i18n.js", "runtime-config.js", "auth-client.js", "auth-page.js", "dashboard.js", "calculator-app.js", "calculator-logic.js", "demo-calculator.js", "demo-company-data.js", "pdfs/de/PointerScore-Handbook-DE.pdf", "pdfs/en/PointerScore-Handbook-EN.pdf"]) {
  if (!relativeFiles.has(required)) errors.push(`Missing required build file: ${required}`);
}

for (const file of files.filter((entry) => entry.endsWith(".html"))) {
  const relative = path.relative(dist, file).split(path.sep).join("/");
  const html = await readFile(file, "utf8");
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]));

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    if (reference.startsWith("#")) {
      if (reference.length > 1 && !ids.has(decodeURIComponent(reference.slice(1)))) {
        errors.push(`${relative}: missing anchor ${reference}`);
      }
      continue;
    }

    const clean = decodeURIComponent(reference.split("#")[0].split("?")[0]);
    const target = clean === "/"
      ? "index.html"
      : clean.startsWith("/")
        ? clean.slice(1)
        : path.posix.normalize(path.posix.join(path.posix.dirname(relative), clean));
    if (!relativeFiles.has(target)) errors.push(`${relative}: missing reference ${reference}`);
  }
}

for (const file of files.filter((entry) => entry.endsWith(".js"))) {
  try {
    const source = await readFile(file, "utf8");
    if (/^\s*(?:import|export)\s/m.test(source) && typeof vm.SourceTextModule === "function") {
      new vm.SourceTextModule(source, { identifier: file });
    } else if (!/^\s*(?:import|export)\s/m.test(source)) {
      new vm.Script(source, { filename: file });
    }
  } catch (error) {
    errors.push(`${path.relative(dist, file)}: ${error.message}`);
  }
}

if (errors.length) {
  throw new Error(errors.join("\n"));
} else {
  console.log(`Checks passed: ${files.length} build files, links and JavaScript syntax are valid.`);
}
