# PointerScore 100

Veröffentlichungsfähige statische Website mit deutsch-englischer Sprachumschaltung und PDF-Handbüchern.

## Voraussetzungen

- Node.js 18 oder neuer
- npm

Es werden keine externen npm-Pakete benötigt.

## Lokal starten

```powershell
npm install
npm run dev
```

Danach ist die Website unter [http://127.0.0.1:4173](http://127.0.0.1:4173) erreichbar.

## Produktions-Build

```powershell
npm run build
npm run check
```

Der veröffentlichungsfertige Inhalt wird im Ordner `dist/` erzeugt.

## Struktur

- `index.html` – Landingpage
- `404.html` – Fehlerseite
- `pages/` – Kontakt, Impressum und Datenschutz
- `public/pdfs/de/` und `public/pdfs/en/` – sprachabhängige Downloads
- `scripts/` – lokaler Server, Build und Projektprüfung

## Rechtliche Seiten

Impressum und Datenschutzerklärung enthalten die angegebenen Betreiberinformationen und sind auf den aktuellen Funktionsumfang der Website zugeschnitten. Bei einer Änderung von Hosting, Tracking, Kontaktwegen, Login oder Zahlungsfunktionen müssen die Texte erneut geprüft und angepasst werden.

Noch nicht enthalten sind Registrierung, Login, Supabase und Stripe.
