const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function findAppBuilder(projectDir) {
  const directPath = path.join(projectDir, "node_modules", "app-builder-bin", "win", "x64", "app-builder.exe");
  if (fs.existsSync(directPath)) return directPath;

  const pnpmDir = path.join(projectDir, "node_modules", ".pnpm");
  if (!fs.existsSync(pnpmDir)) return null;

  for (const entry of fs.readdirSync(pnpmDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("app-builder-bin@")) continue;
    const candidate = path.join(pnpmDir, entry.name, "node_modules", "app-builder-bin", "win", "x64", "app-builder.exe");
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function findRcedit(projectDir) {
  const candidates = [];

  if (process.env.POINTERSCORE_RCEDIT_PATH) {
    candidates.push(process.env.POINTERSCORE_RCEDIT_PATH);
  }

  candidates.push(
    path.join(projectDir, "tools", "rcedit-x64.exe"),
    path.join(projectDir, ".electron-builder-cache", "winCodeSign", "winCodeSign-2.6.0", "rcedit-x64.exe"),
    path.join(projectDir, ".electron-builder-cache", "winCodeSign", "067386519", "rcedit-x64.exe")
  );

  const cacheRoot = process.env.ELECTRON_BUILDER_CACHE;
  if (cacheRoot) {
    candidates.push(path.join(cacheRoot, "winCodeSign", "winCodeSign-2.6.0", "rcedit-x64.exe"));
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    candidates.push(path.join(localAppData, "electron-builder", "Cache", "winCodeSign", "winCodeSign-2.6.0", "rcedit-x64.exe"));
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function find7za(projectDir) {
  const directPath = path.join(projectDir, "node_modules", ".pnpm", "7zip-bin@5.2.0", "node_modules", "7zip-bin", "win", "x64", "7za.exe");
  if (fs.existsSync(directPath)) return directPath;

  const pnpmDir = path.join(projectDir, "node_modules", ".pnpm");
  if (!fs.existsSync(pnpmDir)) return null;

  for (const entry of fs.readdirSync(pnpmDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("7zip-bin@")) continue;
    const candidate = path.join(pnpmDir, entry.name, "node_modules", "7zip-bin", "win", "x64", "7za.exe");
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function findCachedWinCodeSignArchive(projectDir) {
  const candidates = [
    path.join(projectDir, ".electron-builder-cache", "winCodeSign", "067386519.7z")
  ];

  const cacheRoot = process.env.ELECTRON_BUILDER_CACHE;
  if (cacheRoot) {
    candidates.push(path.join(cacheRoot, "winCodeSign", "067386519.7z"));
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function extractRceditFromCache(projectDir) {
  const archive = findCachedWinCodeSignArchive(projectDir);
  const sevenZip = find7za(projectDir);
  if (!archive || !sevenZip) return null;

  const targetDir = path.join(projectDir, ".electron-builder-cache", "winCodeSign", "winCodeSign-2.6.0");
  fs.mkdirSync(targetDir, { recursive: true });
  execFileSync(sevenZip, ["x", "-y", archive, "rcedit-x64.exe", `-o${targetDir}`], {
    cwd: projectDir,
    stdio: "inherit"
  });

  const rcedit = path.join(targetDir, "rcedit-x64.exe");
  return fs.existsSync(rcedit) ? rcedit : null;
}

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;

  const projectDir = context.packager.projectDir;
  const appBuilder = findAppBuilder(projectDir);

  const productName = context.packager.appInfo.productName || "PointerScore";
  const productFilename = context.packager.appInfo.productFilename || productName;
  const version = context.packager.appInfo.version || "1.0.0";
  const exePath = path.join(context.appOutDir, `${productFilename}.exe`);
  const iconPath = path.join(projectDir, "icon.ico");

  if (!fs.existsSync(exePath)) {
    throw new Error(`Windows-App-Datei nicht gefunden: ${exePath}`);
  }
  if (!fs.existsSync(iconPath)) {
    throw new Error(`PointerScore-Icon nicht gefunden: ${iconPath}`);
  }

  const args = [
    exePath,
    "--set-version-string",
    "FileDescription",
    productName,
    "--set-version-string",
    "ProductName",
    productName,
    "--set-version-string",
    "CompanyName",
    "PointerScore",
    "--set-version-string",
    "LegalCopyright",
    "Copyright (c) 2026 PointerScore",
    "--set-version-string",
    "InternalName",
    productFilename,
    "--set-version-string",
    "OriginalFilename",
    `${productFilename}.exe`,
    "--set-file-version",
    version,
    "--set-product-version",
    version,
    "--set-icon",
    iconPath
  ];

  const rcedit = findRcedit(projectDir) || extractRceditFromCache(projectDir);
  if (rcedit) {
    execFileSync(rcedit, args, {
      cwd: projectDir,
      stdio: "inherit"
    });
    return;
  }

  if (!appBuilder) {
    throw new Error("Weder rcedit-x64.exe noch app-builder.exe wurden gefunden. Bitte zuerst im desktop-Ordner die Abhängigkeiten installieren.");
  }

  const sevenZip = find7za(projectDir);
  const env = { ...process.env };
  if (sevenZip) env.PATH = `${path.dirname(sevenZip)}${path.delimiter}${env.PATH || ""}`;

  execFileSync(appBuilder, ["rcedit", "--args", JSON.stringify(args)], {
    cwd: projectDir,
    stdio: "inherit",
    env
  });
};
