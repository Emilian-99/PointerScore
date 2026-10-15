# Eigenständige Desktop-Oberfläche und Informationswebsite – 14.10.2026

## Aktueller Stand

Die zunächst vorbereitete Variante mit einem auf der Website gehosteten `/app/`-Bereich wurde auf ausdrücklichen Wunsch verworfen. Ab Desktop-Version **1.0.10** liegt die komplette Oberfläche im Installationspaket.

- Dashboard, Rechner, Profil, Vergleich, Hilfe, Berichte, Bilder, Schriften und Supabase-JavaScript-Client werden lokal unter `desktop/renderer/` gebaut und mit Electron ausgeliefert.
- Der Website-Build `dist/` enthält **keinen** Web-Rechner, kein Dashboard und keinen `/app/`-Bereich. Die alten Einstiegsadressen enthalten nur einen Update-Hinweis bzw. einen Verweis zu den Apps.
- Die Website informiert über mobile App/Windows-App und bietet keinen Login oder Abo-Checkout.
- Der Google-Play-Link fehlt noch und ist klar als nicht verfügbar gekennzeichnet.
- Supabase-Konten, Tabellen, Analysen, Storage, Functions, Policies und SMTP wurden nicht geändert oder gelöscht.
- Abo-Kauf und Google-Play-Billing sind nicht implementiert: Das ist eine separate Aufgabe für die mobile App. Es werden keine Preise oder Laufzeiten erfunden.

## Was „unabhängig“ bedeutet

Die Desktop-App benötigt die Website nicht mehr zum Laden ihrer Oberfläche. Die bereits verwendete Origin `https://pointerscore.com` wird **innerhalb der Electron-Sitzung lokal** auf die mitgelieferten Dateien aufgelöst. Der Hostname dient dort nur als interne Kompatibilitätsadresse, nicht als Netzwerkquelle.

Das bewahrt Origin und Supabase-LocalStorage-Schlüssel sowie die bestehende Partition `persist:pointerscore`. Der eigentliche Supabase-API-Verkehr wird mit unveränderten Methoden, Headern und Nutzdaten weitergeleitet. Es gibt **keinen** Netzwerk-Fallback zur Website, falls eine lokale Datei fehlt; dann erscheint ein lokaler Fehler.

