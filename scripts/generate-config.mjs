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
  // The checked-in browser configuration contains only public client credentials.
  // A static-site CI build must not need a service-role key or personal access token.
  const saved = await readFile(path.join(root, "runtime-config.js"), "utf8");
  const value = saved.match(/Object\.freeze\((\{[^\n]+\})\)/)?.[1];
  const config = value ? JSON.parse(value) : null;
  if (!config?.supabaseUrl || !isPublicKey(config.supabasePublishableKey)) {
    throw new Error("Valid public Supabase configuration is required for desktop compatibility.");
  }
  console.log("Existing public desktop configuration retained.");
} else {
  if (!isPublicKey(publishableKey)) throw new Error("Only a public Supabase client key may be shipped.");

  const runtimeConfig = `window.__POINTERSCORE_CONFIG__ = Object.freeze(${JSON.stringify({
    supabaseUrl,
    supabasePublishableKey: publishableKey
  })});\n`;

  await writeFile(path.join(root, "runtime-config.js"), runtimeConfig, "utf8");
  console.log("Runtime configuration generated.");
}

function isPublicKey(value) {
  if (typeof value !== "string") return false;
  if (value.startsWith("sb_publishable_")) return true;
  try { return JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString()).role === "anon"; }
  catch { return false; }
}
