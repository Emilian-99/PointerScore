import { mkdir, readFile, readdir, rm, stat, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundleSupabase } from "./bundle-supabase.mjs";
import { appRoutes, legalAliases, routePage } from "./site-layout.mjs";
import "./generate-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const publicEntries = ["index.html", "privacy.html", "404.html", "favicon.ico", "site.webmanifest", "style.css", "script.js", "i18n.js", "legal-pages.js", "legal-content.js", "assets", "pages", "CNAME"];

async function copyEntry(source, destination) {
  const info = await stat(source);
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source)) {
      // Old application manuals remain in the desktop bundle, not the information website.
      if (source === path.join(root, "assets") && /handbook|handbuch/i.test(entry)) continue;
      await copyEntry(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, await readFile(source));
}

// Clear only generated website output. Never cloud data or app sources.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const entry of publicEntries) await copyEntry(path.join(root, entry), path.join(dist, entry));
for (const route of appRoutes) {
  await mkdir(path.dirname(path.join(dist,route)),{recursive:true});
  await writeFile(path.join(dist,route),routePage());
}
for (const [old,current] of Object.entries(legalAliases)) {
  await writeFile(path.join(dist,"pages",old),`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${current}"><a href="${current}">Aktuelle Informationen / Updated information</a>`);
}
// Email confirmation/password recovery is the sole technical auth page; no dashboard/calculator.
const callback = path.join(dist,"auth-callback");
await mkdir(callback,{recursive:true});
await cp(path.join(root,"scripts","auth-callback.html"),path.join(callback,"index.html"));
await cp(path.join(root,"scripts","auth-callback.js"),path.join(callback,"auth-callback.js"));
await cp(path.join(root,"runtime-config.js"),path.join(callback,"runtime-config.js"));
const client=await readFile(path.join(root,"auth-client.js"),"utf8");
await writeFile(path.join(callback,"auth-client.js"),client.replace("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm","./vendor/supabase.js"));
await bundleSupabase(root,path.join(callback,"vendor","supabase.js"));
await cp(path.join(root,"node_modules","@supabase","supabase-js","LICENSE"),path.join(callback,"vendor","SUPABASE-LICENSE"));
for (const entry of ["robots.txt","sitemap.xml"]) await copyEntry(path.join(root,"public",entry),path.join(dist,entry));
await writeFile(path.join(dist,".nojekyll"),"");
console.log("Information website built without dashboard, calculator or /app/ assets.");
