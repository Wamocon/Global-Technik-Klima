# instruction.md — Handbuch für die nächsten Phasen

Dieses Dokument ist der Einstiegspunkt für jede Weiterarbeit an diesem Projekt.
Lies es zuerst. Es fasst zusammen, **was das Projekt ist**, **was schon steht**, **welche Regeln unverhandelbar sind** und **was als Nächstes kommt**.

Stand: 11. Juli 2026 · Branch: `feat/deutscher-master`

---

## 1. Was das ist — und was es NICHT ist

**Es ist eine Akquise-Demo.** Global Technik Klima (Alanya Global Teknik) ist ein **Interessent**, kein Kunde. WAMOCON (die Agentur, Deutschland) baut ungefragt eine Upgrade-Version seiner Website, deployt sie auf **Vercel** und legt sie im Verkaufsgespräch **neben seine jetzige Seite**, damit er das Premium-Paket kauft (Referenz: `wamocon.com/webdesign`). Dasselbe Muster wie beim Schwesterprojekt Maryam-Barbershop.

**Kein Kundenzugang.** Es gibt keinen Zugriff auf WordPress, Google-Profil oder interne Daten. Es dürfen **ausschließlich öffentliche Informationen** von der Live-Seite und den öffentlichen Verzeichnissen verwendet werden.

**Die Live-Seite des Interessenten:** https://alanyagreeyetkilibayi.com.tr/ (WordPress 7.0 + SiteOrigin, einsprachig türkisch, heller roter Stockfoto-Slider).

**Reihenfolge, die der Kunde (WAMOCON) vorgegeben hat:** solider Plan → erste Upgrade-Version bauen → **er prüft** → Freigabe → dann erst weiter. Committen/pushen nur auf ausdrückliche Anweisung.

---

## 2. Was bereits gebaut ist

- **Phase 0 (Fundament):** Astro-Gerüst, i18n-Vertrag, Build-Leitplanken, Nullsprache (Pseudo-Locale), selbst gehostete Schriften.
- **Erste Upgrade-Version (Startseite):** vollständige, lauffähige, viersprachige Startseite im Anadolu-Royal-Stil mit Frost-Hero, BTU-Rechner, Bewertungen, Kontakt, KI-Chat-Vorschau. Deploy-fertig für Vercel (`vercel.json` liegt).
- **Bilder + KI-Assistent + WhatsApp:** echtes Ladenfoto aus dem Google-Profil (1600×1200) als Hero-Hook, Produktbilder, Freitext-Chat (`api/chat.js` mit echtem Claude, sonst clientseitige Intent-Maschine als Rückfall), schwebender WhatsApp-Knopf (Desktop) bzw. Sticky-Leiste (Mobil).
- **Phase A (Königs-Erlebnis):** Explosionszeichnung eines Wandgeräts in 3D (`ExplodedUnit.astro`, Three.js) und Vorher-Nachher-Regler (`BeforeAfter.astro`).

**Läuft:** `npm install` → `npm run dev` (oder `npm run build` → `dist/`). Vier Routen: `/` (TR), `/de`, `/ru`, `/en`.

**Abnahme:** `scratchpad/acceptance.mjs` (Playwright) prüft 4 Sprachen × Desktop/Mobil auf JS-Fehler, horizontalen Überlauf, Kernelemente, WhatsApp je Viewport, Prominenz der Sternebewertung, Chat (öffnen/Freitext/schließen), Karte, Explosionszeichnung und Regler. Stand: **0 Fehler**.

---

## 3. Unverhandelbare Regeln

### 3.1 Fakten-Sicherheit (Akquise = keine erfundene Behauptung)
- **Kein Gründungsjahr.** Nirgends öffentlich belegt. **„Seit 1997" gehört dem Klimabudur-Netzwerk, NICHT diesem Betrieb** — niemals verwenden.
- **„Yetkili Bayi ve Servisi"** ist erlaubt, weil es **wörtlich auf seiner eigenen Über-uns-Seite** steht. Nichts darüber hinaus behaupten.
- **Keine Preise.** Der Betrieb hat keine veröffentlicht. Türkisch nutzt „ücretsiz keşif", Russisch „бесплатный замер" statt einer erfundenen Zahl.
- **Fremdsprachige Bewertungen** sind als „Beispiel/пример/example" gekennzeichnet, bis echte RU/DE-Rezensionen existieren. Türkische Bewertungen sind echte öffentliche Google-Zitate.
- **Vor echtem Livegang bestätigen:** die 5,0/65-Bewertung (steht in seinem Karten-Einbau, ändert sich) und die Öffnungszeiten (Verzeichnis sagt Mo–Sa 08–20, Yandex 19 Uhr).
- **Die Konya-Nummer (+90 332 325 25 50) ist raus.** Sie war der Fehler der Altseite. Korrekte Nummern: **+90 242 513 86 51** (Festnetz), **+90 533 046 13 87** (Mobil/WhatsApp).

