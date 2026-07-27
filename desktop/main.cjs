const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const appUrl = process.env.POINTERSCORE_APP_URL || "https://pointerscore.com/dashboard.html";
const allowedHosts = new Set(["pointerscore.com", "www.pointerscore.com"]);
const appId = "com.pointerscore.app";
const splashDurationMs = 9250;
const splashVariants = [
  { file: "splash-concept-fill.html", weight: 50 },
  { file: "splash-concept.html", weight: 10 },
  { file: "splash-concept-lightning.html", weight: 10 },
  { file: "splash-concept-rain.html", weight: 10 },
  { file: "splash-concept-click.html", weight: 10 },
  { file: "splash-concept-breathe.html", weight: 10 }
];

if (process.platform === "win32") {
  app.setAppUserModelId(appId);
}

function getIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(__dirname, "icon.ico");
}

function normalizeAppUrl(targetUrl) {
  try {
    const url = new URL(targetUrl);
    if (!allowedHosts.has(url.hostname)) return null;

    const pathName = url.pathname.replace(/\/+$/, "") || "/";
    if (pathName === "/" || pathName === "/index.html") return appUrl;

    return targetUrl;
  } catch {
    return null;
  }
}

function loadAppHome(window) {
  if (window.isDestroyed()) return;
  window.loadURL(appUrl);
}

function selectSplashFile() {
  const totalWeight = splashVariants.reduce((sum, variant) => sum + variant.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of splashVariants) {
    random -= variant.weight;
    if (random <= 0) return variant.file;
  }

  return splashVariants[0].file;
}

function createWindow() {
  const iconPath = getIconPath();
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "PointerScore",
    icon: iconPath,
    backgroundColor: "#eef8ff",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    const normalizedUrl = normalizeAppUrl(url);
    if (normalizedUrl) {
      window.loadURL(normalizedUrl);
      return { action: "deny" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const normalizedUrl = normalizeAppUrl(url);
    if (normalizedUrl) {
      if (normalizedUrl !== url) {
        event.preventDefault();
        window.loadURL(normalizedUrl);
      }
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  window.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  window.loadFile(path.join(__dirname, selectSplashFile()));
  window.webContents.once("did-finish-load", () => {
    setTimeout(() => loadAppHome(window), splashDurationMs);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
