import { calculatePointerScore } from "./calculator-logic.js";
import { companies } from "./demo-company-data.js?v=4";

const copy = {
  de: {
    signals: {
      strong: ["Starkes PointerScore-Signal", "Das Datenbild überzeugt in mehreren Bereichen. Prüfe vor einer Entscheidung trotzdem Bewertung, Risiken und Aktualität der Daten."],
      watch: ["Genauer beobachten", "Das Unternehmen zeigt klare Stärken, hat nach der PointerScore-Methode aber auch Bereiche, die genauer geprüft werden sollten."],
      weak: ["Offene Fragen", "Das Datenbild zeigt mehrere Schwächen oder offene Punkte. Eine vertiefte Recherche ist besonders wichtig."]
    },
    categories: { future: "Zukunftspotenzial", growth: "Wachstum", stability: "Finanzielle Stabilität", valuation: "Bewertung", quality: "Unternehmensqualität" },
    metrics: [["revenueGrowth12", "Umsatz J1 → J2"], ["revenueGrowth23", "Umsatz J2 → J3"], ["averageRevenueGrowth", "Ø Umsatzwachstum"], ["profitGrowth12", "Gewinn J1 → J2"], ["profitGrowth23", "Gewinn J2 → J3"], ["averageProfitGrowth", "Ø Gewinnwachstum"], ["debtRatio", "Schuldenquote"], ["netMargin", "Nettomarge"]],
    analysis: {
      "Starke Marktposition": "Starke Marktposition", "Starkes Umsatzwachstum": "Starkes Umsatzwachstum", "Solides Umsatzwachstum": "Solides Umsatzwachstum",
      "Dynamisches Gewinnwachstum": "Dynamisches Gewinnwachstum", "Hohe Profitabilität": "Hohe Profitabilität", "Solide Profitabilität": "Solide Profitabilität",
      "Solide Bilanz": "Solide Bilanz", "Moderate Bewertung nach KGV": "Moderate Bewertung nach KGV", "Hohe Kapitaleffizienz": "Hohe Kapitaleffizienz",
      "Umsatzwachstum ausbaufähig": "Umsatzwachstum ausbaufähig", "Rückläufige Umsatzentwicklung": "Rückläufige Umsatzentwicklung",
      "Gewinnentwicklung mit Verbesserungspotenzial": "Gewinnentwicklung mit Verbesserungspotenzial", "Nettomarge unter 10 %": "Nettomarge unter 10 %",
      "Erhöhte Schuldenquote": "Erhöhte Schuldenquote", "Bewertung relativ hoch": "Bewertung relativ hoch",
      "Marktposition mit Ausbaupotenzial": "Marktposition mit Ausbaupotenzial", "Kapitaleffizienz ausbaufähig": "Kapitaleffizienz ausbaufähig",
      "Keine deutliche Schwäche im gewählten Datenbild": "Keine deutliche Schwäche im gewählten Datenbild"
    }
  },
  en: {
    signals: {
      strong: ["Strong PointerScore signal", "The data is convincing across several areas. Before making a decision, still review valuation, risks and how current the data is."],
      watch: ["Take a closer look", "The company shows clear strengths, but the PointerScore method also highlights areas that deserve closer review."],
      weak: ["Open questions", "The data shows several weaknesses or open points. More detailed research is especially important."]
    },
    categories: { future: "Future potential", growth: "Growth", stability: "Financial stability", valuation: "Valuation", quality: "Company quality" },
    metrics: [["revenueGrowth12", "Revenue Y1 → Y2"], ["revenueGrowth23", "Revenue Y2 → Y3"], ["averageRevenueGrowth", "Avg. revenue growth"], ["profitGrowth12", "Profit Y1 → Y2"], ["profitGrowth23", "Profit Y2 → Y3"], ["averageProfitGrowth", "Avg. profit growth"], ["debtRatio", "Debt ratio"], ["netMargin", "Net margin"]],
    analysis: {
      "Starke Marktposition": "Strong market position", "Starkes Umsatzwachstum": "Strong revenue growth", "Solides Umsatzwachstum": "Solid revenue growth",
      "Dynamisches Gewinnwachstum": "Dynamic profit growth", "Hohe Profitabilität": "High profitability", "Solide Profitabilität": "Solid profitability",
      "Solide Bilanz": "Solid balance sheet", "Moderate Bewertung nach KGV": "Moderate P/E valuation", "Hohe Kapitaleffizienz": "High capital efficiency",
      "Umsatzwachstum ausbaufähig": "Revenue growth could improve", "Rückläufige Umsatzentwicklung": "Declining revenue trend",
      "Gewinnentwicklung mit Verbesserungspotenzial": "Profit development could improve", "Nettomarge unter 10 %": "Net margin below 10%",
      "Erhöhte Schuldenquote": "Elevated debt ratio", "Bewertung relativ hoch": "Relatively high valuation",
      "Marktposition mit Ausbaupotenzial": "Market position could improve", "Kapitaleffizienz ausbaufähig": "Capital efficiency could improve",
      "Keine deutliche Schwäche im gewählten Datenbild": "No clear weakness in the selected data"
    }
  }
};

