const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("PointerScoreDesktop", {
  platform: process.platform,
  isDesktopApp: true
});

function markDesktopApp() {
  document.documentElement?.classList.add("pointerscore-desktop-app");
  document.body?.classList.add("is-desktop-app");
}

markDesktopApp();
window.addEventListener("DOMContentLoaded", markDesktopApp);
