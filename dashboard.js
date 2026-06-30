import { requireUser, revealProtectedPage, supabase } from "./auth-client.js";

const user = await requireUser();

if (user) {
  document.querySelectorAll("[data-user-email]").forEach((element) => { element.textContent = user.email || "–"; });
  const signIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  document.querySelectorAll("[data-last-sign-in]").forEach((element) => {
    element.textContent = signIn
      ? new Intl.DateTimeFormat(document.documentElement.lang === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" }).format(signIn)
      : "–";
  });
  revealProtectedPage();
}

document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => {
  button.disabled = true;
  await supabase.auth.signOut({ scope: "local" });
  window.location.replace("index.html");
}));
