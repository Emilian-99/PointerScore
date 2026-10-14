import { supabase } from "./auth-client.js";

const message = document.querySelector("[data-callback-message]");
const form = document.querySelector("[data-recovery-form]");
const url = new URL(window.location.href);
const recovery = url.searchParams.get("mode") === "recovery" || new URLSearchParams(url.hash.slice(1)).get("type") === "recovery";
const openDesktop = document.querySelector("[data-open-desktop]");
const verifyBrowser = document.querySelector("[data-verify-browser]");
const hash = new URLSearchParams(url.hash.slice(1));
if (!url.searchParams.has("error") && !hash.has("error") && (url.searchParams.has("code") || (hash.has("access_token") && hash.has("refresh_token")))) {
  const appLink = new URL("pointerscore://auth/callback");
  if (url.searchParams.has("code")) appLink.searchParams.set("code", url.searchParams.get("code"));
  if (recovery) appLink.searchParams.set("mode", "recovery");
  appLink.hash = url.hash;
  openDesktop.href = appLink.href;
  openDesktop.hidden = false;
}

// Do not consume a desktop PKCE code in an unrelated browser context automatically.
async function verifyInBrowser() {
verifyBrowser.disabled = true;
try {
  const hash = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has("error") || hash.has("error")) throw new Error("Invalid callback");
  const code = url.searchParams.get("code");
  let verification;
  if (code) verification = await supabase.auth.exchangeCodeForSession(code);
  else if (hash.get("access_token") && hash.get("refresh_token")) {
    verification = await supabase.auth.setSession({ access_token: hash.get("access_token"), refresh_token: hash.get("refresh_token") });
  } else throw new Error("Missing verification code");
  if (verification.error || !verification.data.session) throw new Error("Verification failed");
  const { data, error } = await supabase.auth.getUser();
  // Remove link parameters after Supabase has processed them; never log credentials.
  history.replaceState(null, "", url.pathname);
  if (error || !data.user) {
    message.textContent = "Der Link konnte nicht bestätigt werden. Öffne ihn auf dem Gerät, auf dem du ihn angefordert hast, oder fordere in der App einen neuen Link an. / This link could not be verified. Open it on the device where you requested it, or request a new link in the app.";
  } else if (recovery) {
    message.textContent = "Lege dein neues Passwort fest. / Set your new password.";
    form.hidden = false;
  } else {
    message.textContent = "Deine E-Mail-Adresse ist bestätigt. Du kannst dich jetzt in der App anmelden. / Your email is confirmed. You can now sign in in the app.";
  }
} catch {
  history.replaceState(null, "", url.pathname);
  message.textContent = "Der Link konnte nicht bestätigt werden. Öffne ihn auf dem Gerät, auf dem du ihn angefordert hast, oder fordere in der App einen neuen Link an. / This link could not be verified. Open it on the device where you requested it, or request a new link in the app.";
}
verifyBrowser.hidden = true;
openDesktop.hidden = true;
}
verifyBrowser.addEventListener("click", verifyInBrowser);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const values = new FormData(form);
  if (values.get("password") !== values.get("confirmation")) {
    message.textContent = "Die Passwörter stimmen nicht überein. / The passwords do not match.";
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const { error } = await supabase.auth.updateUser({ password: String(values.get("password")) });
    if (error) throw error;
    form.reset();
    form.hidden = true;
    message.textContent = "Passwort gespeichert. Melde dich jetzt in der App an. / Password saved. Sign in in the app.";
  } catch {
    message.textContent = "Passwort konnte nicht gespeichert werden. Prüfe den Link und versuche es erneut. / Could not save your password. Check your link and try again.";
  } finally {
    button.disabled = false;
  }
});
