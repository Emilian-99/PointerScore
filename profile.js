import { requireUser, revealProtectedPage, supabase } from "./auth-client.js";

const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "1";
const previewNow = new Date().toISOString();
const user = isLocalPreview ? { id: "7f6e91af-demo-profile", email: "demo@pointerscore.com", created_at: "2026-06-28T12:00:00Z", last_sign_in_at: previewNow, user_metadata: { full_name: "Demo Nutzer" } } : await requireUser();
if (!user) throw new Error("Authentication required.");

const profileForm = document.querySelector("[data-profile-form]");
const passwordForm = document.querySelector("[data-password-form]");
const avatarInput = document.querySelector("[data-avatar-input]");
const deleteDialog = document.querySelector("[data-delete-dialog]");
const t = (value) => window.PointerScoreI18n?.translate(value) ?? value;
let currentProfile = null;

function formatDate(value, includeTime = false) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat(document.documentElement.lang === "en" ? "en-GB" : "de-DE", includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function setStatus(selector, message = "", type = "") {
  const element = document.querySelector(selector);
  if (!element) return;
  element.textContent = message;
  element.dataset.type = type;
  element.hidden = !message;
}

function initials(name, email) {
  const source = String(name || email?.split("@")[0] || "PS").trim();
  return source.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "PS";
}

function renderAvatar(url, name) {
  const image = document.querySelector("[data-avatar-image]");
  const fallback = document.querySelector("[data-avatar-initials]");
  fallback.textContent = initials(name, user.email);
  image.hidden = !url;
  fallback.hidden = Boolean(url);
  if (url) image.src = url;
}

function renderProfile(profile) {
  currentProfile = profile;
  profileForm.elements.displayName.value = profile?.display_name || user.user_metadata?.full_name || "";
  profileForm.elements.username.value = profile?.username || "";
  profileForm.elements.email.value = user.email || "";
  renderAvatar(profile?.avatar_url, profileForm.elements.displayName.value);
  document.querySelector("[data-member-since]").textContent = formatDate(user.created_at);
  document.querySelector("[data-last-sign-in]").textContent = formatDate(user.last_sign_in_at, true);
  document.querySelector("[data-account-id]").textContent = user.id;
}

function renderSubscription(subscription) {
  const active = ["active", "trialing"].includes(subscription?.status);
  document.querySelector("[data-subscription-active]").hidden = !active;
  document.querySelector("[data-subscription-inactive]").hidden = active;
  const badge = document.querySelector("[data-subscription-status]");
  badge.textContent = active ? `✓ ${t("Abo aktiv")}` : `✕ ${t("Kein aktives Abo")}`;
  badge.classList.toggle("is-active", active);
  if (active) {
    document.querySelector("[data-next-billing]").textContent = formatDate(subscription.current_period_end);
    const manage = document.querySelector("[data-manage-subscription]");
    if (subscription.manage_url) manage.href = subscription.manage_url;
    else { manage.removeAttribute("href"); manage.setAttribute("aria-disabled", "true"); manage.title = t("Die Abo-Verwaltung wird mit dem Zahlungsanbieter verbunden."); }
  }
}

function renderStatistics(analyses) {
  const scores = analyses.map((item) => Number(item.score)).filter(Number.isFinite);
  const latest = analyses.slice().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  document.querySelector("[data-profile-count]").textContent = String(analyses.length);
  document.querySelector("[data-profile-average]").textContent = scores.length ? String(Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)) : "–";
  document.querySelector("[data-profile-highest]").textContent = scores.length ? String(Math.round(Math.max(...scores))) : "–";
  document.querySelector("[data-profile-latest]").textContent = latest ? `${latest.company_name} · ${formatDate(latest.updated_at)}` : "–";
}

