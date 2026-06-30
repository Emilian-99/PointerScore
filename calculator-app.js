import { requireUser, revealProtectedPage, supabase } from "./auth-client.js";
import { calculatePointerScore, INDUSTRIES, MARKET_POSITIONS } from "./calculator-logic.js";

const user = await requireUser();
if (user) {
  document.querySelectorAll("[data-user-email]").forEach((element) => { element.textContent = user.email || "–"; });
  revealProtectedPage();
}

document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", async () => {
  await supabase.auth.signOut({ scope: "local" });
  window.location.replace("index.html");
}));

const form = document.querySelector("[data-calculator-form]");
const industry = form.querySelector("[data-industry]");
const marketPosition = form.querySelector("[data-market-position]");
const score = document.querySelector("[data-calculator-score]");
const ring = document.querySelector("[data-calculator-ring]");
const signal = document.querySelector("[data-calculator-signal]");
const summary = document.querySelector("[data-calculator-summary]");
const categories = document.querySelector("[data-calculator-categories]");
const metrics = document.querySelector("[data-calculator-metrics]");
const strengths = document.querySelector("[data-calculator-strengths]");
const questions = document.querySelector("[data-calculator-questions]");

industry.innerHTML = INDUSTRIES.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
marketPosition.innerHTML = MARKET_POSITIONS.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
industry.value = "cloud";
marketPosition.value = "leader";

function numberValue(name) {
  return Number(form.elements.namedItem(name).value);
}

function readInput() {
  return {
    industry: industry.value,
    marketPosition: marketPosition.value,
    revenue1: numberValue("revenue1"), revenue2: numberValue("revenue2"), revenue3: numberValue("revenue3"),
    profit1: numberValue("profit1"), profit2: numberValue("profit2"), profit3: numberValue("profit3"),
    totalDebt: numberValue("totalDebt"), totalAssets: numberValue("totalAssets"),
    currentProfit: numberValue("currentProfit"), currentRevenue: numberValue("currentRevenue"),
    peRatio: numberValue("peRatio"), qualityMetric: numberValue("qualityMetric")
  };
}

function formatPercent(value) {
  return Number.isFinite(value) ? new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value) + " %" : "–";
}

function render() {
  const result = calculatePointerScore(readInput());
  if (!result.ok) {
    signal.textContent = "Bitte Eingaben prüfen";
    summary.textContent = Object.values(result.errors).join(" ");
    return;
  }

  score.textContent = String(result.total);
  ring.style.setProperty("--score", result.total + "%");
  ring.style.setProperty("--ring-color", result.signal.key === "strong" ? "#168b69" : result.signal.key === "watch" ? "#2f8fe9" : "#d46762");
  signal.textContent = result.signal.label;
  summary.textContent = result.signal.copy;
  categories.innerHTML = result.categories.map((category) => `<div class="demo-category-row"><p><span>${category.label}</span><strong>${category.score} / ${category.max}</strong></p><i><b class="is-filled" style="--bar:${Math.round(category.score / category.max * 100)}%"></b></i></div>`).join("");
  metrics.innerHTML = [
    ["Ø Umsatzwachstum", result.metrics.averageRevenueGrowth],
    ["Ø Gewinnwachstum", result.metrics.averageProfitGrowth],
    ["Schuldenquote", result.metrics.debtRatio],
    ["Nettomarge", result.metrics.netMargin]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${formatPercent(value)}</strong></div>`).join("");
  strengths.innerHTML = result.analysis.strengths.map((item) => `<li>${item}</li>`).join("");
  questions.innerHTML = result.analysis.potential.map((item) => `<li>${item}</li>`).join("");
}

form.addEventListener("submit", (event) => { event.preventDefault(); render(); });
form.addEventListener("change", render);
form.addEventListener("reset", () => window.setTimeout(() => {
  industry.value = "cloud";
  marketPosition.value = "leader";
  render();
}, 0));

render();