const demo = document.querySelector("[data-calculator-demo]");
const companyButtons = [...(demo?.querySelectorAll("[data-demo-company-button]") || [])];
const score = demo?.querySelector("[data-demo-score]");
const ring = demo?.querySelector("[data-demo-ring]");
const currentTicker = demo?.querySelector("[data-demo-current-ticker]");
const currentName = demo?.querySelector("[data-demo-current-name]");
const dataNote = demo?.querySelector("[data-demo-data-note]");
const sourceLink = demo?.querySelector("[data-demo-source-link]");
const signal = demo?.querySelector("[data-demo-signal]");
const summary = demo?.querySelector("[data-demo-summary]");
const categories = demo?.querySelector("[data-demo-categories]");
const metrics = demo?.querySelector("[data-demo-metrics]");
const strengths = demo?.querySelector("[data-demo-strengths]");
const questions = demo?.querySelector("[data-demo-questions]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let animationFrame = 0;
let renderVersion = 0;
let selectedCompany = "apple";

function language() {
  return document.documentElement.lang === "en" ? "en" : "de";
}

function formatPercent(value, lang) {
  if (!Number.isFinite(value)) return "–";
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value) + " %";
}

function formatMultiple(value, lang) {
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value) + " x";
}

function companyMetricLabels(company, lang) {
  const [year1, year2, year3] = company.years;
  const revenue = lang === "de" ? "Umsatz" : "Revenue";
  const profit = lang === "de" ? "Gewinn" : "Profit";
  return [
    ["revenueGrowth12", revenue + " " + year1 + " → " + year2],
    ["revenueGrowth23", revenue + " " + year2 + " → " + year3],
    ["averageRevenueGrowth", lang === "de" ? "Ø Umsatzwachstum" : "Avg. revenue growth"],
    ["profitGrowth12", profit + " " + year1 + " → " + year2],
    ["profitGrowth23", profit + " " + year2 + " → " + year3],
    ["averageProfitGrowth", lang === "de" ? "Ø Gewinnwachstum" : "Avg. profit growth"]
  ];
}

function animateScore(target, color) {
  cancelAnimationFrame(animationFrame);
  const startValue = Number(score.textContent) || 0;
  const duration = reducedMotion.matches ? 0 : 850;
  const started = performance.now();
  ring.style.setProperty("--ring-color", color);

  const frame = (now) => {
    const progress = duration === 0 ? 1 : Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startValue + (target - startValue) * eased);
    score.textContent = String(current);
    ring.style.setProperty("--score", current + "%");
    if (progress < 1) animationFrame = requestAnimationFrame(frame);
  };

  animationFrame = requestAnimationFrame(frame);
}

function listMarkup(items, lang) {
  return items.map((item) => "<li>" + (copy[lang].analysis[item] || item) + "</li>").join("");
}

function applyScoreOverride(result, override, lang) {
  if (!override) return result;

  const categories = result.categories.map((category) => ({
    ...category,
    score: override.categories[category.key]
  }));
  const total = categories.reduce((sum, category) => sum + category.score, 0);
  const signal = total >= 80 ? { key: "strong" } : total >= 60 ? { key: "watch" } : { key: "weak" };

  return {
    ...result,
    categories,
    total,
    signal,
    analysis: override.analysis[lang]
  };
}

