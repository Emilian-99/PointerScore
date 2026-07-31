import { getVerifiedUser, safeRedirect, supabase } from "./auth-client.js";

const forms = [...document.querySelectorAll("[data-auth-form]")];
const viewButtons = [...document.querySelectorAll("[data-auth-view-button]")];
const title = document.querySelector("[data-auth-title]");
const message = document.querySelector("[data-auth-message]");
const resendConfirmationButton = document.querySelector("[data-resend-confirmation]");
let lastConfirmationEmail = "";
const titles = {
  login: { de: "Willkommen zurück", en: "Welcome back" },
  register: { de: "Konto erstellen", en: "Create account" },
  reset: { de: "Passwort zurücksetzen", en: "Reset password" },
  recovery: { de: "Neues Passwort festlegen", en: "Set a new password" }
};
let activeView = "login";

function currentLanguage() {
  return window.PointerScoreI18n?.language || document.documentElement.lang || "de";
}

function copy(de, en) {
  return currentLanguage() === "en" ? en : de;
}

function isRateLimitError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.status === 429 ||
    error?.code === "over_email_send_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("email rate");
}

function friendlyAuthError(error, fallback) {
  if (isRateLimitError(error)) {
    return copy(
      "Zu viele E-Mails in kurzer Zeit. Bitte warte einen Moment und versuche es später erneut.",
      "Too many emails were requested in a short time. Please wait a moment and try again later."
    );
  }
  return fallback || error?.message || copy("Es ist ein Fehler aufgetreten.", "Something went wrong.");
}

function setMessage(text = "", type = "") {
  message.textContent = text;
  message.dataset.type = type;
}

function showResendConfirmationButton(show) {
  if (!resendConfirmationButton) return;
  resendConfirmationButton.hidden = !show;
}

function showView(view, { updateUrl = true } = {}) {
  const nextView = ["login", "register", "reset", "recovery"].includes(view) ? view : "login";
  activeView = nextView;
  viewButtons.forEach((button) => {
    const active = button.dataset.authViewButton === nextView;
    if (button.getAttribute("role") === "tab") {
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    }
  });
  forms.forEach((form) => { form.hidden = form.dataset.authForm !== nextView; });
  const translatedTitle = titles[nextView][currentLanguage()] || titles[nextView].de;
  title.textContent = translatedTitle;
  document.title = `${translatedTitle} | PointerScore`;
  setMessage();
  if (nextView !== "register") showResendConfirmationButton(false);

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
  if (error?.code === "email_not_confirmed") {
    return setMessage(copy("Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe auch deinen Spam-Ordner.", "Please confirm your email address first. Also check your spam folder."), "error");
  }
  if (error) return setMessage(friendlyAuthError(error, copy("Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.", "Sign-in failed. Please check your email and password.")), "error");
  window.location.replace(safeRedirect("dashboard.html"));
});

document.querySelector('[data-auth-form="register"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);
  setMessage("Konto wird erstellt …");
  const email = String(values.get("email") || "").trim();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: String(values.get("password") || ""),
    options: { emailRedirectTo: new URL("dashboard.html", window.location.href).href }
  });
  setBusy(form, false);
  if (error) return setMessage(friendlyAuthError(error), "error");
  if (data.session) window.location.replace(safeRedirect("dashboard.html"));
  else {
    lastConfirmationEmail = email;
    showResendConfirmationButton(true);
    setMessage(copy(
      `Fast geschafft: Wir haben eine Bestätigungs-E-Mail an ${email} gesendet. Bitte klicke auf den Link in der E-Mail.`,
      `Almost done: We sent a confirmation email to ${email}. Please click the link in the email.`
    ), "success");
  }
});

resendConfirmationButton?.addEventListener("click", async () => {
  const form = document.querySelector('[data-auth-form="register"]');
  const email = lastConfirmationEmail || String(new FormData(form).get("email") || "").trim();
  if (!email) {
    return setMessage(copy("Bitte gib zuerst deine E-Mail-Adresse ein.", "Please enter your email address first."), "error");
  }
  resendConfirmationButton.disabled = true;
  setMessage(copy("Bestätigungs-E-Mail wird erneut gesendet …", "Sending confirmation email again …"));
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: new URL("dashboard.html", window.location.href).href }
  });
  resendConfirmationButton.disabled = false;
  if (error) return setMessage(friendlyAuthError(error), "error");
  lastConfirmationEmail = email;
  setMessage(copy(
    `Die Bestätigungs-E-Mail wurde erneut an ${email} gesendet. Bitte prüfe auch deinen Spam-Ordner.`,
    `The confirmation email was sent again to ${email}. Please also check your spam folder.`
  ), "success");
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
  if (error) return setMessage(friendlyAuthError(error), "error");
  setMessage(copy("Wenn ein Konto existiert, wurde eine PointerScore-E-Mail zum Zurücksetzen des Passworts gesendet. Bitte prüfe auch deinen Spam-Ordner.", "If an account exists, a PointerScore password reset email has been sent. Please also check your spam folder."), "success");
});

document.querySelector('[data-auth-form="recovery"]').addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const password = String(values.get("password") || "");
  if (password !== String(values.get("passwordConfirm") || "")) {
    return setMessage(copy("Die Passwörter stimmen nicht überein.", "The passwords do not match."), "error");
  }
  setBusy(form, true);
  const { error } = await supabase.auth.updateUser({ password });
  setBusy(form, false);
  if (error) return setMessage(friendlyAuthError(error), "error");
  setMessage(copy("Passwort aktualisiert. Du wirst weitergeleitet.", "Password updated. You will be redirected."), "success");
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

window.addEventListener("pointerscore:languagechange", () => {
  showView(activeView, { updateUrl: false });
});

if (requestedMode !== "recovery" && await getVerifiedUser()) {
  window.location.replace(safeRedirect("dashboard.html"));
}
