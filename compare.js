import { requireUser, revealProtectedPage, supabase } from "./auth-client.js";

const STORAGE_KEY = "pointerscore-analyses";
const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).get("preview") === "1";
const t = (value) => window.PointerScoreI18n?.translate(value) ?? value;

const demoAnalyses = [
  {
    id: "preview-a", company: "Nordlicht Systems AG", score: 82, notes: "Starke Qualität und gute Margen. Bewertung beim nächsten Quartalsbericht erneut prüfen.",
    input: { peRatio: 22, qualityMetricType: "ROIC", qualityMetric: 19 },
    result: {
      total: 82,
      categories: [
        { key: "future", label: "Zukunftspotenzial", score: 22, max: 25 },
        { key: "growth", label: "Wachstum", score: 18, max: 25 },
        { key: "stability", label: "Finanzielle Stabilität", score: 17, max: 20 },
        { key: "valuation", label: "Bewertung", score: 7, max: 10 },
        { key: "quality", label: "Unternehmensqualität", score: 18, max: 20 }
      ],
      metrics: { averageRevenueGrowth: 14.8, averageProfitGrowth: 18.4, debtRatio: 24.2, netMargin: 17.6 }
    }
  },
  {
    id: "preview-b", company: "Atlas Consumer SE", score: 68, notes: "Solide Bewertung, aber das Gewinnwachstum bleibt der wichtigste Beobachtungspunkt.",
    input: { peRatio: 17, qualityMetricType: "ROE", qualityMetric: 14 },
    result: {
      total: 68,
      categories: [
        { key: "future", label: "Zukunftspotenzial", score: 17, max: 25 },
        { key: "growth", label: "Wachstum", score: 13, max: 25 },
        { key: "stability", label: "Finanzielle Stabilität", score: 15, max: 20 },
        { key: "valuation", label: "Bewertung", score: 9, max: 10 },
        { key: "quality", label: "Unternehmensqualität", score: 14, max: 20 }
      ],
      metrics: { averageRevenueGrowth: 6.3, averageProfitGrowth: 8.1, debtRatio: 35.5, netMargin: 11.9 }
    }
  }
];

function readAnalyses() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const analyses = Array.isArray(stored) ? stored.filter((item) => item?.result?.categories && item?.result?.metrics) : [];
    return isLocalPreview && analyses.length < 2 ? demoAnalyses : analyses;
  } catch {
    return isLocalPreview ? demoAnalyses : [];
  }
}

const selects = [...document.querySelectorAll("[data-compare-select]")];
const empty = document.querySelector("[data-compare-empty]");
const results = document.querySelector("[data-compare-results]");
let analyses = readAnalyses();

function percent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "–";
  return new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-GB" : "de-DE", { maximumFractionDigits: 1 }).format(number) + " %";
}

function number(value, suffix = "") {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "–";
  return new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-GB" : "de-DE", { maximumFractionDigits: 1 }).format(parsed) + suffix;
}

function fillSelects() {
  selects.forEach((select, selectIndex) => {
    const previous = select.value;
    select.replaceChildren();
    analyses.forEach((analysis, index) => {
      const option = document.createElement("option");
      option.value = analysis.id;
      option.textContent = analysis.company || t("Unbenannte Analyse");
      select.append(option);
      if (previous === analysis.id || (!previous && index === selectIndex)) option.selected = true;
    });
  });
  if (analyses.length > 1 && selects[0].value === selects[1].value) selects[1].value = analyses[1].id;
}

function scoreCard(analysis, isWinner) {
  const card = document.createElement("article");
  card.className = "compare-score-card" + (isWinner ? " is-winner" : "");
  card.innerHTML = '<span class="compare-winner-label"></span><h2></h2><div class="compare-score-value"><strong></strong><span>/ 100</span></div><a class="compare-open-link"></a>';
  card.querySelector(".compare-winner-label").textContent = isWinner ? t("Höherer Score") : "PointerScore";
  card.querySelector("h2").textContent = analysis.company || t("Unbenannte Analyse");
  card.querySelector("strong").textContent = String(Math.round(Number(analysis.score ?? analysis.result.total) || 0));
  const link = card.querySelector("a");
  link.textContent = t("Analyse öffnen");
  link.href = `rechner/?analysis=${encodeURIComponent(analysis.id)}${isLocalPreview ? "&preview=1" : ""}`;
  return card;
}