function renderDemo() {
  if (!demo || !companyButtons.length) return;
  const company = companies[selectedCompany] || companies.apple;
  demo.dataset.selectedCompany = selectedCompany;
  const activeButton = companyButtons.find((button) => button.getAttribute("data-demo-company-button") === selectedCompany);
  currentTicker.textContent = activeButton?.querySelector("span")?.textContent || "";
  currentName.textContent = company.name;
  const editorialPrefix = company.scoreOverride
    ? (language() === "de" ? "Vorgegebene Kategorien · " : "Specified category scores · ")
    : "";
  dataNote.textContent = language() === "de"
    ? editorialPrefix + company.period.de + " · Bilanz " + company.balanceDate + " · ROE · KGV " + company.peDate
    : editorialPrefix + company.period.en + " · Balance sheet " + company.balanceDate + " · ROE · P/E " + company.peDate;
  sourceLink.href = company.sourceUrl;
  sourceLink.textContent = language() === "de" ? "Finanzquelle" : "Financial source";
  companyButtons.forEach((button) => {
    const active = button.getAttribute("data-demo-company-button") === selectedCompany;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const calculatedResult = calculatePointerScore(company.input);
  if (!calculatedResult.ok) return;

  const lang = language();
  const result = applyScoreOverride(calculatedResult, company.scoreOverride, lang);
  const version = ++renderVersion;
  const signalCopy = copy[lang].signals[result.signal.key];
  const color = result.signal.key === "strong" ? "#168b69" : result.signal.key === "watch" ? "#2f8fe9" : "#d46762";

  demo.dataset.signal = result.signal.key;
  signal.textContent = signalCopy[0];
  summary.textContent = signalCopy[1];

  categories.innerHTML = result.categories.map((category) => {
    const width = Math.round((category.score / category.max) * 100);
    return '<div class="demo-category-row"><p><span>' + copy[lang].categories[category.key] + '</span><strong>' + category.score + ' / ' + category.max + '</strong></p><i><b data-demo-bar style="--bar:' + width + '%"></b></i></div>';
  }).join("");

  const calculatedMetrics = companyMetricLabels(company, lang).map(([key, label]) =>
    '<div><span>' + label + '</span><strong>' + formatPercent(result.metrics[key], lang) + '</strong></div>'
  );
  calculatedMetrics.push(
    '<div><span>' + (lang === "de" ? "Schuldenquote" : "Debt ratio") + '</span><strong>' + formatPercent(result.metrics.debtRatio, lang) + '</strong></div>',
    '<div><span>' + (lang === "de" ? "Nettomarge" : "Net margin") + '</span><strong>' + formatPercent(result.metrics.netMargin, lang) + '</strong></div>',
    '<div><span>' + (lang === "de" ? "KGV" : "P/E ratio") + '</span><strong>' + formatMultiple(company.input.peRatio, lang) + '</strong></div>',
    '<div><span>ROE</span><strong>' + (company.qualityMetricDisplay?.[lang] || formatPercent(company.input.qualityMetric, lang)) + '</strong></div>'
  );
  metrics.innerHTML = calculatedMetrics.join("");

  strengths.innerHTML = listMarkup(result.analysis.strengths.slice(0, 3), lang);
  questions.innerHTML = listMarkup(result.analysis.potential.slice(0, 3), lang);

  animateScore(result.total, color);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (version !== renderVersion) return;
    categories.querySelectorAll("[data-demo-bar]").forEach((bar) => bar.classList.add("is-filled"));
  }));
}

demo?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-demo-company-button]");
  if (!button || !demo.contains(button)) return;
  selectedCompany = button.getAttribute("data-demo-company-button") || "apple";
  renderDemo();
});
demo?.addEventListener("keydown", (event) => {
  const button = event.target.closest("[data-demo-company-button]");
  if (!button || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;

  event.preventDefault();
  const currentIndex = companyButtons.indexOf(button);
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextButton = companyButtons[(currentIndex + direction + companyButtons.length) % companyButtons.length];
  nextButton.focus();
  nextButton.click();
});
new MutationObserver((mutations) => {
  if (mutations.some((mutation) => mutation.attributeName === "lang")) renderDemo();
}).observe(document.documentElement, { attributes: true });

renderDemo();