### 3.2 Technische Leitplanken (der Build bricht, wenn verletzt — `scripts/guard.mjs`)
- **Kein `toUpperCase()`/`toLowerCase()` in JavaScript.** Türkisch: `'İSTANBUL'.toLowerCase()` ergibt einen kaputten String, `'ISI'.toLowerCase() !== 'ısı'`. Großschreibung nur über CSS `text-transform` bei gesetztem `lang`, sonst `toLocaleUpperCase('tr-TR')`. Sortieren nur mit `Intl.Collator('tr')`.
- **Keine Google-Fonts-Einbindung.** Schriften liegen lokal in `public/fonts` (`src/styles/fonts.css`). Beide Familien tragen Kyrillisch — geprüft.
- **Verbotene Wörter:** „Kühlmittel" (falsch, es heißt Kältemittel), „Instandhaltung" (es heißt Wartung), „кондей" (billig), „soğutucu akışkan" im Verkaufstext (Kundenwort ist „klima gazı").
- Türkische Slugs nach ASCII transliterieren.

### 3.3 i18n-Architektur
- **Türkisch ist die Standardsprache und liegt an der Wurzel** (`defaultLocale: 'tr'`, `prefixDefaultLocale: false`) — erhält bestehende URLs und das lokale Google-Signal der `.com.tr`.
- **`.com.tr` bleibt.** Kein Umzug auf `.com` (adversarial verifiziert: ccTLD ist Ländersignal, keine Sprachsperre; hreflang funktioniert darauf).
- `hreflang` wird **generiert** (`src/i18n/utils.ts` → `hreflangs()`), nie von Hand — Gegenseitigkeit per Konstruktion. `x-default` zeigt auf die türkische Wurzel.
- Astro 6→7: `redirectToDefaultLocale` steht jetzt auf `false` und setzt `prefixDefaultLocale: true` voraus — hier bewusst nicht gesetzt.

### 3.4 Recht (Nachkauf, nicht Demo)
KVKK, Türkei-Hosting und der KI-Chat auf türkischer GPU sind **Produktionsarchitektur nach dem Ja**. Die Vercel-Demo verarbeitet keine echten Kundendaten. Details, falls es zur Produktion kommt: `docs/03-recht.md`.
- KVKK Art. 9: jede Auslandsübermittlung (auch Frankfurt) braucht Standardvertrag + 5-Tage-Meldung — oder alles in der Türkei hosten, dann entfällt es.
- **Gmail ist selbst ein Verstoß** (Kurul 2019/157): das Betriebs-Postfach muss auf die eigene Domain, in türkisches Hosting.
- IP ist personenbezogenes Datum → kein GA4, kein Meta-Pixel, kein fremdes CDN, kein Cloud-LLM.
- EU AI Act Art. 50 gilt **nicht**, solange der Besucher physisch in der Türkei ist und der türkische Betrieb den Chat betreibt. Die KI-Kennzeichnung bleibt trotzdem als freiwilliges Vertrauenssignal.

---

## 4. Design-System — „Anadolu-Royal"

Warmes Noir statt kaltes Blauschwarz (Vertrauensanker für türkische Augen). Auf Dunkel committet (nicht vom OS-Theme abhängig) — der Wow entsteht im Kontrast zur hellen, roten Altseite. Alle Kontraste nachgerechnet (`src/styles/tokens.css`).

| Rolle | Hex | Kontrast auf Noir |
|---|---|---|
| Grund (warmes Noir) | `#100D0B` | — |
| Champagner (Akzent) | `#D9C27A` | 11,02:1 · AAA |
| Gold | `#C9A227` | 8,01:1 · AAA |
| Petrol-Kühle | `#58C7C0` | 9,54:1 · AAA |
| Frostweiß (Text) | `#EAF6F4` | 17,51:1 · AAA |
| **Gree-Blau `#2A418E`** | **nur 2,07:1** | **nie Text auf Dunkel — nur gefüllter Chip** |

Schrift: **Cormorant Garamond** (Display) + **Jost** (Text), beide mit Kyrillisch. Dunkle Schrift auf Champagner (nie Weiß: 1,59:1). Radius scharf 2 px, nur Chat/WhatsApp weich.
Hero-Bau-Effekt: Hitzeflimmern (Gold) beruhigt sich zu Petrol/Frost — der Produktnutzen als Bild (`src/components/FrostHero.astro`).

---

## 5. Zielgruppe & Sprachstrategie (verifiziert)

- Alanya: ~36.465 gemeldete Ausländer (~10 %), überproportional kaufkräftig, **schrumpfend** (Auslandsverkäufe 13.037→5.421, 2022→2024). Russen #1, dann Deutsche. **Jeder Klima-Wettbewerber ist einsprachig türkisch** — das ist der Keil. Plus Klima (gleiche Stadt, gleiche Marke) ist schon RU/EN gelistet.
- **Sprachreihenfolge: TR → RU → DE → EN.**
- **Türkisch:** durchgehend „siz", Superlativ ist Norm, Selbstverkleinerung = Schwäche, sichtbare Telefonnummer IST das Vertrauenssignal, kein Servicepreis (stattdessen „ücretsiz keşif"), „faturalı hizmet" gegen Schwarzarbeit.
- **Russisch:** „вы" klein, **Preis muss sichtbar sein** (fehlender Preis = Betrugssignal), „Говорим по-русски" ist Vertrauenssignal Nr. 2, Garantie auf die Arbeit, Vertrag+Beleg. Kunde sagt „фреон", nicht „хладагент".
- **Deutsch:** Sorge um Festpreis inkl. Montage, korrekt ausgefüllte Garantiepapiere, deutschsprachiger Ansprechpartner.

