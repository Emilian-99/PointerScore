import { getVerifiedUser, safeRedirect, supabase } from "./auth-client.js";

const forms = [...document.querySelectorAll("[data-auth-form]")];
const viewButtons = [...document.querySelectorAll("[data-auth-view-button]")];
const title = document.querySelector("[data-auth-title]");
const message = document.querySelector("[data-auth-message]");
const titles = {
  login: "Willkommen zurück",
  register: "Konto erstellen",
  reset: "Passwort zurücksetzen",
  recovery: "Neues Passwort festlegen"
};

function setMessage(text = "", type = "") {
  message.textContent = text;
  message.dataset.type = type;
}

function showView(view, { updateUrl = true } = {}) {
  const nextView = ["login", "register", "reset", "recovery"].includes(view) ? view : "login";
  viewButtons.forEach((button) => {
    const active = button.dataset.authViewButton === nextView;
    if (button.getAttribute("role") === "tab") {
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    }
  });
  forms.forEach((form) => { form.hidden = form.dataset.authForm !== nextView; });
  title.textContent = titles[nextView];
  document.title = `${titles[nextView]} | PointerScore 100`;
  setMessage();

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextView);
    window.history.pushState({ authView: nextView }, "", url);
  }
}

function setBusy(form, busy) {
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = busy;
  form.setAttribute("aria-busy", String(busy));
}

viewButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.authViewButton)));

document.querySelector('[data-auth-form="login"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);
  setMessage("Anmeldung wird geprüft …");
  const { error } = await supabase.auth.signInWithPassword({
    email: String(values.get("email") || "").trim(),
    password: String(values.get("password") || "")
  });
  setBusy(form, false);
  if (error) return setMessage("Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.", "error");
  window.location.replace(safeRedirect("dashboard.html"));
});

document.querySelector('[data-auth-form="register"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);
  setMessage("Konto wird erstellt …");
  const { data, error } = await supabase.auth.signUp({
    email: String(values.get("email") || "").trim(),
    password: String(values.get("password") || ""),
    options: { emailRedirectTo: new URL("dashboard.html", window.location.href).href }
  });
  setBusy(form, false);
  if (error) return setMessage(error.message, "error");
  if (data.session) window.location.replace(safeRedirect("dashboard.html"));
  else setMessage("Fast geschafft: Bitte bestätige deine E-Mail-Adresse.", "success");
});

document.querySelector('[data-auth-form="reset"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);
  const recoveryUrl = new URL("auth.html?mode=recovery", window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(String(values.get("email") || "").trim(), {
    redirectTo: recoveryUrl
  });
  setBusy(form, false);
  if (error) return setMessage(error.message, "error");
  setMessage("Wenn ein Konto existiert, wurde ein Reset-Link gesendet.", "success");
});

document.querySelector('[data-auth-form="recovery"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const password = String(values.get("password") || "");
  if (password !== String(values.get("passwordConfirm") || "")) {
    return setMessage("Die Passwörter stimmen nicht überein.", "error");
  }
  setBusy(form, true);
  const { error } = await supabase.auth.updateUser({ password });
  setBusy(form, false);
  if (error) return setMessage(error.message, "error");
  setMessage("Passwort aktualisiert. Du wirst weitergeleitet.", "success");
  window.setTimeout(() => window.location.replace(safeRedirect("dashboard.html")), 900);
});

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") showView("recovery");
});

const requestedMode = new URLSearchParams(window.location.search).get("mode");
showView(requestedMode || "login", { updateUrl: false });

window.addEventListener("popstate", () => {
  const mode = new URLSearchParams(window.location.search).get("mode");
  showView(mode || "login", { updateUrl: false });
});

if (requestedMode !== "recovery" && await getVerifiedUser()) {
  window.location.replace(safeRedirect("dashboard.html"));
}
