const { app, BrowserWindow, Menu, shell, ipcMain, dialog, session } = require("electron");
const { APP_ORIGIN, isAppURL, installLocalRenderer, callbackURL, safeExternalURL } = require("./local-renderer.cjs");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

// This compatibility origin is served entirely from the installed renderer, never the website.
const appUrl = APP_ORIGIN + "/dashboard.html";
let mainAppWindow = null;
let pendingCallback = process.argv.map(callbackURL).find(Boolean) || null;
const appId = "com.pointerscore.app";
const splashDurationMs = 13100;
const appPreRevealMs = 12700;
const appRevealFadeMs = 2000;
const classicSplashFile = "splash-concept-fill.html";
const specialSplashFiles = [
  "splash-concept.html",
  "splash-concept-lightning.html",
  "splash-concept-rain.html",
  "splash-concept-click.html",
  "splash-concept-breathe.html"
];
const specialSplashChance = 0.25;
const splashBagFileName = "splash-variant-bag.json";

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
    if (!isAppURL(targetUrl)) return null;

    const pathName = url.pathname.replace(/\/+$/, "") || "/";
    if (pathName === "/" || pathName === "/index.html") return withDesktopAppMarker(APP_ORIGIN + "/auth.html");

    return withDesktopAppMarker(targetUrl);
  } catch {
    return null;
  }
}

function withDesktopAppMarker(targetUrl) {
  try {
    const url = new URL(targetUrl);
    url.searchParams.set("desktopApp", "1");
    return url.toString();
  } catch {
    return targetUrl;
  }
}

function isSpecialSplashFile(file) {
  return specialSplashFiles.includes(file);
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function createSpecialSplashQueue(lastFile = "") {
  const queue = shuffle(specialSplashFiles);
  if (queue.length > 1 && queue[0] === lastFile) {
    [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  return queue;
}

function splashStatePath() {
  return path.join(app.getPath("userData"), splashBagFileName);
}

function readSplashState() {
  try {
    const state = JSON.parse(fsSync.readFileSync(splashStatePath(), "utf8"));
    const validFiles = new Set([classicSplashFile, ...specialSplashFiles]);
    return {
      specialQueue: Array.isArray(state.specialQueue)
        ? state.specialQueue.filter((file) => specialSplashFiles.includes(file))
        : [],
      lastFile: validFiles.has(state.lastFile) ? state.lastFile : ""
    };
  } catch {
    return { specialQueue: [], lastFile: "" };
  }
}

function writeSplashState(state) {
  try {
    fsSync.mkdirSync(path.dirname(splashStatePath()), { recursive: true });
    fsSync.writeFileSync(splashStatePath(), JSON.stringify(state), "utf8");
  } catch {
    // The animation can still start with the default variant if persistence fails.
  }
}

function selectSplashFile() {
  const state = readSplashState();
  if (Math.random() >= specialSplashChance) {
    writeSplashState({ specialQueue: state.specialQueue, lastFile: classicSplashFile });
    return classicSplashFile;
  }

  const specialQueue = state.specialQueue.length
    ? state.specialQueue
    : createSpecialSplashQueue(state.lastFile);
  const selected = specialQueue.shift() || classicSplashFile;

  writeSplashState({ specialQueue, lastFile: selected });
  return selected;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizePdfFileName(fileName) {
  const normalized = String(fileName || "PointerScore-Analyse.pdf")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const safeName = normalized || "PointerScore-Analyse.pdf";
  return safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
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

function createReportWindowOptions() {
  return {
    width: 980,
    height: 760,
    minWidth: 760,
    minHeight: 560,
    title: "PointerScore PDF",
    icon: getIconPath(),
    backgroundColor: "#edf7ff",
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      partition: "persist:pointerscore",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  };
}

function attachAppNavigation(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: createReportWindowOptions()
      };
    }

    const normalizedUrl = normalizeAppUrl(url);
    if (normalizedUrl) {
      window.loadURL(normalizedUrl);
      return { action: "deny" };
    }

    if (safeExternalURL(url)) shell.openExternal(url);
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
    if (safeExternalURL(url)) shell.openExternal(url);
  });

  window.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
  });
}

