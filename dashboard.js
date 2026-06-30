import { requireUser, revealProtectedPage, supabase } from "./auth-client.js";

const STORAGE_KEY = "pointerscore-analyses";

function readAnalyses() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat(document.documentElement.lang === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" }).format(date);
}

function getUserDisplayName(user) {
  const savedName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  if (savedName) return String(savedName).trim();

  const emailName = String(user?.email || "").split("@")[0];
  const inferredName = emailName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("de-DE") + part.slice(1).toLocaleLowerCase("de-DE"))
    .join(" ");
  return inferredName || "zurück";
}

function renderAnalyses() {
  const analyses = readAnalyses();
  const scores = analyses.map((analysis) => Number(analysis.score)).filter(Number.isFinite);
  const best = analyses.reduce((current, analysis) => !current || Number(analysis.score) > Number(current.score) ? analysis : current, null);

  document.querySelector("[data-stat-count]").textContent = String(analyses.length);
  document.querySelector("[data-stat-average]").textContent = scores.length ? String(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)) : "–";
  document.querySelector("[data-stat-best]").textContent = best?.company || "–";
  document.querySelector("[data-stat-best-score]").textContent = best ? `${Math.round(Number(best.score))} Punkte` : "Noch keine Daten";

  const list = document.querySelector("[data-analysis-list]");
  const emptyState = document.querySelector("[data-empty-state]");
  list.replaceChildren();
  emptyState.hidden = analyses.length > 0;
  list.hidden = analyses.length === 0;

  analyses
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((analysis) => {
      const card = document.createElement("article");
      card.className = "dashboard-analysis-card";
      card.innerHTML = `
        <div class="dashboard-analysis-company"><span>Unternehmen</span><strong></strong></div>
        <div class="dashboard-analysis-score"><span>PointerScore</span><strong></strong><small>/ 100</small></div>
        <div class="dashboard-analysis-date"><span>Erstellt am</span><strong></strong></div>
        <div class="dashboard-analysis-actions">
          <a class="button button-secondary" href="rechner/">Öffnen</a>
          <button class="dashboard-delete-button" type="button">Löschen</button>
        </div>`;
      card.querySelector(".dashboard-analysis-company strong").textContent = analysis.company || "Unbenannte Analyse";
      card.querySelector(".dashboard-analysis-score strong").textContent = String(Math.max(0, Math.min(100, Math.round(Number(analysis.score) || 0))));
      card.querySelector(".dashboard-analysis-date strong").textContent = formatDate(analysis.createdAt);
      card.querySelector(".dashboard-analysis-actions a").href = `rechner/?analysis=${encodeURIComponent(analysis.id)}${isLocalPreview ? "&preview=1" : ""}`;
      card.querySelector(".dashboard-delete-button").addEventListener("click", () => {
        const remaining = readAnalyses().filter((item) => item.id !== analysis.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        renderAnalyses();
      });
      list.append(card);
    });
}

const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).get("preview") === "1";
const user = isLocalPreview
  ? { email: "demo@pointerscore.com" }
  : await requireUser();

if (isLocalPreview) {
  document.querySelectorAll("[data-calculator-link]").forEach((link) => { link.href = "rechner/?preview=1"; });
}

if (user) {
  document.querySelectorAll("[data-user-email]").forEach((element) => { element.textContent = user.email || "–"; });
  document.querySelectorAll("[data-user-name]").forEach((element) => { element.textContent = getUserDisplayName(user); });
  renderAnalyses();
  revealProtectedPage();
}

document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => {
  button.disabled = true;
  await supabase.auth.signOut({ scope: "local" });
  window.location.replace("index.html");
}));
