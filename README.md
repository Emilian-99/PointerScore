# PointerScore

PointerScore-Informationswebsite mit App-Verweisen. Die neue Desktop-App ab Version 1.0.10 liefert Dashboard und Rechner im Installationspaket mit. Das künftige Abo wird ausschließlich in der mobilen App über Google Play abgeschlossen.

**Wichtig für diese Umstellung:** Nur `dist/` veröffentlichen, niemals das Repository-Wurzelverzeichnis. In GitHub unter Settings → Pages → Source **GitHub Actions** verwenden. Der Workflow veröffentlicht die neue Infoseite nach erfolgreichen Prüfungen bei einem Push auf `main` oder einem manuellen Start; eine Store-Freigabe ist nicht mehr erforderlich. Der vorübergehende Ausfall älterer Desktop-Versionen nach Entfernung des Web-Rechners wurde bewusst akzeptiert. Supabase bleibt unverändert aktiv. Details: [docs/app-first-transition.md](docs/app-first-transition.md).

## Struktur

- `index.html` – Landingpage
- `auth.html`, `dashboard.html`, `calculator.html`, `rechner/` – Desktop-App-Quellen, durch `npm run desktop:prepare` lokal nach `desktop/renderer/` gebündelt; **nicht** Bestandteil der veröffentlichten Website. Die bisherigen Web-Adressen enthalten nur noch einen Update-Hinweis bzw. eine Weiterleitung zu den Apps.
- `auth-client.js` – Supabase-Client und Zugriffsschutz
- `calculator-logic.js` – Berechnungslogik
- `assets/` und `pages/` – Medien und Rechtstexte

## Konfiguration

Kopiere `.env.example` nach `.env.local` und trage die Supabase Project URL sowie den Publishable Key ein. `.env.local` wird nicht committed. Die daraus erzeugte `runtime-config.js` enthält ausschließlich die für Browser vorgesehenen öffentlichen Supabase-Angaben und wird für GitHub Pages mit veröffentlicht.

In Supabase müssen unter Authentication > URL Configuration mindestens diese Redirect-URLs erlaubt werden:

- `https://pointerscore.com/dashboard.html`
- `https://pointerscore.com/auth.html?mode=recovery`
- `http://127.0.0.1:4173/**` für lokale Tests

Die fertigen PointerScore-E-Mail-Vorlagen und die einmaligen Einstellungen für verpflichtende E-Mail-Bestätigungen liegen unter `supabase/email-templates/README.md`.

Die serverseitige Resend-Willkommensmail und ihre Einrichtung sind unter
`supabase/RESEND_SETUP.md` dokumentiert. Der Resend API-Key darf nur als
Supabase Edge-Function-Secret gespeichert werden.

## Lokal starten

```powershell
npm install
npm run dev
```

## Produktions-Build prüfen

```powershell
npm run build
npm run check
```

## Hinweise

- Authentifizierung erfolgt über Supabase Auth.
- Rechnerdaten werden nur im Browser verarbeitet und nicht gespeichert.
- Secret- und Service-Role-Keys dürfen niemals im Frontend verwendet werden.
- Die Datenschutzerklärung sollte vor der Veröffentlichung rechtlich geprüft werden.

## Verifizierte Rechner-Demo

- calculator-logic.js ist bytegenau identisch mit logic.js aus dem Premium-Rechner V1.2.
- demo-company-data.js enthaelt ausschliesslich vorausgefuellte Rechnereingaben, keine festgelegten Scores.
- Umsatz, Nettoergebnis, zinstragende Schulden, Gesamtvermoegen und Eigenkapital stammen aus den jeweiligen Geschaeftsberichten.
- ROE wird als aktuelles zurechenbares Nettoergebnis geteilt durch das durchschnittliche zurechenbare Eigenkapital berechnet.
- Die verwendeten TTM-KGV-Werte haben den Marktstand 26.06.2026.

Aktuell berechnete Ergebnisse:

| Unternehmen | Score | Datenperiode |
| --- | ---: | --- |
| Apple | 80 | GJ 2023-2025 |
| Microsoft | 89 | GJ 2023-2025 |
| Coca-Cola | 71 | GJ 2023-2025 |
| BMW | 46 | GJ 2023-2025 |
| NVIDIA | 96 | GJ 2024-2026 |

Die Basiswerte werden mit calculatePointerScore() berechnet. Fuer Apple gelten redaktionell vorgegebene Kategoriepunkte; der Gesamtscore wird aus deren Summe gebildet.

<!-- GitHub Pages deployment restart: 2026-07-03 -->