Vollständige Marktsprache: `docs/02-glossar.md`. Der deutsche Master (Textquelle): `content/de/master.md`.

---

## 6. Die ehrliche Zielkorrektur (adversarial verifiziert, 3/3 widerlegt)

„TOP 1 Händler der Türkei in 3 Monaten" ist tot — kein messbarer nationaler Rang existiert. **Ehrliches 90-Tage-Ziel:** die **#1- und faktisch einzige mehrsprachige Gree-Präsenz der Region Antalya**. Vier messbare Ziele: #1 im RU/DE/EN-Longtail (leere SERP), Top-3 im türkischen Kartenblock, Lead-Messung von null aufbauen, Bewertungen 65→150+ inkl. RU/DE. Voller Plan im Artefakt (siehe §9).

Verkaufspsychologie: nur was repliziert (Autorität, Anchoring mit echten Preisen, Von-Restorff-Isolation, Reziprozität, Peak-End; Social Proof/Scarcity mit Vorsicht). **Fallengelassen:** Verlustaversion, Zeigarnik, fabrizierte Knappheit — nicht als „Wissenschaft" verkaufen.

---

## 7. Die 4 offenen Fragen an den Kunden (blockieren die Produktion, nicht die Demo)

1. **Yetkili `servis` oder nur `bayi`?** (Steht als „Bayi ve Servisi" auf seiner Seite → für die Demo sicher gespiegelt. Für das 10-Jahres-Garantie-Badge müsste der Servis-Status bestätigt sein.)
2. **Gründungsjahr?** (Für den türkischen Erfahrungs-Anker. Nicht erfinden.)
3. **Mindestpreise Montage/Reinigung?** (Blockiert den russischen Preis-Play.)
4. **Spricht ein Mensch Deutsch, oder läuft es über die Agentur?** (Blockiert das deutsche Service-Versprechen.)

---

## 8. Dateikarte

```
astro.config.mjs            i18n-Routing (TR an der Wurzel)
vercel.json                 Deploy-Konfiguration (Astro, Font-Cache, Header)
scripts/pseudo.mjs          erzeugt die Nullsprache src/i18n/xx.json
scripts/guard.mjs           Build-Leitplanken (toUpperCase, Google-Fonts, verbotene Wörter)
src/content/home.ts         >> INHALT der Startseite in 4 Sprachen + öffentliche Firmendaten (biz)
src/components/Home.astro    alle Sektionen unter dem Hero + BTU-Rechner + Chat
src/components/FrostHero.astro  Hero mit Frost-Bau-Effekt (Canvas)
src/components/Phase0.astro  Debug-Ansicht der Nullsprache (kann später weg)
src/layouts/Base.astro       Kopfzeile, Sprachumschalter, hreflang, Meta
src/i18n/ui.ts, utils.ts     i18n-System, Leitplanken-Regeln als Code
src/styles/*.css             tokens (Palette), fonts (lokal), global
public/fonts/*.woff2         selbst gehostete Schriften (latin/latin-ext/cyrillic)
content/de/master.md         deutscher Redaktions-Master (Textquelle, Register, Sperren)
docs/01-sprachvertrag.md     die vier Entscheidungen, Schichten, Blockvarianten
docs/02-glossar.md           Marktsprache TR/RU/DE/EN, Gree-Produktwahrheit
docs/03-recht.md             KVKK, AI Act, Hosting — Nachkauf-Architektur
```

Befehle: `npm run dev` · `npm run build` · `npm run guard` · `npm run pseudo`

---

## 9. Externe Ergebnisse (Artefakte auf claude.ai)

- **Tiefenanalyse der Live-Seite (IST/PLAN, Entscheidungstabelle):** https://claude.ai/code/artifact/60f372cf-02c5-470b-ac05-e073d104ad9b
- **Königsplan (12-Wochen-Umsetzung, Psychologie, KVKK-Tech-Stack):** https://claude.ai/code/artifact/3a09c5b4-2e65-4248-8fab-e71869c00d40
- **Vorher-Nachher-Prüfstück der ersten Upgrade-Version:** https://claude.ai/code/artifact/719c06ff-a608-4203-8fbc-5ddf2f2114b9

---

## 10. Nächste Phasen (nach Freigabe)

**Phase A — Königs-Erlebnis auf der Startseite** ✅ **gebaut**
- **Explosionszeichnung** (`src/components/ExplodedUnit.astro`): fünf prozedural gebaute Bauteile (Frontblende, Filter, Wärmetauscher, Querstromlüfter, Gehäuse) auf einer gestrichelten Goldachse, beim Scrollen zerlegt, Legende leuchtet Teil für Teil mit.
  - Three.js wird **dynamisch** geladen (IntersectionObserver, 300 px Vorlauf). Nachweis: der 707-KB-Brocken taucht **0×** in `dist/index.html` auf; anfangs laden nur ~22 KB. Diese Disziplin bei jeder Änderung neu belegen.
  - Die Kamera wird **nicht geraten**, sondern eingepasst: echte Bauteil-Eckpunkte, über beide Drehstellungen vereinigt, dann im *Bildraum* nachkorrigiert. Grund: perspektivisch ist „in 3D mittig" nicht „im Bild mittig" — das nahe Frontteil wird vergrößert, das ferne Gehäuse verkleinert. Deshalb auch langes Objektiv (fov 14): fast parallelperspektivisch, wie eine technische Zeichnung.
  - `prefers-reduced-motion`: ein statisches Bild, keine Schleife. rAF pausiert außer Sicht und bei verstecktem Tab.
- **Vorher-Nachher-Regler** (`src/components/BeforeAfter.astro`): ziehbar, dazu ein unsichtbarer `<input type=range>` darüber — damit auch per Tastatur bedienbar. Nie automatisch (Karussells schneiden in Tests durchweg schlecht ab).
  - ⛔ **Der Betrieb hat keine Montagefotos.** Der Regler zeigt eine als „Beispielbild/Örnek görsel/Иллюстрация" **gekennzeichnete** Illustration (Hitze→Kühle-Gradierung seines echten Produktbilds). Sobald echte Vorher/Nachher-Bilder vorliegen: Bildpfade tauschen, Label entfernen.
- Offen aus Phase A: seldschukischer Achtstern als Trenner.

**Phase B — Substanz auf Unterseiten** (Whitespark #1-Rankingfaktor: eigene Seite je Leistung):
- Sieben echte Leistungsseiten (Montage, Wartung, Reinigung, Gaz Dolumu, Reparatur, Wärmepumpe, VRF) statt der 140 dünnen Tag-Archive der Altseite.
- Produktseiten je Gree-Linie. LocalBusiness/Service/FAQ-Schema, mehrsprachig.
- Bezirksseiten (Mahmutlar, Oba, Kestel …) NUR mit echtem eigenem Inhalt — kein Copy-Paste (Google-Doorway-Verstoß).

**Phase C — Produktion (nur wenn gekauft):**
- Türkei-Hosting-Entscheidung, KVKK-Umsetzung, KI-Chat auf türkischer GPU (Gemma 3 27B / Qwen 3 30B), Postfach von Gmail auf `.com.tr`.
- Die 4 Kundenfragen beantwortet, gesperrte Behauptungen (`⛔` im Master) freigeschaltet.

**Immer zuerst:** dieses Dokument und die drei `docs/` lesen. Jede neue Behauptung gegen die Fakten-Sicherheit (§3.1) prüfen. Nie eine Zahl erfinden.
