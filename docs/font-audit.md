# Prüfung der lokalen Schriftarten

Stand: 14.10.2026. Geprüft wurde der lokale Projektstand einschließlich des erzeugten Website-Builds, nicht eine bereits veröffentlichte Version.

## Ergebnis

- 17 HTML-Seiten enthielten Google-Fonts-Stylesheets und jeweils zwei Preconnects. Alle wurden durch einen relativen Link auf `assets/fonts/inter/inter.css` ersetzt.
- Die einzige extern eingebundene Schriftfamilie war **Inter**, aufrecht, in den Stärken **400, 500, 600, 700 und 800**.
- Die originalen WOFF2-Dateien werden jetzt vollständig aus dem Projekt geladen. Lizenz: SIL Open Font License 1.1, mitgeliefert als `assets/fonts/inter/OFL.txt`.
- **92 Browser-Prüffälle: 0 Anfragen an Google Fonts, 0 externe Stylesheets, 0 fehlgeschlagene lokale Schrift-/Stylesheet-Requests und 0 horizontale Überläufe.**
- Alle geprüften Seiten antworteten mit HTTP 200. Der Weiterleitungsweg `calculator.html` zum Rechner wurde ebenfalls geprüft.
- Build, Linkprüfung, JavaScript-Syntaxprüfung und `git diff --check` waren erfolgreich.

## Lokale Dateien und Erhaltung des Designs

Die Dateiinhalte stammen aus der zuvor verwendeten Google-Fonts-CSS-Antwort für Inter. Die WOFF2-Dateien sind unverändert. Die fünf bisherigen `font-weight`-Definitionen, `font-style: normal`, `font-display: swap` und die Unicode-Bereiche wurden übernommen. Auch die vorhandene Zuordnung von Zwischenstärken wie 650 oder 760 bleibt dadurch erhalten. Es wurde kein neuer variabler Gewichtsbereich aktiviert, der die bisherige Darstellung verändern würde.

| Datei unter `assets/fonts/inter/` | Größe in Bytes |
| --- | ---: |
| `inter-latin.woff2` | 48.256 |
| `inter-latin-ext.woff2` | 85.068 |
| `inter-cyrillic.woff2` | 18.748 |
| `inter-cyrillic-ext.woff2` | 25.960 |
| `inter-greek.woff2` | 18.996 |
| `inter-greek-ext.woff2` | 11.232 |
| `inter-vietnamese.woff2` | 10.252 |

Die sieben Dateien enthalten zusammen 218.512 Bytes. Mehrere Gewichte verwenden jeweils dieselbe variable WOFF2-Datei; der Browser muss diese deshalb nicht je Gewicht erneut übertragen. Für die geprüften deutschen und englischen Seiten genügte der Latin-Zeichensatz. Die weiteren Unicode-Bereiche bleiben für Namen und andere Zeichen verfügbar, wie zuvor.

Bestehende Systemschriften bleiben erhalten. Insbesondere verwendeten der Rechner, die 404-Seite und die lokalen Desktop-Startanimationen bereits vor dieser Änderung keine Google-Schriftdateien. Dort wurde kein zusätzlicher Webfont aktiviert. Die PDF-Ausgabe verwendet weiterhin ihre bisherigen Systemschriften. Auch die E-Mail-Vorlagen enthielten keine externen Font-Imports und bleiben unverändert.

Die produktiven Stylesheets `style.css` und `rechner/styles.css`, Schriftgrößen, Abstände, Farben und Anwendungsfunktionen wurden nicht verändert.

## Umfang der Quelltextprüfung

Geprüft wurden HTML-, CSS-, JavaScript-, MJS- und TypeScript-Quellen einschließlich Desktop-Shell, PDF-Erzeugung, E-Mail-Vorlagen, dynamisch erzeugter HTML-Inhalte und CSS-Imports. Die einzigen CSS-Imports außerhalb der neuen lokalen Fontdatei verweisen auf das lokale Stylesheet der Startanimationen. Weitere externe Stylesheets wurden nicht gefunden.

Ausgenommen sind Git-Interna, installierte Drittanbieter-Abhängigkeiten, temporäre Prüfdateien und alte Installer-/Paketartefakte. Der aktuelle `dist/`-Build wurde neu erzeugt und separat auf externe Google-Fonts-Verweise geprüft. Alte Installer wurden nicht verändert oder neu gebaut.

## Browser-Prüfung

Testbrowser: Microsoft Edge/Chromium, automatisiert in einem getrennten Browserprofil. Ansichten: **1440 × 1000** und **390 × 844** Pixel, jeweils Deutsch und Englisch. Insgesamt wurden 23 Aufrufvarianten für 19 HTML-Seiten geprüft:

