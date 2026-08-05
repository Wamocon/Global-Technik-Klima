# 07 — Bildquellen (Interim-Stock)

Stand: 05.08.2026

Die Produktbilder im Raster (`public/images/p-*.webp`) sind **Übergangs-Bilder** aus
Pexels. Sie ersetzen die vorherigen Gree-Werbebanner mit eingebranntem Text
(„EVLERDE MULTİ MUTLULUK", „ISI POMPASI BİR MÜHENDİSLİK HARİKASI"), die
zusammengewürfelt und billig wirkten.

**Sie sind Platzhalter.** Der Kunde hat schriftlich bestätigt (Antwort Frage 4),
echte Fotos von Montagen, Mağaza, Ekip und Projekten zu haben — die kommen per
WhatsApp. Sobald sie da sind, werden diese Dateien 1:1 ersetzt (gleiche Dateinamen,
kein Code-Umbau nötig).

## Lizenz

Alle Bilder von **Pexels** (https://www.pexels.com). Die Pexels-Lizenz erlaubt
kostenlose kommerzielle Nutzung ohne Namensnennung, Bearbeitung ausdrücklich
gestattet. Keine Attributionspflicht — daher steht auf der Seite selbst kein
Bildnachweis. Quelle hier dokumentiert für Transparenz.

Bilder werden **selbst gehostet** (heruntergeladen, zu WebP konvertiert, in
`public/images/`), nicht per Hotlink geladen — das entspricht der Selbsthosting-
Regel des Projekts (keine Auslandsübermittlung durch Fremd-CDN, KVKK).

## Zuordnung

| Datei | Pexels-ID | Motiv | Kategorie |
|---|---|---|---|
| p-duvar.webp | 38788452 | Wandgerät im Raum | Duvar tipi |
| p-salon.webp | 6914713 | Helles Wohnzimmer mit Wandgerät | Salon tipi |
| p-multi.webp | 7061334 | Luftige Wohnung, offener Grundriss | Multi sistem |
| p-home.webp | 28542161 | Warmes, gemütliches Wohnzimmer | Home tipi |
| p-isipompasi.webp | 3964537 | Außengerät / Wärmepumpe | Isı pompası |
| p-ticari.webp | 30210086 | Dach-HVAC, gewerblich | Ticari & VRF |
| p-yedek.webp | 6471913 | Techniker mit Manometer | Yedek parça |

Aufbereitung: `sharp` → 960×600 (16:10, cover), Sättigung 0,93 für ein gemeinsames
Tonbild, WebP q82. Reproduzierbar über die IDs oben.