async function loadProfile() {
  if (isLocalPreview) {
    renderProfile({ display_name: "Demo Nutzer", username: "demo_investor", avatar_url: null });
    renderSubscription(null);
    renderStatistics([{ company_name: "Nordlicht Systems AG", score: 82, updated_at: previewNow }, { company_name: "Atlas Consumer SE", score: 68, updated_at: "2026-06-30T10:00:00Z" }]);
    return;
  }
  const [profileResult, subscriptionResult, analysesResult] = await Promise.all([
    supabase.from("profiles").select("id,display_name,username,avatar_url,created_at,updated_at").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("status,current_period_end,manage_url").eq("user_id", user.id).maybeSingle(),
    supabase.from("analyses").select("company_name,score,updated_at").eq("user_id", user.id)
  ]);
  if (profileResult.error) throw profileResult.error;
  if (subscriptionResult.error) throw subscriptionResult.error;
  if (analysesResult.error) throw analysesResult.error;
  renderProfile(profileResult.data);
  renderSubscription(subscriptionResult.data);
  renderStatistics(analysesResult.data || []);
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = profileForm.querySelector('button[type="submit"]');
  const displayName = profileForm.elements.displayName.value.trim();
  const username = profileForm.elements.username.value.trim().toLowerCase();
  if (username && !/^[a-z0-9_]{3,32}$/.test(username)) return setStatus("[data-profile-form-status]", t("Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten."), "error");
  button.disabled = true;
  setStatus("[data-profile-form-status]", t("Profil wird gespeichert …"));
  try {
    const next = { id: user.id, display_name: displayName || null, username: username || null, avatar_url: currentProfile?.avatar_url || null, updated_at: new Date().toISOString() };
    if (!isLocalPreview) {
      const { data, error } = await supabase.from("profiles").upsert(next).select().single();
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: displayName, username, avatar_url: data.avatar_url } });
      currentProfile = data;
    } else currentProfile = next;
    renderAvatar(currentProfile.avatar_url, displayName);
    setStatus("[data-profile-form-status]", t("Profil gespeichert."), "success");
  } catch (error) {
    setStatus("[data-profile-form-status]", error?.code === "23505" ? t("Dieser Benutzername ist bereits vergeben.") : t("Profil konnte nicht gespeichert werden."), "error");
  } finally { button.disabled = false; }
});

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return setStatus("[data-profile-status]", t("Das Profilbild darf höchstens 2 MB groß sein."), "error");
  setStatus("[data-profile-status]", t("Profilbild wird hochgeladen …"));
  try {
    if (isLocalPreview) {
      renderAvatar(URL.createObjectURL(file), profileForm.elements.displayName.value);
    } else {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { data: saved, error } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      currentProfile = saved;
      await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      renderAvatar(avatarUrl, profileForm.elements.displayName.value);
    }
    setStatus("[data-profile-status]", t("Profilbild aktualisiert."), "success");
  } catch (error) { setStatus("[data-profile-status]", t("Profilbild konnte nicht hochgeladen werden."), "error"); }
  finally { avatarInput.value = ""; }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = passwordForm.elements.password.value;
  const confirmation = passwordForm.elements.passwordConfirm.value;
  if (password !== confirmation) return setStatus("[data-password-status]", t("Die Passwörter stimmen nicht überein."), "error");
  const button = passwordForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus("[data-password-status]", t("Passwort wird aktualisiert …"));
  try {
    if (!isLocalPreview) { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; }
    passwordForm.reset();
    setStatus("[data-password-status]", t("Passwort wurde geändert."), "success");
  } catch (error) { setStatus("[data-password-status]", t("Passwort konnte nicht geändert werden."), "error"); }
  finally { button.disabled = false; }
});

document.querySelector("[data-delete-open]").addEventListener("click", () => deleteDialog.showModal());
document.querySelector("[data-delete-form]").addEventListener("submit", async (event) => {
  const submitter = event.submitter;
  if (submitter?.value !== "confirm") return;
  event.preventDefault();
  const form = event.currentTarget;
  if (form.elements.confirmation.value.trim().toLocaleUpperCase("de-DE") !== "LÖSCHEN") return setStatus("[data-delete-status]", t("Bitte gib LÖSCHEN vollständig ein."), "error");
  submitter.disabled = true;
  setStatus("[data-delete-status]", t("Konto wird gelöscht …"));
  try {
    if (!isLocalPreview) { const { error } = await supabase.rpc("delete_own_account"); if (error) throw error; await supabase.auth.signOut({ scope: "local" }); }
    window.location.replace("index.html");
  } catch (error) { submitter.disabled = false; setStatus("[data-delete-status]", t("Konto konnte nicht gelöscht werden."), "error"); }
});

if (isLocalPreview) {
  document.querySelectorAll("[data-dashboard-link]").forEach((link) => { link.href = "dashboard.html?preview=1"; });
  document.querySelectorAll("[data-calculator-link]").forEach((link) => { link.href = "rechner/?preview=1"; });
}
document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; if (!isLocalPreview) await supabase.auth.signOut({ scope: "local" }); window.location.replace("index.html"); }));

revealProtectedPage();
try { await loadProfile(); } catch (error) { setStatus("[data-profile-status]", t("Profildaten konnten nicht geladen werden. Bitte versuche es später erneut."), "error"); renderProfile(null); renderSubscription(null); renderStatistics([]); }
