# PointerScore Desktop-App

Diese Desktop-App ist eine native Windows-Hülle für PointerScore. Sie startet mit einer eigenen PointerScore-Ladeanimation und öffnet danach direkt den geschützten Dashboard-Bereich. Falls der Nutzer noch nicht angemeldet ist, übernimmt die Website die Weiterleitung zur Anmeldung.

## Entwicklung starten

```bash
npm install
npm start
```

## Windows-Installer bauen

```bash
npm run build
```

Der fertige Installer liegt danach im Ordner `desktop/installer-delivery/` und heißt nach aktuellem Muster `PointerScore-Setup-<version>.exe`.

## Portable Windows-App bauen

```bash
npm run build:portable
```

Die portable App liegt danach im Ordner `desktop/portable-delivery/` und kann ohne Installation gestartet werden.

## Microsoft Store

Für den Microsoft Store wird zusätzlich ein passendes Store-Paket oder eine direkt akzeptierte Win32-Paket-URL benötigt. Dafür brauchst du weiterhin den Microsoft Developer Account, die Store-Metadaten und die finale Prüfung durch Microsoft.
