# Aktualisierung der Rechtstexte – 14.10.2026

**Historischer Zwischenstand:** Dieser Bericht beschreibt die vorherige Überarbeitung für das kostenlose Web-Angebot. Die anschließend ausdrücklich gewünschte App-/Google-Play-Umstellung ersetzt dieses Modell. Aktueller Umfang, zusammengeführte Rechtsseiten und Veröffentlichungsbedingungen stehen in [app-first-transition.md](app-first-transition.md).

## Umgesetzter Umfang

Aktualisiert wurden die deutsch- und englischsprachigen Inhalte von AGB, Datenschutz, Impressum, Kontakt, Cookies/lokalem Speicher, Haftungshinweisen, Widerruf, Widerrufsformular und Kontobeendigung. Die eigenständig ohne JavaScript lesbare Store-Datenschutzadresse `/privacy.html` enthält dieselben Datenschutzinformationen und unterstützt jetzt ebenfalls den Sprachschalter. Alle Seiten tragen das tatsächliche Aktualisierungsdatum 14.10.2026.

Die öffentlichen Entwurfs-/Bearbeitungshinweise wurden entfernt. Die Texte behaupten weder eine behördliche Freigabe noch eine anwaltliche Prüfung. Die Entfernung solcher Hinweise stellt keine rechtliche Zertifizierung dar.

Die vorhandene Rechteseiten-Gestaltung bleibt bestehen. Nur der Umbruch langer Rechteseiten-Überschriften und ihre mobile Lesbarkeit wurden korrigiert; die Datenschutzüberschrift bleibt einzeilig. Authentifizierung, Scoring, Zahlungen und Cloud-Funktionen wurden nicht geändert. Das vorhandene Pflichtkästchen bei der Registrierung nennt nun die AGB mit Link und unterscheidet deren Zustimmung von der Kenntnisnahme der Datenschutzerklärung.

## Inhaltliche Korrekturen

- Kostenloses Angebot, keine automatische Zahlung, keine Mindestlaufzeit und kein automatisch gebuchtes Roki-Angebot.
- Keine veralteten 7,99-Euro-, Erstattungs- oder Zahlungsstörungsregeln für den kostenlosen Zugang.
- Hosting, Supabase, Resend, jsDelivr, Outlook-Kontaktpostfach, SEC-/Stooq-Datenhilfe und lokal gehostete Inter-Schriften werden anhand der vorhandenen Umsetzung beschrieben.
- Profilbilder sind über öffentlich abrufbare Supabase-Storage-URLs erreichbar. Dies wird ausdrücklich offengelegt.
- Die Kontolöschfunktion löscht über `delete_own_account` den Auth-Nutzer; abhängige Profil- und Analysedatensätze sind über die vorhandenen Datenbankschemata zugeordnet. Separat gespeicherte Bilddateien und lokale Analyse-Kopien werden dadurch nicht automatisch vollständig entfernt. Die Texte versprechen keine solche automatische Komplettlöschung und nennen die Kontaktmöglichkeit für zusätzliche Löschanfragen.
- Die Website verwendet LocalStorage für Sitzung, Sprache, Analyse-Cache und funktionale Einstellungen. Eine Abmeldung ist nicht mit dem vollständigen Löschen der Website-Daten gleichgesetzt.
- AGB enthalten keine pauschale Zustimmungsfiktion durch Schweigen, keine fingierte E-Mail-Zustellung und keine unbegrenzte Behauptung ausschließlicher Rechte an Fakten oder mathematischen Ideen.
- Haftungshinweise behalten zwingende gesetzliche Haftung und Verbraucherrechte bei. Datenimporte, vereinfachte Kennzahlen und Beispielwerte werden sachlich eingeordnet.

## Widerruf und Musterformular

Kostenlosigkeit allein beantwortet die Frage nach einem Widerrufsrecht nicht. § 312 Abs. 1a BGB erfasst unter bestimmten Voraussetzungen auch Verträge ohne Geldzahlung gegen Bereitstellung personenbezogener Daten. Die Ausnahme betrifft die ausschließliche Verarbeitung zur Leistungserbringung oder Erfüllung rechtlicher Anforderungen.

Für das derzeitige kostenlose Kontomodell ist die Beendigung über Profil oder Kontakt jederzeit möglich; dafür muss kein Formular ausgefüllt werden. Die bestehende Formular-URL wurde nicht gelöscht und bleibt als optional verwendbare Erklärungsvorlage erhalten. Sie ist keine technische Online-Widerrufsfunktion und behauptet dies auch nicht. Ein gegebenenfalls bestehendes gesetzliches Recht wird nicht ausgeschlossen. Es wird kein neues pauschales freiwilliges 14-Tage-Widerrufsrecht für alle Konten versprochen.

Bei einem späteren kostenpflichtigen Roki-Angebot oder einer Nutzung von Kundendaten über die reine Leistungserbringung hinaus ist die Einordnung erneut vorzunehmen. Soweit erforderlich, müssen insbesondere Informationspflichten, die elektronische Widerrufsfunktion nach § 356a BGB einschließlich Bestätigungsübermittlung und bei entgeltlichen Dauerschuldverhältnissen die Kündigungsvorgaben des § 312k BGB tatsächlich umgesetzt werden. Ein statisches Formular beziehungsweise ein Mail-Link ersetzt diese technische Funktion nicht.

## Vom Betreiber zu verifizierende Angaben

Die folgenden Tatsachen lassen sich nicht durch eine Änderung von Website-Texten herstellen oder aus dem Repository abschließend bestätigen:

1. Weiterhin zutreffender Betreiber, Anschrift und Kontakt; gegebenenfalls vorhandene Register-/Umsatzsteuerangaben sowie sonstige im konkreten Fall erforderliche Anbieterinformationen.
2. Tatsächlicher Hostinganbieter, Region und Dienstleister-Konfigurationen sowie die maßgeblichen Auftragsverarbeitungsverträge, Unterauftragnehmer und Garantien für internationale Übermittlungen. Das Repository beschreibt GitHub Pages und die genannten Cloud-Dienste, bestätigt aber keine unterzeichneten Verträge.
3. Tatsächliche Löschfristen für Serverprotokolle, E-Mails und Backups sowie die organisatorische Bearbeitung von Auskunfts- und Löschanfragen. Unbelegte feste Fristen wurden nicht erfunden.
4. Ob außerhalb des geprüften Website-Codes zusätzliche Analyse-, Werbe-, Newsletter- oder Trackingdienste aktiviert sind. Bei einer anderen tatsächlichen Datenverwendung ist insbesondere die Widerrufseinordnung zu überprüfen.
5. Separate Entfernung von Avatar-Dateien bei Löschanfragen. Die bestehende RPC-Funktion enthält derzeit keine Storage-Bereinigung; es wurde keine Datenbankmigration ausgeführt.

Diese Punkte stehen im internen Bericht und werden nicht als öffentliche Platzhalter ausgegeben. Eine abschließende anwaltliche Beurteilung des konkreten Geschäftsbetriebs ist durch die technischen Prüfungen nicht ersetzt.

## Quellen

- [§ 312 BGB – insbesondere Abs. 1a und seine Ausnahme](https://www.gesetze-im-internet.de/bgb/__312.html)
- [§ 327 BGB – digitale Produkte](https://www.gesetze-im-internet.de/bgb/__327.html)
- [§ 305 BGB – Einbeziehung von AGB](https://www.gesetze-im-internet.de/bgb/__305.html)
- [§ 307 BGB – Inhaltskontrolle](https://www.gesetze-im-internet.de/bgb/__307.html)
- [Art. 246a § 1 EGBGB – Informationen und Musterformular](https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html)
- [§ 356a BGB – elektronische Widerrufsfunktion](https://www.gesetze-im-internet.de/bgb/__356a.html)
- [§ 312k BGB – Kündigung von Verbraucherverträgen im elektronischen Geschäftsverkehr](https://www.gesetze-im-internet.de/bgb/__312k.html)
- [§ 25 TDDDG – Endgerätespeicherung](https://www.gesetze-im-internet.de/ttdsg/__25.html)
- [Supabase Privacy Policy](https://supabase.com/privacy) und [Data Processing Addendum](https://supabase.com/legal/dpa)
- [Resend Privacy Policy](https://resend.com/legal/privacy-policy) und [DPA](https://resend.com/legal/dpa)
- [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [jsDelivr Privacy Policy](https://www.jsdelivr.com/terms/privacy-policy)

## Prüfergebnis

- `npm run check`: erfolgreich; 78 Build-Dateien, interne HTML-Verweise und JavaScript-Syntax geprüft.
- `git diff --check`: erfolgreich.
- 120 Browser-Prüffälle: zehn Rechtsseiten-Aufrufe einschließlich der Store-Datenschutzadresse, drei Breiten (1440, 390 und 320 Pixel), jeweils wiederholter Wechsel DE → EN → DE → EN. Alle gerenderten Abschnitte wurden mit dem jeweiligen vollständigen Sprachtext verglichen.
- Keine Browser-Skriptfehler, fehlenden Abschnitte, abgeschnittenen Hauptüberschriften, horizontalen Überläufe oder Google-Fonts-Anfragen in diesen Prüffällen.
- Sechs zusätzliche Prüfungen des Registrierungs-Hinweises und seiner AGB-/Datenschutz-Links bei beiden Sprachen und allen drei Breiten: erfolgreich. Kein Registrierungsformular wurde tatsächlich abgesendet.
- Drei Aufrufe ohne JavaScript: `/privacy.html` bleibt auf Englisch lesbar; `/pages/datenschutz.html` und `/pages/agb.html` bleiben auf Deutsch lesbar. Aktualisierungsdatum jeweils vorhanden.
- Screenshots von AGB, Datenschutz und Formular auf Desktop und Mobilgeräten geprüft.
- Authentifizierungslogik, Analyse-Speicherung, Rechnerlogik und Desktop-Startcode haben keinen Diff. Die Änderungen an `auth.html` und `i18n.js` betreffen rechtliche Formulierung, Verlinkung und Übersetzung.

## Dateiliste

- `pages/agb.html`, `pages/datenschutz.html`, `pages/impressum.html`, `pages/kontakt.html`, `pages/cookies.html`, `pages/haftungsausschluss.html`, `pages/widerruf.html`, `pages/widerrufsformular.html`, `pages/kuendigung.html`
- `privacy.html`, `legal-pages.js`, `i18n.js`, `auth.html`
- `style.css`: ausschließlich auf Rechtsseiten begrenzte Überschriftenregeln
- `docs/legal-update-2026-10-14.md`: dieser Bericht

Die Änderung ist lokal vorbereitet. Eine Veröffentlichung erfolgt erst mit Commit, Push und erfolgreichem Website-Deployment. Ein neuer Desktop-Installer oder ein Store-Paket wurde nicht erzeugt.