Diese Abgrenzung wird durch einen sitzungsgebundenen Electron-Protokollhandler umgesetzt; siehe [Electron-Protokoll-Dokumentation](https://www.electronjs.org/docs/latest/api/protocol) und [Durchreichen anderer HTTPS-Anfragen](https://www.electronjs.org/docs/latest/api/net#netfetchinput-init).

**Nicht vollständig offline:** Anmeldung, Passwort-Reset, Cloud-Speicherung/-Synchronisation, Profilbilder aus Storage und Unternehmensdatensuche benötigen weiterhin Internet beziehungsweise Supabase. Es wurde kein neuer Offline-Datenabgleich gebaut. Im Offline-Test konnten das Dashboard als Gast sowie der Rechner und seine Eingabefelder ohne Website-/CDN-Zugriff geladen werden.

Änderungen an der Infoseite verändern die gebündelte App-Oberfläche künftig nicht mehr. Änderungen an Dashboard/Rechner erfordern ein neues Desktop-Paket und dessen Veröffentlichung.

## Veröffentlichung und ältere Desktop-Versionen

Die derzeit installierten älteren Desktop-Versionen laden ihren Rechner noch von der Website. Nach Entfernen dieses Bereichs benötigen sie das Desktop-Update. Am 15.10.2026 wurde ausdrücklich entschieden, diesen vorübergehenden Ausfall zu akzeptieren und die Website unabhängig von der Store-Freigabe veröffentlichen zu können. Supabase, Konten und gespeicherte Analysen bleiben unverändert.

1. Neue Desktop-Version **1.0.10** über Partner Center einreichen.
2. Sobald das Store-Update verfügbar ist, auf einer **bestehenden Installation mit echtem Testkonto** prüfen: Anmeldung, vorhandene Analyse, Speichern, PDF, Bestätigungs-/Passwort-Reset-Link. Dies ist keine Veröffentlichungssperre für die Website mehr.
3. Nutzer älterer Versionen zum Update anhalten. Eine Store-Freigabe bedeutet nicht, dass bereits jedes Gerät aktualisiert ist. Nach Entfernen des Web-Rechners benötigen alte Versionen zwingend das Update; es gibt keinen unsichtbaren Ersatz durch einen anderen Web-Rechner.
4. Die Website ohne Rechner darf bereits vor der Store-Freigabe veröffentlicht werden.
5. Unter **Settings → Pages → Source → GitHub Actions** die richtige Veröffentlichungsquelle auswählen. Ein Push auf `main` oder ein manueller Workflow-Start veröffentlicht nach erfolgreichen Build-Prüfungen. Es ist keine zusätzliche Repository-Variable erforderlich.
6. Ausschließlich `dist/` veröffentlichen. Nicht den Repository-Wurzelordner und nicht `desktop/renderer/`.

Die frühere Store-Freigabesperre im Deploy-Job wurde auf Nutzerwunsch entfernt. Der Deploy-Job hängt weiterhin vom erfolgreichen Build ab. Die lokale Änderung veröffentlicht noch nichts; sie muss zunächst committed und gepusht werden. Hosting-Einstellungen und Supabase werden dadurch nicht verändert.

## E-Mail-Links ohne Website-Dashboard

Die bisherigen Supabase-Redirect-URLs bleiben gültig:

- `https://pointerscore.com/dashboard.html`
- `https://pointerscore.com/auth.html?mode=recovery`

Auf der öffentlichen Website führen solche Callback-URLs zu `/auth-callback/`. Diese schmale Seite bietet **„In der Desktop-App öffnen“** über `pointerscore://auth/callback`, ohne einen Desktop-PKCE-Code automatisch im falschen Browser-Kontext einzulösen. Der ursprüngliche Code bleibt bis zur expliziten Auswahl erhalten.

NSIS-Konfiguration und MSIX-Manifest registrieren den Protokollnamen. Die laufende App nimmt nur streng geprüfte Auth-Callback-URLs entgegen, öffnet keine beliebigen Dateien/URLs aus deren Parametern und verarbeitet den Callback im lokalen App-Login. Eine erneute Instanz wird vermieden.

Als bewusster Browser-Fallback bleiben Bestätigung und Passwortänderung nach erfolgreicher Token-/Code-Prüfung möglich – aber kein allgemeiner Web-Login, Dashboard oder Rechner. Ungültige/abgelaufene Links zeigen keine Passwortfelder. Code-/Token-Werte werden nicht protokolliert.

Protokollaktivierung des **installierten Store-Pakets** und echte E-Mail-Zustellung müssen nach dem Store-Test separat verifiziert werden. Der Quellcode-Test und die Manifestprüfung ersetzen diesen Installationstest nicht.

## Bauen und Prüfen

Vom Repository-Wurzelverzeichnis:

- `npm ci` – gepinnte Build-Abhängigkeiten installieren;
- `npm run check` – Informationswebsite bauen, Dateien/Links/Syntax und statische DE/EN-Rechtstexte prüfen;
- `npm run test:transition` – Routing, lokale Dateigrenzen, Callbacks und öffentliche Abgrenzung testen;
- `npm run desktop:prepare` – lokale Desktop-Oberfläche inklusive Supabase-Bundle/Lizenzhinweisen erstellen;
- `npm --prefix desktop run build:msix` – Microsoft-Store-Paket bauen;
- `npm run desktop:build` – separaten NSIS-Installer bauen;
- `npm run desktop:start` – Entwicklungsversion starten.

Alle Desktop-Paket-Skripte bauen den Renderer vorab. `desktop/renderer/` ist generiert und ignoriert; die Quelldateien bleiben im Repository erhalten, werden aber nicht als Web-App veröffentlicht. Der lokale Web-Vorschauserver liefert ausschließlich `dist/` aus.

Öffentliche Supabase-URL und Publishable/Anon-Key werden aus der bestehenden Browser-Konfiguration übernommen. Keine Service-Role-Keys oder persönlichen Tokens hinzufügen. Das Supabase-SDK ist über die Root-`package-lock.json` gepinnt und wird mit esbuild für den Browser gebündelt; kein CDN-Import zur Laufzeit. Drittanbieter-Lizenzen liegen neben dem Bundle.

## Rechtstexte

DE/EN aktualisiert: Impressum, Datenschutz, AGB, Kontakt, Abo/Kündigung und Widerruf/Erstattungen. `/privacy.html` bleibt ohne JavaScript lesbar. Doppelte Seiten wurden zusammengeführt:

- Cookies/lokale Speicherung in Datenschutz;
- Analyse-/Haftungshinweise in AGB;
- optionales Widerrufsmuster auf der Widerrufsseite.

Alte Rechtsseiten-URLs erhalten kurze Weiterleitungen, keine doppelten Dokumente. `legal-content.js` ist die gemeinsame Textquelle. `scripts/render-legal.mjs` prüft die statischen HTML-Fassungen; `--patch` erzeugt den synchronisierenden Patch.

Abo-Kündigung und Kontolöschung sind getrennt. Deinstallation beendet kein Google-Play-Abo; siehe [Google-Play-Hilfe](https://support.google.com/googleplay/answer/7018481?hl=de). Verbraucherrechte werden nicht pauschal ausgeschlossen und eine alleinige Übernahme aller Pflichten durch Google wird nicht behauptet; maßgeblich sind [Kaufangebot und Store-Bedingungen](https://play.google.com/about/play-terms/eea/).

Die Rechtstexte sind **nicht anwaltlich geprüft**. Vor Veröffentlichung der mobilen App müssen tatsächliche SDKs/Datenflüsse, Datensicherheitsangaben, Preise, Leistungsumfang, Laufzeiten, Vertragspartei und konkrete Widerrufsinformationen mit dem realen Kaufprozess abgeglichen werden.

## Verifikation in diesem Auftrag

- Website-Dateiprüfung: keine funktionalen App-Dateien unter `dist/`, keine Google-Fonts-Aufrufe, gültige Links und JavaScript-Syntax.
- Acht automatisierte Tests zu öffentlichen Routen, lokaler Pfadbegrenzung, fehlenden Dateien ohne Website-Fallback, sicheren externen Links, nativen Auth-Callbacks und bewusster Browser-Verifikation.
- Bestehende Scoring-Tests unverändert erfolgreich.
- Reale Electron-Laufzeit mit dem Original-Preload und unveränderten Sandbox-/Isolierungsoptionen. Netzwerk per Proxy blockiert; keine Website und kein CDN erreichbar.
- Dreizehn erfolgreiche Desktop-Fälle: Offline-Gaststart, Offline-Rechner-Eingabe, danach echter lokal gebündelter Supabase-Client gegen **simulierte** Auth-/Datenantworten, Anmeldung, Berechnung, Speichern, Wiederöffnen, Dashboard/Profil/Vergleich/Hilfe, lokal erzeugtes PDF, DE/EN und Abmeldung. 140 Ressourcenantworten als lokal gebündelt bestätigt. Kein Zugriff auf echte Konten oder Daten.
- 96 Browserfälle erfolgreich: öffentliche Infoseiten in DE/EN bei 1440/390/320 Pixeln, Navigation/FAQ, alte Web-Routen und entfernte App-Dateien. Keine externen Netzwerk-Anfragen auf den Infoseiten, keine JavaScriptfehler, keine fehlenden Übersetzungen bei der Prüfung und kein horizontaler Überlauf. Drei Rechtstexte zusätzlich ohne JavaScript gelesen.
- Store-Paket `desktop/msix-delivery/PointerScore-1.0.10-x64.msixupload` erstellt. MakeAppx hat das Paket einschließlich Protokollzuordnung erfolgreich validiert. Eine Store-Zertifizierung oder Installation wird damit nicht behauptet.
- Paketinhalt gegengeprüft: 15 notwendige Dateien bytegenau mit den geprüften Quellen verglichen; das MSIX enthält exakt das verifizierte App-Archiv. Alle 13 Desktop-Fälle zusätzlich direkt mit den gepackten ASAR-Dateien erfolgreich ausgeführt. Das ist weiterhin keine Installation oder Prüfung echter Cloud-Daten.
- Upload-Datei: 117.146.199 Bytes; SHA-256 `e6bf2f8a6dfd890da5ceae05194447bd23c141ea0a1a6889331f7c77b15d12eb`.
- Browser- und Paketprüfungen sind im lokalen Testbericht unter `tmp/standalone-desktop/` dokumentiert.

Die vorhandene Electron-Basisversion wurde in diesem Auftrag nicht durch eine neue Hauptversion ersetzt. Ihre Aktualisierung und das abschließende Verhalten der installierten Store-App sind vor einem breiten Release separat zu prüfen.
