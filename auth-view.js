(() => {
  const forms = [...document.querySelectorAll("[data-auth-form]")];
  const viewButtons = [...document.querySelectorAll("[data-auth-view-button]")];
  const title = document.querySelector("[data-auth-title]");
  const message = document.querySelector("[data-auth-message]");
  const titles = {
    login: { de: "Willkommen zurück", en: "Welcome back" },
    register: { de: "Konto erstellen", en: "Create account" },
    reset: { de: "Passwort zurücksetzen", en: "Reset password" },
    recovery: { de: "Neues Passwort festlegen", en: "Set a new password" }
  };
  let activeView = "login";

  function currentLanguage() {
    return document.documentElement.lang === "en" ? "en" : "de";
  }

  function setMessage(text = "", type = "") {
    message.textContent = text;
    message.dataset.type = type;
  }

  function showView(view, { updateUrl = true } = {}) {
    const nextView = Object.hasOwn(titles, view) ? view : "login";
    activeView = nextView;
    forms.forEach((form) => { form.hidden = form.dataset.authForm !== nextView; });
    viewButtons.forEach((button) => {
      const active = button.dataset.authViewButton === nextView;
      if (button.getAttribute("role") === "tab") {
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      }
    });
    const translatedTitle = titles[nextView][currentLanguage()] || titles[nextView].de;
    title.textContent = translatedTitle;
    document.title = `${translatedTitle} | PointerScore`;
    setMessage();

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", nextView);
      window.history.pushState({ authView: nextView }, "", url);
    }
  }

  viewButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.authViewButton)));
  window.addEventListener("popstate", () => {
    showView(new URLSearchParams(window.location.search).get("mode") || "login", { updateUrl: false });
  });
  window.addEventListener("pointerscore:languagechange", () => showView(activeView, { updateUrl: false }));
  showView(new URLSearchParams(window.location.search).get("mode") || "login", { updateUrl: false });
  window.PointerScoreAuthView = Object.freeze({ setMessage, showView });
})();