ipcMain.handle("pointerscore:save-analysis-pdf", async (event, payload = {}) => {
  const reportHtml = String(payload.html || "");
  if (!reportHtml.trim()) {
    return { ok: false, error: "empty-report" };
  }

  const ownerWindow = BrowserWindow.fromWebContents(event.sender);
  const defaultPath = sanitizePdfFileName(payload.fileName);
  const pdfWindow = new BrowserWindow({
    width: 980,
    height: 760,
    show: false,
    title: "PointerScore PDF",
    icon: getIconPath(),
    backgroundColor: "#edf7ff",
    autoHideMenuBar: true,
    webPreferences: {
      partition: "persist:pointerscore",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(reportHtml)}`);
    await wait(450);

    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: { marginType: "none" }
    });

    const result = await dialog.showSaveDialog(ownerWindow || undefined, {
      title: "PointerScore PDF speichern",
      defaultPath,
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    await fs.writeFile(result.filePath, pdfBuffer);
    return { ok: true, filePath: result.filePath };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  } finally {
    if (!pdfWindow.isDestroyed()) pdfWindow.destroy();
  }
});

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
  if (!appWindow.isDestroyed() && !appWindow.isVisible()) appWindow.show();
  if (!splashWindow.isDestroyed()) {
    splashWindow.setAlwaysOnTop(false);
    splashWindow.close();
  }
  if (!appWindow.isDestroyed()) appWindow.focus();

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

async function showAppBehindSplash(appWindow, splashWindow) {
  await prepareAppReveal(appWindow);
  if (!splashWindow.isDestroyed()) splashWindow.setAlwaysOnTop(true);
  if (!appWindow.isDestroyed() && !appWindow.isVisible()) {
    if (typeof appWindow.showInactive === "function") appWindow.showInactive();
    else appWindow.show();
  }
  if (!splashWindow.isDestroyed()) splashWindow.focus();
}

function createWindow() {
  const splashWindow = createBaseWindow({ backgroundColor: "#000000" });
  const appWindow = createBaseWindow({ backgroundColor: "#000000" });
  mainAppWindow = appWindow;

  attachAppNavigation(appWindow);
  appWindow.webContents.setUserAgent(`${appWindow.webContents.getUserAgent()} PointerScoreDesktop/1.0`);

  splashWindow.once("ready-to-show", () => {
    if (!splashWindow.isDestroyed()) splashWindow.show();
  });

  splashWindow.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  splashWindow.loadFile(path.join(__dirname, selectSplashFile()));
  appWindow.loadURL(withDesktopAppMarker(pendingCallback || appUrl));
  pendingCallback = null;
  const appReady = waitForAppReady(appWindow);

  Promise.all([
    wait(appPreRevealMs),
    appReady
  ]).then(() => showAppBehindSplash(appWindow, splashWindow));

  Promise.all([
    wait(splashDurationMs),
    appReady
  ]).then(() => revealAppWindow(appWindow, splashWindow));
}

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();
app.on("second-instance", (_event, argv) => {
  const target = argv.map(callbackURL).find(Boolean);
  if (target && mainAppWindow && !mainAppWindow.isDestroyed()) mainAppWindow.loadURL(withDesktopAppMarker(target));
  else if (target) pendingCallback = target;
  if (mainAppWindow && !mainAppWindow.isDestroyed()) { if (mainAppWindow.isMinimized()) mainAppWindow.restore(); mainAppWindow.show(); mainAppWindow.focus(); }
});
app.on("open-url", (event, value) => {
  event.preventDefault();
  const target=callbackURL(value);
  if (!target) return;
  if (mainAppWindow && !mainAppWindow.isDestroyed()) mainAppWindow.loadURL(withDesktopAppMarker(target));
  else pendingCallback=target;
});

app.whenReady().then(async () => {
  if (!hasLock) return;
  await installLocalRenderer(session.fromPartition("persist:pointerscore"), path.join(__dirname,"renderer"));
  // Installers/Store manifest register the protocol; never change OS associations in development.
  if (app.isPackaged && process.platform !== "win32") app.setAsDefaultProtocolClient("pointerscore");
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch(error => {
  dialog.showErrorBox("PointerScore", "Die lokalen App-Dateien konnten nicht geladen werden. Bitte installiere PointerScore erneut. / Local app files could not be loaded. Please reinstall PointerScore.");
  console.error("Bundled renderer could not start:", error?.code || "initialization-failed");
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
