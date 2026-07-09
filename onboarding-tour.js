const isCalculator = location.pathname.includes("/rechner/");
const params = new URLSearchParams(location.search);
const preview = params.get("preview") === "1";
const rootPath = isCalculator ? "../" : "";
const calculatorPath = `${rootPath}rechner/${preview ? "?preview=1" : ""}`;
const dashboardPath = `${rootPath}dashboard.html${preview ? "?preview=1" : ""}`;
const stateKey = "pointerscore:onboarding-step";
const userKey = "pointerscore:onboarding-user";

const copy = {
  de: [
    ["Willkommen bei PointerScore 👋", "Willkommen bei PointerScore! Mit unserem Bewertungssystem analysierst du Unternehmen strukturiert und nachvollziehbar. In weniger als einer Minute zeigen wir dir die wichtigsten Funktionen."],
    ["Dashboard", "Hier findest du deine gespeicherten Analysen, Statistiken und alle wichtigen Funktionen."],
    ["Neue Analyse erstellen", "Klicke hier, um ein Unternehmen zu analysieren und einen neuen PointerScore zu berechnen."],
    ["Der Rechner", "Trage die Finanzkennzahlen des Unternehmens ein. PointerScore berechnet daraus automatisch den Gesamtscore."],
    ["Analysen speichern", "Alle Analysen können gespeichert, später bearbeitet und auf allen Geräten mit deinem Konto synchronisiert werden."],
    ["Hilfe", "Falls du einmal nicht weiter weißt, findest du hier eine ausführliche Anleitung zur Nutzung von PointerScore."],
    ["Profil", "Hier kannst du dein Profil verwalten, dein Profilbild ändern und deinen Abonnementstatus einsehen."],
    ["Du bist bereit!", "Viel Erfolg beim Analysieren von Unternehmen.\n\nVielen Dank, dass du Teil von PointerScore bist."]
  ],
  en: [
    ["Welcome to PointerScore 👋", "Welcome to PointerScore! Our rating system helps you analyse companies in a structured and transparent way. We’ll show you the key features in less than a minute."],
    ["Dashboard", "Here you’ll find your saved analyses, statistics and all important functions."],
    ["Create a new analysis", "Click here to analyse a company and calculate a new PointerScore."],
    ["The calculator", "Enter the company’s financial figures. PointerScore automatically calculates the overall score."],
    ["Save analyses", "Every analysis can be saved, edited later and synchronised across all your devices."],
    ["Help", "If you get stuck, you’ll find detailed instructions for using PointerScore here."],
    ["Profile", "Here you can manage your profile, change your profile picture and view your subscription status."],
    ["You’re ready!", "Good luck analysing companies.\n\nThank you for being part of PointerScore."]
  ]
};

const selectors = [null, ".dashboard-stats", "[data-tour-new-analysis]", ".form-card", ".result-column", "[data-tour-help]", "[data-profile-link]", null];
let step = Number(params.get("tourStep") ?? sessionStorage.getItem(stateKey) ?? 0);
let target = null;
let ui = null;
let transitioning = false;

function doneKey() {
  const userId = document.body.dataset.tourUserId || sessionStorage.getItem(userKey);
  if (userId) return `pointerscore:onboarding-complete:${userId}`;
  const email = document.querySelector("[data-user-email]")?.textContent?.trim().toLowerCase();
  return `pointerscore:onboarding-complete:${email && email !== "–" ? email : preview ? "preview" : "user"}`;
}

function hrefWithStep(path, nextStep) {
  const url = new URL(path, location.href);
  url.searchParams.set("tour", "1");
  url.searchParams.set("tourStep", String(nextStep));
  return url.href;
}

function markComplete() {
  localStorage.setItem(doneKey(), "1");
  sessionStorage.removeItem(stateKey);
}

function cleanTourUrl() {
  const url = new URL(location.href);
  url.searchParams.delete("tour");
  url.searchParams.delete("tourStep");
  history.replaceState({}, "", url);
}

function removeHighlight() {
  target = null;
}

function finish() {
  if (transitioning) return;
  transitioning = true;
  ui?.classList.add("onboarding-tour-is-fading");
  window.setTimeout(() => {
    markComplete();
    cleanTourUrl();
    removeHighlight();
    ui?.remove();
    document.body.classList.remove("onboarding-tour-open");
  }, 240);
}

function createUi() {
  const wrapper = document.createElement("div");
  wrapper.className = "onboarding-tour";
  wrapper.innerHTML = `<div class="onboarding-tour-shade"></div><div class="onboarding-tour-spotlight" aria-hidden="true"></div><section class="onboarding-tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"><div class="onboarding-tour-top"><span class="onboarding-tour-brand"><img src="${rootPath}assets/logo-new-v2.png" alt="" width="30" height="30"> PointerScore</span><button type="button" class="onboarding-tour-skip"></button></div><div class="onboarding-tour-progress"><span></span></div><small class="onboarding-tour-count"></small><h2 id="tour-title"></h2><p></p><div class="onboarding-tour-actions"><button type="button" class="onboarding-tour-back"></button><button type="button" class="onboarding-tour-next"></button></div></section>`;
  document.body.append(wrapper);
  wrapper.querySelector(".onboarding-tour-skip").addEventListener("click", finish);
  wrapper.querySelector(".onboarding-tour-back").addEventListener("click", () => go(step - 1));
  wrapper.querySelector(".onboarding-tour-next").addEventListener("click", () => step === 7 ? finish() : go(step + 1));
  return wrapper;
}

