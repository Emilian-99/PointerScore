import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { appEntries, appRoutes } from "./site-layout.mjs";

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

// Keep web fonts self-hosted, including references injected by scripts or CSS imports.
const remoteFontHost = /fonts\.(?:googleapis|gstatic)\.com/i;
for (const file of files.filter((entry) => /\.(?:html|css|js)$/i.test(entry))) {
  if (remoteFontHost.test(await readFile(file, "utf8"))) {
    errors.push(`${path.relative(dist, file)}: external Google Fonts reference`);
  }
}
for (const subset of ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"]) {
  const file = `assets/fonts/inter/inter-${subset}.woff2`;
  if (!relativeFiles.has(file)) {
    errors.push(`Missing local font: ${file}`);
  } else if ((await readFile(path.join(dist, file))).toString("ascii", 0, 4) !== "wOF2") {
    errors.push(`Invalid WOFF2 font: ${file}`);
  }
}
for (const file of ["assets/fonts/inter/inter.css", "assets/fonts/inter/OFL.txt"]) {
  if (!relativeFiles.has(file)) errors.push(`Missing font asset: ${file}`);
}

for (const required of ["index.html", "privacy.html", "404.html", "style.css", "script.js", "i18n.js", "legal-content.js", "legal-pages.js", ...appRoutes, "auth-callback/index.html", "auth-callback/auth-callback.js", "auth-callback/vendor/supabase.js"]) {
  if (!relativeFiles.has(required)) errors.push(`Missing required build file: ${required}`);
}

for (const entry of appEntries.filter(entry=>entry.endsWith('.js'))) {
  if (relativeFiles.has(entry)) errors.push(`Desktop-only script exposed at website root: ${entry}`);
}
const landing = await readFile(path.join(dist, "index.html"), "utf8");
if (/<form\b|href=["'](?:auth\.html|dashboard\.html|rechner\/)|data-calculator-demo|runtime-config\.js|demo-calculator\.js/i.test(landing)) {
  errors.push("Public landing contains a web-app entry, interactive calculator or login form");
}
if ([...relativeFiles].some(file => file.startsWith('app/'))) errors.push('Desktop renderer must not be published on the website');
for (const file of ['dashboard.js','calculator-app.js','calculator-logic.js','rechner/app.js','rechner/logic.js','company-data-client.js']) {
  if (relativeFiles.has(file)) errors.push(`Application file shipped on public website: ${file}`);
}
for (const route of appRoutes) {
  const html=await readFile(path.join(dist,route),'utf8');
  if (/<form\b|score-form|runtime-config|type="module"/.test(html)) errors.push(`Functional app page exposed publicly: ${route}`);
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

    let clean = decodeURIComponent(reference.split("#")[0].split("?")[0]);
    if (clean.endsWith("/")) clean += "index.html";
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
    const result = spawnSync(process.execPath, ["--check", "--input-type=module"], { input: source, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
    if (result.status !== 0) throw new Error(result.stderr.match(/SyntaxError:[^\n]+/)?.[0] || "JavaScript syntax check failed");
  } catch (error) {
    errors.push(`${path.relative(dist, file)}: ${error.message}`);
  }
}

if (errors.length) {
  throw new Error(errors.join("\n"));
} else {
  console.log(`Checks passed: ${files.length} build files, links and JavaScript syntax are valid.`);
}
