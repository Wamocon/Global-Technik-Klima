# Beweisordner zum Ultra-QA-Lauf vom 11.08.2026

Prüfling: gebautes `dist/` über `astro preview` auf `http://localhost:4321`, 17 Seiten, 4 Sprachen,
Branch `feat/deutscher-master`, Commit `d5dec17`.
Verdikt: **🚫 BLOCK** · 58 bestätigt · 61 widerlegt und verworfen · 2 in Quarantäne.

## Wo was steht

| Ort | Inhalt |
|---|---|
| [`../08-qa-ultra-bericht.md`](../08-qa-ultra-bericht.md) | **Der Bericht.** Verdikt, alle Befunde mit Repro, Messwerten, Wirkung und Behebungsvorschlag |
| [`../09-qa-fixliste.md`](../09-qa-fixliste.md) | **Die Arbeitsliste.** 56 Kästchen, nach Schwere und dann nach Aufwand sortiert |
| [`10-widerlegt-und-abdeckung.md`](10-widerlegt-und-abdeckung.md) | Die **61 Widerlegungen**, die Abdeckungstabellen je Linse, und was jede Linse nicht prüfen konnte |
| [`../../scripts/qa-regression.mjs`](../../scripts/qa-regression.mjs) | 35 Bestätigungsprüfungen, `npm run nachpruefung` |
| [`skripte/`](skripte/) | 178 ausführbare Belege: Playwright-Skripte je Linse, JSON-Rohmessungen, Textausgaben |
| `screenshots/` | 306 Bilder, **nicht versioniert** (123 MB, in `.gitignore`) — liegen auf der Platte und entstehen neu, wenn man die Skripte laufen lässt |

## Die acht Linsen in `skripte/`

| Ordner | Linse | Wesentliche Skripte |
|---|---|---|
| `L1/` | funktional-positiv, Happy Path, E2E-Abläufe | `t1`…`t10`, `probe-chip1.mjs`, `probe-legal-mobile.mjs` |
| `L2/` | negativ & ungültig, illegale Zustandsübergänge | `t1_form`, `t2_btu`, `t3_chat`, `t4_states`, `t5_routes`, `t6_backnav` |
| `L3/` | Grenzwerte und Randfälle (inkl. Negativ-Rand) | `bva-calc`, `domain-analysis`, `viewports`, `overflow-drill`, `unicode`, `rtl-probe`, `counters2` |
| `L4/` | Ausfall, Degradation, Erholung | `b1`…`b13`, u. a. `b2d-blank-window`, `b4b-hung-chat`, `b11-webgl-and-dip`, `b13b-context-lost-visual` |
| `L5/` | i18n-Korrektheit + Fakten-Sicherheit | `sweep`, `hreflang`, `parity`, `jsonld`, `chat-casing`, `live2`/`live4`/`live5` |
| `L6/` | Sicherheit (OWASP-förmig) | `api-harness` (führt den echten Handler aus), `s1-xss`, `s2-sink`, `s3-headers-privacy-dos`, `s6-output-guard`, `probe.sh` |
| `L7/` | Performance, Nutzlast, Ressourcen | `01-payload`…`16-cls-cause`, jeweils mit `.md`/`.json`-Ausgabe daneben |
| `L8/` | Barrierefreiheit (WCAG 2.2 A/AA) + Usability | `01-axe`…`14-forced2`, `lib.mjs`, `contrast-raw.json`, `keyboard-raw.json` |

Im Wurzelverzeichnis von `skripte/` liegen zusätzlich meine eigenen Gegenprüfungen:
`refute.mjs`, `refute2.mjs`…`refute5.mjs` (die Widerlegungsversuche gegen die Befunde der Linsen) und
`testquality.mjs` (der Nachweis, dass `acceptance.mjs:127` nicht fehlschlagen kann).
`BRIEF.md` ist der Auftrag, den alle acht Linsen bekommen haben — inklusive der Risikotabelle.

## Zwei Hinweise, bevor du etwas davon glaubst

**Die Skripte laufen aus dem Projektverzeichnis**, nicht aus diesem Ordner:
```bash
node docs/qa-2026-08-11/skripte/L3/bva-calc.mjs
```
Manche wurden ursprünglich aus einem Temp-Ordner gestartet und lösen `playwright` deshalb über
`createRequire` mit absolutem Pfad auf. Aus dem Projektverzeichnis heraus geht auch ein schlichtes
`import { chromium } from 'playwright'`.

**`astro preview` muss auf Port 4321 laufen**, sonst schlagen alle Live-Skripte fehl:
```bash
npx astro preview --port 4321
```

Und: `axe.min.js` wurde aus `skripte/L8/` **entfernt** — eine Fremdbibliothek ist kein Beweis. Wer
`01-axe.mjs` erneut laufen lassen will, muss sie neu beschaffen.
