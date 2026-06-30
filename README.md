# PointerScore 100

Produktionsreife statische Landingpage fuer PointerScore 100.

## Struktur

- index.html
- style.css
- script.js
- assets/logo.svg
- assets/favicon.svg
- assets/icons/
- pages/impressum.html
- pages/kontakt.html
- pages/datenschutz.html

## Nutzung

Die Website nutzt nur HTML, CSS und Vanilla JavaScript. Sie kann direkt ueber GitHub Pages veroeffentlicht werden.

## Hinweise

- Rechtstexte sind Platzhalter und sollten vor Veröffentlichung geprüft werden.
- Das Formular ist statisch und speichert keine Daten serverseitig.
- Google Fonts ist die einzige externe Ressource.

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
