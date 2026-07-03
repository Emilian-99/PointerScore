import { requireUser, revealProtectedPage, supabase } from "./auth-client.js";
import { deleteAnalysis, friendlyAnalysisError, listAnalyses, readAnalysisCache, saveAnalysis } from "./analysis-store.js";

const t = (value) => window.PointerScoreI18n?.translate(value) ?? value;
let analyses = [];

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat(document.documentElement.lang === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" }).format(date);
}

function getUserDisplayName(user) {
  const savedName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  if (savedName) return String(savedName).trim();
  const emailName = String(user?.email || "").split("@")[0];
  return emailName.split(/[._-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ") || "zurück";
}

function setStatus(text = "", type = "") {
  const status = document.querySelector("[data-analysis-status]");
  status.textContent = text;
  status.dataset.type = type;
  status.hidden = !text;
}

function renderAnalyses() {
  const scores = analyses.map((analysis) => Number(analysis.score)).filter(Number.isFinite);
  const best = analyses.reduce((current, analysis) => !current || Number(analysis.score) > Number(current.score) ? analysis : current, null);
  document.querySelector("[data-stat-count]").textContent = String(analyses.length);
  document.querySelector("[data-stat-average]").textContent = scores.length ? String(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)) : "–";
  document.querySelector("[data-stat-best]").textContent = best?.company || "–";
  document.querySelector("[data-stat-best-score]").textContent = best ? `${Math.round(Number(best.score))} ${t("Punkte")}` : t("Noch keine Daten");

  const list = document.querySelector("[data-analysis-list]");
  const emptyState = document.querySelector("[data-empty-state]");
  list.replaceChildren();
  emptyState.hidden = analyses.length > 0;
  list.hidden = analyses.length === 0;

  analyses.forEach((analysis) => {
    const card = document.createElement("article");
    card.className = "dashboard-analysis-card";
    card.innerHTML = `
      <div class="dashboard-analysis-company"><span>${t("Unternehmen")}</span><strong></strong></div>
      <div class="dashboard-analysis-score"><span>PointerScore</span><strong></strong><small>/ 100</small></div>
      <div class="dashboard-analysis-date"><span>${t("Erstellt am")}</span><strong></strong></div>
      <div class="dashboard-analysis-actions"><a class="button button-secondary" href="rechner/">${t("Öffnen")}</a><button class="dashboard-delete-button" type="button">${t("Löschen")}</button></div>
      <details class="dashboard-analysis-note"><summary>${t(analysis.notes ? "Notiz anzeigen / bearbeiten" : "Notiz hinzufügen")}</summary><label><span>${t("Persönliche Notiz")}</span><textarea maxlength="600" rows="4"></textarea></label><div><button type="button">${t("Notiz speichern")}</button><small role="status"></small></div></details>`;
    card.querySelector(".dashboard-analysis-company strong").textContent = analysis.company || t("Unbenannte Analyse");
    card.querySelector(".dashboard-analysis-score strong").textContent = String(Math.max(0, Math.min(100, Math.round(Number(analysis.score) || 0))));
    card.querySelector(".dashboard-analysis-date strong").textContent = formatDate(analysis.createdAt);
    card.querySelector(".dashboard-analysis-actions a").href = `rechner/?analysis=${encodeURIComponent(analysis.id)}${isLocalPreview ? "&preview=1" : ""}`;

    const noteInput = card.querySelector("textarea");
    const noteButton = card.querySelector(".dashboard-analysis-note button");
    const noteStatus = card.querySelector(".dashboard-analysis-note small");
    noteInput.value = String(analysis.notes || "");
    noteButton.addEventListener("click", async () => {
      noteButton.disabled = true;
      noteStatus.textContent = t("Wird gespeichert …");
      try {
        const saved = isLocalPreview ? { ...analysis, notes: noteInput.value.trim() } : await saveAnalysis(user.id, { ...analysis, notes: noteInput.value.trim() });
        analyses = analyses.map((item) => item.id === saved.id ? saved : item);
        card.querySelector("summary").textContent = t(saved.notes ? "Notiz anzeigen / bearbeiten" : "Notiz hinzufügen");
        noteStatus.textContent = t("Notiz gespeichert.");
      } catch (error) {
        noteStatus.textContent = friendlyAnalysisError(error, t("Notiz konnte nicht gespeichert werden."));
      } finally {
        noteButton.disabled = false;
      }
    });

    const deleteButton = card.querySelector(".dashboard-delete-button");
    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;
      try {
        if (!isLocalPreview) await deleteAnalysis(user.id, analysis.id);
        analyses = analyses.filter((item) => item.id !== analysis.id);
        renderAnalyses();
        setStatus(t("Analyse gelöscht."), "success");
      } catch (error) {
        deleteButton.disabled = false;
        setStatus(friendlyAnalysisError(error, t("Analyse konnte nicht gelöscht werden.")), "error");
      }
    });
    list.append(card);
  });
}

const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname) && new URLSearchParams(window.location.search).get("preview") === "1";
const user = isLocalPreview ? { id: "preview", email: "demo@pointerscore.com" } : await requireUser();

if (isLocalPreview) {
  document.querySelectorAll("[data-calculator-link]").forEach((link) => { link.href = "rechner/?preview=1"; });
  document.querySelectorAll("[data-compare-link]").forEach((link) => { link.href = "compare.html?preview=1"; });
  document.querySelectorAll("[data-profile-link]").forEach((link) => { link.href = "profile.html?preview=1"; });
}

if (user) {
  document.querySelectorAll("[data-user-email]").forEach((element) => { element.textContent = user.email || "–"; });
  document.querySelectorAll("[data-user-name]").forEach((element) => { element.textContent = getUserDisplayName(user); });
  revealProtectedPage();
  setStatus(t("Analysen werden aus der Cloud geladen …"), "loading");
  try {
    analyses = isLocalPreview ? readAnalysisCache(user.id) : await listAnalyses(user.id);
    setStatus();
  } catch (error) {
    analyses = readAnalysisCache(user.id);
    setStatus(friendlyAnalysisError(error, t("Cloud-Daten konnten nicht geladen werden. Es wird der letzte lokale Stand angezeigt.")), "error");
  }
  renderAnalyses();
}

window.addEventListener("pointerscore:languagechange", () => { if (user) renderAnalyses(); });
document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; await supabase.auth.signOut({ scope: "local" }); window.location.replace("index.html"); }));
