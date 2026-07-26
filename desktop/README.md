# PointerScore Desktop-App

Diese Desktop-App ist eine native Windows-Hülle für PointerScore. Sie öffnet PointerScore in einem eigenen App-Fenster mit eigenem Icon, Desktop-Verknüpfung und Startmenü-Eintrag.

## Entwicklung starten

```bash
npm install
npm start
```

## Windows-Installer bauen

```bash
npm run build
```

Der fertige Installer liegt danach im Ordner `desktop/installer-delivery/`.

## Portable Windows-App bauen

```bash
npm run build:portable
```

Die portable App liegt danach im Ordner `desktop/portable-delivery/` und kann ohne Installation gestartet werden.

## Microsoft Store

Für den Microsoft Store wird später zusätzlich ein Store-Paket benötigt. Dafür brauchst du einen Microsoft Developer Account und die finale App-Prüfung durch Microsoft.