function placeCard() {
  const card = ui.querySelector(".onboarding-tour-card");
  const spotlight = ui.querySelector(".onboarding-tour-spotlight");
  card.style.removeProperty("top"); card.style.removeProperty("left"); card.style.removeProperty("right"); card.style.removeProperty("bottom");
  if (!target || !target.getClientRects().length) {
    ui.classList.add("onboarding-tour-no-target");
    spotlight.style.opacity = "0";
    if (innerWidth >= 760) { card.style.left = `${Math.max(20, (innerWidth - card.offsetWidth) / 2)}px`; card.style.top = `${Math.max(20, (innerHeight - card.offsetHeight) / 2)}px`; }
    return;
  }
  ui.classList.remove("onboarding-tour-no-target");
  const box = target.getBoundingClientRect();
  const padding = step === 3 || step === 4 ? 10 : 8;
  const top = Math.max(8, box.top - padding);
  const leftEdge = Math.max(8, box.left - padding);
  const right = Math.min(innerWidth - 8, box.right + padding);
  const bottom = Math.min(innerHeight - 8, box.bottom + padding);
  spotlight.style.opacity = "1";
  spotlight.style.left = `${leftEdge}px`; spotlight.style.top = `${top}px`;
  spotlight.style.width = `${Math.max(44, right - leftEdge)}px`; spotlight.style.height = `${Math.max(44, bottom - top)}px`;
  if (innerWidth < 760) return;
  const width = Math.min(410, innerWidth - 40);
  const cardLeft = right + width + 28 < innerWidth ? right + 18 : Math.max(20, leftEdge - width - 18);
  card.style.left = `${cardLeft}px`;
  card.style.top = `${Math.max(20, Math.min(innerHeight - card.offsetHeight - 20, top))}px`;
}

function render(onReady) {
  removeHighlight();
  const lang = document.documentElement.lang === "en" ? "en" : "de";
  const text = copy[lang][step];
  ui.querySelector("h2").textContent = text[0];
  ui.querySelector(".onboarding-tour-card > p").textContent = text[1];
  ui.querySelector(".onboarding-tour-count").textContent = lang === "de" ? `Schritt ${step + 1} von 8` : `Step ${step + 1} of 8`;
  ui.querySelector(".onboarding-tour-progress span").style.width = `${(step + 1) * 12.5}%`;
  ui.querySelector(".onboarding-tour-skip").textContent = lang === "de" ? "Überspringen" : "Skip";
  ui.querySelector(".onboarding-tour-back").textContent = lang === "de" ? "Zurück" : "Back";
  ui.querySelector(".onboarding-tour-next").textContent = step === 7 ? (lang === "de" ? "Jetzt starten" : "Get started") : (lang === "de" ? "Weiter" : "Next");
  ui.querySelector(".onboarding-tour-back").hidden = step === 0;
  target = selectors[step] ? document.querySelector(selectors[step]) : null;
  if (target && target.getClientRects().length) {
    const box = target.getBoundingClientRect();
    if (step !== 6 && (box.top < 80 || box.bottom > innerHeight - 150)) {
      // The tour is hidden while changing steps, so position the next target
      // immediately. This prevents the old card/spotlight from flashing once
      // before the delayed smooth scroll has reached its destination.
      target.scrollIntoView({ behavior: "auto", block: step === 4 ? "start" : "center" });
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    placeCard();
    onReady?.();
  }));
}

function go(nextStep) {
  if (transitioning) return;
  const destination = Math.max(0, Math.min(7, nextStep));
  const applyStep = () => {
    step = destination;
    sessionStorage.setItem(stateKey, String(step));
    if (step >= 3 && step <= 4 && !isCalculator) return location.assign(hrefWithStep(calculatorPath, step));
    if ((step <= 2 || step >= 5) && isCalculator) return location.assign(hrefWithStep(dashboardPath, step));
    render(() => requestAnimationFrame(() => {
      ui?.classList.remove("onboarding-tour-is-fading");
      transitioning = false;
    }));
  };
  if (!ui || ui.dataset.ready !== "true") {
    if (ui) ui.dataset.ready = "true";
    applyStep();
    return;
  }
  transitioning = true;
  ui.classList.add("onboarding-tour-is-fading");
  window.setTimeout(applyStep, 240);
}

async function start() {
  if (isCalculator && params.get("tour") !== "1") return;
  if (!isCalculator) {
    for (let i = 0; i < 60 && document.body.classList.contains("is-auth-loading"); i += 1) await new Promise(resolve => setTimeout(resolve, 100));
    const manual = params.get("tour") === "1";
    if (document.body.dataset.tourUserId) sessionStorage.setItem(userKey, document.body.dataset.tourUserId);
    if (manual && localStorage.getItem(doneKey()) === "1" && params.get("tourStep") !== "0") {
      cleanTourUrl();
      return;
    }
    if (!manual && localStorage.getItem(doneKey()) === "1") return;
    if (!manual && location.pathname.includes("dashboard") === false) return;
  }
  document.body.classList.add("onboarding-tour-open");
  ui = createUi();
  go(step);
}

addEventListener("resize", placeCard, { passive: true });
addEventListener("keydown", event => { if (event.key === "Escape" && ui) finish(); });
addEventListener("pointerscore:languagechange", () => { if (ui) render(); });
start();
