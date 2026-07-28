import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const outputDir = path.join(projectDir, "msix-delivery");
const cacheDir = path.join(projectDir, ".electron-builder-cache");
const winCodeSignDir = path.join(cacheDir, "winCodeSign", "winCodeSign-2.6.0");
const makeAppx = path.join(winCodeSignDir, "windows-10", "x64", "makeappx.exe");
const cacheArchive = path.join(cacheDir, "winCodeSign", "067386519.7z");
const sevenZip = path.join(
  projectDir,
  "node_modules",
  ".pnpm",
  "7zip-bin@5.2.0",
  "node_modules",
  "7zip-bin",
  "win",
  "x64",
  "7za.exe"
);
const electronBuilderCli = path.join(projectDir, "node_modules", "electron-builder", "out", "cli", "cli.js");

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd || projectDir,
    stdio: "inherit",
    env: options.env || process.env
  });
}

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} nicht gefunden: ${filePath}`);
  }
}

function ensureMakeAppx() {
  if (fs.existsSync(makeAppx)) return;

  ensureFile(sevenZip, "7-Zip");
  ensureFile(cacheArchive, "Electron-Builder Windows-CodeSign-Cache");
  fs.mkdirSync(winCodeSignDir, { recursive: true });
  run(sevenZip, ["x", "-y", cacheArchive, "windows-10\\x64\\*", `-o${winCodeSignDir}`]);
  ensureFile(makeAppx, "makeappx.exe");
}

function findGeneratedAppx() {
  const files = fs
    .readdirSync(outputDir)
    .filter((name) => name.toLowerCase().endsWith(".appx"))
    .map((name) => path.join(outputDir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (files.length === 0) {
    throw new Error(`Kein AppX-Paket in ${outputDir} gefunden.`);
  }

  return files[0];
}

function packageMsix(appxPath) {
  ensureFile(sevenZip, "7-Zip");
  ensureFile(makeAppx, "makeappx.exe");

  const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
  const version = packageJson.version;
  const layoutDir = path.join(outputDir, "msix-layout");
  const msixPath = path.join(outputDir, `PointerScore-${version}-x64.msix`);
  const uploadPath = path.join(outputDir, `PointerScore-${version}-x64.msixupload`);

  fs.rmSync(layoutDir, { recursive: true, force: true });
  fs.mkdirSync(layoutDir, { recursive: true });
  fs.rmSync(msixPath, { force: true });
  fs.rmSync(uploadPath, { force: true });

  run(sevenZip, ["x", "-y", appxPath, `-o${layoutDir}`]);
  run(makeAppx, ["pack", "/d", layoutDir, "/p", msixPath, "/o"]);
  run(sevenZip, ["a", "-tzip", uploadPath, path.basename(msixPath)], { cwd: outputDir });
  fs.rmSync(layoutDir, { recursive: true, force: true });

  return { msixPath, uploadPath };
}

ensureFile(electronBuilderCli, "electron-builder CLI");
ensureMakeAppx();

const env = {
  ...process.env,
  ELECTRON_BUILDER_CACHE: cacheDir,
  PATH: `${path.dirname(sevenZip)}${path.delimiter}${process.env.PATH || ""}`
};

run(
  process.execPath,
  [
    electronBuilderCli,
    "--win",
    "appx",
    "--x64",
    "--config.directories.output=msix-delivery",
    "--config.artifactName=PointerScore-${version}-${arch}.${ext}",
    "--config.win.signAndEditExecutable=false",
    "--config.win.verifyUpdateCodeSignature=false"
  ],
  { env }
);

const appxPath = findGeneratedAppx();
const { msixPath, uploadPath } = packageMsix(appxPath);

console.log(`MSIX erstellt: ${msixPath}`);
console.log(`MSIXUPLOAD erstellt: ${uploadPath}`);
