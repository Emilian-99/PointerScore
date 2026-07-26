(() => {
  const t = (value) => window.PointerScoreI18n?.translate(value) ?? value;
  const dismissedKey = "pointerscore.installPrompt.dismissed";
  const forceInstallPrompt = ["1", "true", "yes"].includes(new URLSearchParams(window.location.search).get("install") || "");
  const popupDelay = 2000;
  let deferredInstallPrompt = null;
  let popupTimer = 0;

  const installButtons = () => [...document.querySelectorAll("[data-install-app]")];
  const dialog = document.querySelector("[data-install-dialog]");

  function isInstalledAppView() {
    return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isMobileView() {
    return window.matchMedia?.("(max-width: 760px)").matches;
  }

  function updateInstallButtons() {
    installButtons().forEach((button) => {
      button.hidden = isInstalledAppView() || isMobileView();
    });
  }

  function closeDialog() {
    if (!dialog) return;
    if (dialog.open) dialog.close();
  }

  if (forceInstallPrompt) localStorage.removeItem(dismissedKey);

  function showDashboardInstallPopup(force = false) {
    if (!dialog || isInstalledAppView()) return;
    if (isMobileView()) return;
    if (!force && localStorage.getItem(dismissedKey) === "1") return;
    if (document.body.classList.contains("onboarding-tour-open")) {
      queueDashboardInstallPopup(force);
      return;
    }
    if (dialog.open || isInstalledAppView()) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  function queueDashboardInstallPopup(force = false) {
    window.clearTimeout(popupTimer);
    if (document.body.classList.contains("onboarding-tour-open")) {
      window.addEventListener("pointerscore:onboarding-complete", () => queueDashboardInstallPopup(force), { once: true });
      return;
    }
    popupTimer = window.setTimeout(() => showDashboardInstallPopup(force), popupDelay);
  }

  async function startInstallFlow() {
    if (isInstalledAppView()) {
      closeDialog();
      updateInstallButtons();
      return;
    }

    if (deferredInstallPrompt) {
      const promptEvent = deferredInstallPrompt;
      deferredInstallPrompt = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") closeDialog();
      updateInstallButtons();
      return;
    }

    window.alert(t("Du kannst PointerScore über das Browser-Menü als App installieren. Suche nach „App installieren“ oder „Zum Startbildschirm hinzufügen“."));
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButtons();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    closeDialog();
    updateInstallButtons();
  });

  window.addEventListener("pointerscore:dashboard-ready", () => queueDashboardInstallPopup(forceInstallPrompt));

  installButtons().forEach((button) => button.addEventListener("click", () => { void startInstallFlow(); }));
  document.querySelectorAll("[data-install-close]").forEach((button) => button.addEventListener("click", closeDialog));
  document.querySelector("[data-install-never]")?.addEventListener("click", () => {
    localStorage.setItem(dismissedKey, "1");
    closeDialog();
  });
  dialog?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeDialog();
  });

  updateInstallButtons();
})();
