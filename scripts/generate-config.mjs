import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");

function parseEnv(source) {
  return Object.fromEntries(source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
      return [key, value];
    }));
}

let fileEnvironment = {};
try {
  fileEnvironment = parseEnv(await readFile(envFile, "utf8"));
} catch {}

const environment = globalThis.process?.env ?? {};
const supabaseUrl = String(fileEnvironment.SUPABASE_URL || environment.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "");
const publishableKey = String(fileEnvironment.SUPABASE_PUBLISHABLE_KEY || environment.SUPABASE_PUBLISHABLE_KEY || "");

if (!supabaseUrl || !publishableKey) {
  throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required in .env.local or the environment.");
}

const runtimeConfig = `window.__POINTERSCORE_CONFIG__ = Object.freeze(${JSON.stringify({
  supabaseUrl,
  supabasePublishableKey: publishableKey
})});\n`;

await writeFile(path.join(root, "runtime-config.js"), runtimeConfig, "utf8");
console.log("Runtime configuration generated.");
