// These application sources are bundled inside desktop/renderer, never published on the website.
export const appEntries = [
  "auth.html", "dashboard.html", "profile.html", "compare.html", "help.html", "calculator.html",
  "runtime-config.js", "auth-client.js", "company-data-client.js", "analysis-store.js", "auth-view.js",
  "auth-page.js", "dashboard.js", "profile.js", "compare.js", "help.js", "calculator-app.js",
  "calculator-logic.js", "demo-company-data.js", "app-install.js", "rechner"
];
export const appRoutes = ["auth.html", "dashboard.html", "profile.html", "compare.html", "help.html", "calculator.html", "rechner/index.html"];
export const legalAliases = { "cookies.html": "datenschutz.html", "haftungsausschluss.html": "agb.html", "widerrufsformular.html": "widerruf.html" };

export function routePage() {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>PointerScore Apps</title><script>
const current = new URL(location.href);
const callback = current.searchParams.has("code") || /(?:^#|&)(?:access_token|error|error_description|token_hash)=/.test(current.hash) || (current.pathname.endsWith("/auth.html") && current.searchParams.get("mode") === "recovery");
if (callback) location.replace("/auth-callback/" + current.search + current.hash);
else if (window.PointerScoreDesktop?.isDesktopApp !== true) location.replace("/#apps");
</script></head><body><h1>PointerScore aktualisieren / Update PointerScore</h1><p>Diese ältere Desktop-Version benötigt noch den bisherigen Web-Rechner. Installiere bitte die neue Desktop-Version mit integrierter Oberfläche. / This older desktop version needs the previous web calculator. Please install the new desktop version with its bundled interface.</p><a href="https://apps.microsoft.com/detail/9PJQQX25V0C7">Microsoft Store</a><p><a href="/#apps">Zu den Apps / Explore apps</a></p></body></html>\n`;
}