function renderComparison() {
  const left = analyses.find((item) => item.id === selects[0]?.value);
  const right = analyses.find((item) => item.id === selects[1]?.value);
  const canCompare = analyses.length >= 2 && left && right && left.id !== right.id;
  empty.hidden = analyses.length >= 2;
  results.hidden = !canCompare;
  if (!canCompare) return;

  const leftScore = Number(left.score ?? left.result.total) || 0;
  const rightScore = Number(right.score ?? right.result.total) || 0;
  const scoreGrid = document.querySelector("[data-score-comparison]");
  scoreGrid.replaceChildren(scoreCard(left, leftScore > rightScore), scoreCard(right, rightScore > leftScore));

  document.querySelector("[data-left-name]").textContent = left.company;
  document.querySelector("[data-right-name]").textContent = right.company;

  const categoryList = document.querySelector("[data-category-comparison]");
  categoryList.replaceChildren();
  left.result.categories.forEach((leftCategory) => {
    const rightCategory = right.result.categories.find((item) => item.key === leftCategory.key) || {};
    const row = document.createElement("article");
    row.className = "compare-category-row";
    row.innerHTML = '<h3></h3><div class="compare-category-values"><div><strong></strong><span class="compare-bar"><i></i></span></div><div><strong></strong><span class="compare-bar"><i></i></span></div></div>';
    row.querySelector("h3").textContent = t(leftCategory.label);
    const columns = row.querySelectorAll(".compare-category-values > div");
    [[columns[0], leftCategory], [columns[1], rightCategory]].forEach(([column, category]) => {
      const score = Number(category.score) || 0;
      const max = Number(category.max) || Number(leftCategory.max) || 1;
      column.querySelector("strong").textContent = `${score} / ${max}`;
      column.querySelector("i").style.width = `${Math.max(0, Math.min(100, score / max * 100))}%`;
    });
    categoryList.append(row);
  });

  const metricRows = [
    ["Ø Umsatzwachstum", percent(left.result.metrics.averageRevenueGrowth), percent(right.result.metrics.averageRevenueGrowth)],
    ["Ø Gewinnwachstum", percent(left.result.metrics.averageProfitGrowth), percent(right.result.metrics.averageProfitGrowth)],
    ["Schuldenquote", percent(left.result.metrics.debtRatio), percent(right.result.metrics.debtRatio)],
    ["Nettomarge", percent(left.result.metrics.netMargin), percent(right.result.metrics.netMargin)],
    ["KGV", number(left.input?.peRatio, "x"), number(right.input?.peRatio, "x")],
    [left.input?.qualityMetricType === right.input?.qualityMetricType ? (left.input?.qualityMetricType || "ROE / ROIC") : "ROE / ROIC", percent(left.input?.qualityMetric), percent(right.input?.qualityMetric)]
  ];
  const metricBody = document.querySelector("[data-metric-comparison]");
  metricBody.replaceChildren();
  metricRows.forEach(([label, leftValue, rightValue]) => {
    const row = document.createElement("tr");
    [t(label), leftValue, rightValue].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    metricBody.append(row);
  });

  const noteGrid = document.querySelector("[data-note-comparison]");
  noteGrid.replaceChildren();
  [left, right].forEach((analysis) => {
    const note = document.createElement("article");
    note.className = "compare-note-card";
    const heading = document.createElement("h3");
    heading.textContent = analysis.company || t("Unbenannte Analyse");
    const copy = document.createElement("p");
    copy.textContent = String(analysis.notes || "").trim() || t("Keine Notiz gespeichert.");
    note.append(heading, copy);
    noteGrid.append(note);
  });
}

const user = isLocalPreview ? { email: "demo@pointerscore.com" } : await requireUser();
if (isLocalPreview) {
  document.querySelectorAll("[data-dashboard-link]").forEach((link) => { link.href = "dashboard.html?preview=1"; });
  document.querySelectorAll("[data-calculator-link]").forEach((link) => { link.href = "rechner/?preview=1"; });
}

if (user) {
  fillSelects();
  renderComparison();
  revealProtectedPage();
}

selects.forEach((select, index) => select.addEventListener("change", () => {
  const other = selects[index === 0 ? 1 : 0];
  if (select.value === other.value) {
    const alternative = analyses.find((item) => item.id !== select.value);
    if (alternative) other.value = alternative.id;
  }
  renderComparison();
}));

window.addEventListener("pointerscore:languagechange", () => {
  if (!user) return;
  fillSelects();
  renderComparison();
});

document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => {
  button.disabled = true;
  await supabase.auth.signOut({ scope: "local" });
  window.location.replace("index.html");
}));