| Seite bzw. Aufruf | Ergebnis nach Umstellung |
| --- | --- |
| `/` (Startseite) | Keine Google-Schriftanfragen |
| `/auth.html` (Login) | Keine Google-Schriftanfragen |
| `/auth.html?mode=register` | Keine Google-Schriftanfragen |
| `/auth.html?mode=reset` | Keine Google-Schriftanfragen |
| `/dashboard.html?preview=1` | Keine Google-Schriftanfragen |
| `/dashboard.html` (Gastansicht) | Keine Google-Schriftanfragen |
| `/profile.html?preview=1` | Keine Google-Schriftanfragen |
| `/compare.html?preview=1` | Keine Google-Schriftanfragen |
| `/help.html` | Keine Google-Schriftanfragen |
| `/calculator.html?preview=1` (Weiterleitung) | Keine Google-Schriftanfragen |
| `/rechner/?preview=1` | Keine Google-Schriftanfragen |
| `/rechner/` (Gastansicht) | Keine Google-Schriftanfragen |
| `/privacy.html` | Keine Google-Schriftanfragen |
| `/404.html` | Keine Google-Schriftanfragen |
| `/pages/agb.html` | Keine Google-Schriftanfragen |
| `/pages/cookies.html` | Keine Google-Schriftanfragen |
| `/pages/datenschutz.html` | Keine Google-Schriftanfragen |
| `/pages/haftungsausschluss.html` | Keine Google-Schriftanfragen |
| `/pages/impressum.html` | Keine Google-Schriftanfragen |
| `/pages/kontakt.html` | Keine Google-Schriftanfragen |
| `/pages/kuendigung.html` | Keine Google-Schriftanfragen |
| `/pages/widerruf.html` | Keine Google-Schriftanfragen |
| `/pages/widerrufsformular.html` | Keine Google-Schriftanfragen |

Die Überwachung erfasste tatsächliche Browser-Requests, einschließlich dynamisch und über Stylesheets angeforderter Ressourcen. Anfragen an die beiden Google-Fonts-Hosts wurden im Nachher-Test zusätzlich abgefangen: Jeder Versuch wäre als Fehler gezählt worden. Es gab keinen solchen Versuch. Verwendete Schriftdateien wurden unter derselben lokalen Website-Origin geladen.

Dashboard, Profil und Vergleich wurden mit der vorhandenen lokalen Vorschau geprüft; zusätzlich wurden öffentliche Gastansichten geladen. Es wurden keine echten Konten angelegt, keine Anmeldedaten verwendet und keine Cloud-Daten geändert. Die Prüfung betrifft Schriftladen und Darstellung, keinen erneuten vollständigen Authentifizierungs-/Backend-Funktionstest.

## Vorher-Nachher-Vergleich

Für den Vorher-Test wurden die ursprünglichen Google-Stylesheets mit exakt den heruntergeladenen Originaldateien beantwortet. Dadurch konnte die bisherige Schrift unabhängig von einem erneuten Google-Netzwerkzugriff reproduziert werden.

- 1.270 Überschriften, Labels und Hauptbuttons wurden hinsichtlich Text, Größe und Schriftdefinition verglichen.
- Es gab keine abweichenden tatsächlich gerenderten Überschrift-Schriftarten.
- Vergleichsbilder von Dashboard, Rechner und Datenschutz waren bei beiden Bildschirmbreiten pixelgleich.
- Vorübergehende Größenunterschiede auf der Startseite stammten von ihren bestehenden Einblendeanimationen. Ein zusätzlicher Vergleich mit angehaltenen Animationen ergab für jeweils 18 Elemente in beiden Sprachen und Bildschirmbreiten identische Elementgrößen und Schriftdefinitionen. Die mobilen Vergleichsbilder der angehaltenen Startseite waren ebenfalls pixelgleich. Laufende dekorative Animationen wurden nicht als statischer Pixelvergleich bewertet.
- Ansichten von Startseite, Dashboard, Rechner und Datenschutz wurden außerdem anhand von Screenshots kontrolliert.

Die lokalen Prüfprotokolle und Vergleichsbilder liegen im ignorierten Ordner `tmp/font-audit/` und gehören nicht in den Commit.

## Geänderte Dateien

- 17 HTML-Seiten: `index.html`, `auth.html`, `calculator.html`, `dashboard.html`, `profile.html`, `compare.html`, `help.html`, `privacy.html` sowie die neun oben aufgeführten Seiten unter `pages/`. Ausschließlich die drei bisherigen Google-Fonts-Links wurden durch einen lokalen Stylesheet-Link ersetzt.
- `assets/fonts/inter/`: lokales Font-Stylesheet, sieben WOFF2-Dateien und Schriftlizenz.
- `scripts/dev.mjs`: korrekter MIME-Typ `font/woff2` für die lokale Vorschau.
- `scripts/check.mjs`: Build-Prüfung gegen Google-Fonts-Verweise in HTML/CSS/JS sowie Prüfung der mitgelieferten WOFF2-Dateien und Lizenz.
- `docs/font-audit.md`: dieses Prüfprotokoll.

Der Build kopiert `assets/` bereits vollständig; Änderungen an seiner Kopierlogik waren nicht nötig. Die Umstellung wird auf der öffentlichen Website nach dem Commit, Push und erfolgreichen Website-Deployment wirksam.
