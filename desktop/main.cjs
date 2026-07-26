const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const appUrl = process.env.POINTERSCORE_APP_URL || "https://pointerscore.com/dashboard.html";
const allowedHosts = new Set(["pointerscore.com", "www.pointerscore.com"]);

function isAllowedAppUrl(targetUrl) {
  try {
    const url = new URL(targetUrl);
    return allowedHosts.has(url.hostname);
  } catch {
    return false;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "PointerScore",
    icon: path.join(__dirname, "..", "favicon.ico"),
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
    if (isAllowedAppUrl(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAllowedAppUrl(url)) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  window.loadURL(appUrl);
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
