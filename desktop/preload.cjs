const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("PointerScoreDesktop", {
  platform: process.platform,
  isDesktopApp: true
});
