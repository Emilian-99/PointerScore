const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("PointerScoreDesktop", {
  platform: process.platform,
  isDesktopApp: true,
  saveAnalysisPdf(reportHtml, fileName) {
    return ipcRenderer.invoke("pointerscore:save-analysis-pdf", {
      html: String(reportHtml || ""),
      fileName: String(fileName || "PointerScore-Analyse.pdf")
    });
  }
});

function markDesktopApp() {
  document.documentElement?.classList.add("pointerscore-desktop-app");
  document.body?.classList.add("is-desktop-app");
}

markDesktopApp();
window.addEventListener("DOMContentLoaded", markDesktopApp);
