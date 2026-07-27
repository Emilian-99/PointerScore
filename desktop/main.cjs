const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const appUrl = process.env.POINTERSCORE_APP_URL || "https://pointerscore.com/dashboard.html";
const allowedHosts = new Set(["pointerscore.com", "www.pointerscore.com"]);
const appId = "com.pointerscore.app";
const splashDurationMs = 12650;
const appRevealFadeMs = 680;
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

function selectSplashFile() {
  const totalWeight = splashVariants.reduce((sum, variant) => sum + variant.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of splashVariants) {
    random -= variant.weight;
    if (random <= 0) return variant.file;
  }

  return splashVariants[0].file;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createBaseWindow(options = {}) {
  const iconPath = getIconPath();
  return new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "PointerScore",
    icon: iconPath,
    backgroundColor: options.backgroundColor || "#eef8ff",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      partition: "persist:pointerscore",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
}

function attachAppNavigation(window) {
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
}

async function waitForAppReady(window) {
  const startedAt = Date.now();

  while (!window.isDestroyed() && Date.now() - startedAt < 15000) {
    try {
      const ready = await window.webContents.executeJavaScript(`
        (() => {
          const path = window.location.pathname;
          const body = document.body;
          return path.endsWith("/auth.html") || !body?.classList.contains("is-auth-loading");
        })()
      `);

      if (ready) return;
    } catch {
      // The page can be between navigations while the app is starting.
    }

    await wait(120);
  }
}

async function prepareAppReveal(window) {
  if (window.isDestroyed()) return;
  try {
    await window.webContents.executeJavaScript(`
      (() => {
        const existing = document.getElementById("pointerscore-desktop-reveal");
        existing?.remove();
        const overlay = document.createElement("div");
        overlay.id = "pointerscore-desktop-reveal";
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.cssText = [
          "position:fixed",
          "inset:0",
          "z-index:2147483647",
          "background:#000",
          "opacity:1",
          "pointer-events:none",
          "transition:opacity ${appRevealFadeMs}ms cubic-bezier(.22,.8,.25,1)"
        ].join(";");
        document.documentElement.append(overlay);
      })()
    `);
  } catch {
    // If the page navigates at exactly this moment, the normal app window still opens.
  }
}

async function revealAppWindow(appWindow, splashWindow) {
  await prepareAppReveal(appWindow);
  if (!appWindow.isDestroyed()) appWindow.show();
  if (!splashWindow.isDestroyed()) splashWindow.close();

  setTimeout(() => {
    if (appWindow.isDestroyed()) return;
    appWindow.webContents.executeJavaScript(`
      (() => {
        const overlay = document.getElementById("pointerscore-desktop-reveal");
        if (!overlay) return;
        requestAnimationFrame(() => {
          overlay.style.opacity = "0";
          window.setTimeout(() => overlay.remove(), ${appRevealFadeMs + 80});
        });
      })()
    `).catch(() => {});
  }, 70);
}

function createWindow() {
  const splashWindow = createBaseWindow({ backgroundColor: "#000000" });
  const appWindow = createBaseWindow({ backgroundColor: "#000000" });

  attachAppNavigation(appWindow);

  splashWindow.once("ready-to-show", () => {
    if (!splashWindow.isDestroyed()) splashWindow.show();
  });

  splashWindow.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  splashWindow.loadFile(path.join(__dirname, selectSplashFile()));
  appWindow.loadURL(appUrl);

  Promise.all([
    wait(splashDurationMs),
    waitForAppReady(appWindow)
  ]).then(() => revealAppWindow(appWindow, splashWindow));
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
