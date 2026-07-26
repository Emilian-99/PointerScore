(() => {
  const dismissedKey = "pointerscore.installPrompt.dismissed";
  const forceInstallPrompt = ["1", "true", "yes"].includes(new URLSearchParams(window.location.search).get("install") || "");
  const popupDelay = 2000;
  let popupTimer = 0;

  const installButtons = () => [...document.querySelectorAll("[data-install-app]")];
  const dialog = document.querySelector("[data-install-dialog]");

  function isMobileView() {
    return window.matchMedia?.("(max-width: 760px)").matches;
  }

  function updateInstallButtons() {
    installButtons().forEach((button) => {
      button.hidden = isMobileView();
    });
  }

  function closeDialog() {
    if (!dialog) return;
    if (dialog.open) dialog.close();
  }

  if (forceInstallPrompt) localStorage.removeItem(dismissedKey);

  function showDashboardInstallPopup(force = false) {
    if (!dialog) return;
    if (isMobileView()) return;
    if (!force && localStorage.getItem(dismissedKey) === "1") return;
    if (document.body.classList.contains("onboarding-tour-open")) {
      queueDashboardInstallPopup(force);
      return;
    }
    if (dialog.open) return;
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

  window.addEventListener("pointerscore:dashboard-ready", () => queueDashboardInstallPopup(forceInstallPrompt));

  installButtons().forEach((button) => button.addEventListener("click", closeDialog));
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
