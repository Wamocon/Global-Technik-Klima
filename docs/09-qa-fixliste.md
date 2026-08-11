# Fixliste zum Ultra-QA-Lauf vom 11.08.2026

**Arbeitsauftrag.** Der Befundbericht steht in [`08-qa-ultra-bericht.md`](08-qa-ultra-bericht.md) —
dort liegen Repro-Schritte, Messwerte und Begründung je Befund. **Dieses Dokument ist die
abzuarbeitende Liste.** Jede Nummer entspricht einer Prüfung in `scripts/qa-regression.mjs`.

**Verdikt beim Prüflauf: 🚫 BLOCK.** Bestätigt: 58 · Widerlegt und verworfen: 61.
**Stand der Behebung: 0 von 58 behoben** (Prüflauf 11.08.2026, 35 automatisierte Prüfungen: 35 offen).

---

## So arbeitest du diese Liste ab

```bash
npm run build
```
```bash
npx astro preview --port 4321
```
In einem zweiten Fenster — das ist die Bestätigungsprüfung nach jeder Änderung:
```bash
npm run nachpruefung
```

- `node scripts/qa-regression.mjs --static` läuft ohne Server (16 der 35 Prüfungen).
- `node scripts/qa-regression.mjs H1 M17` prüft einzelne Befunde.
- Ausstiegscode = Anzahl der noch offenen Befunde. `⚠ Prüfung selbst fehlgeschlagen` ist **kein**
  Nachweis für eine Behebung.

**Nach jedem Fix zusätzlich die bestehenden Tore laufen lassen** (Regressionsschutz):
```bash
npm run guard && npm run abnahme && npm run motion
```

**Reihenfolge:** Block → Hoch → Mittel. Innerhalb einer Stufe ist die Liste nach Aufwand sortiert,
das Billigste zuerst.

⚠ **Die Beweisbilder des Originallaufs sind weg** (Sitzungs-Temp-Ordner). `qa-regression.mjs` prüft
darum jeden Befund selbst neu — verlasse dich darauf, nicht auf Zitate aus dem Bericht.

---

## 🔴 Blockierend — vor dem Zeigen beim Kunden

- [ ] **C1 · Karte lädt ohne die Zustimmung, die die Rechtstexte versprechen** (katastrophal)
  `src/content/home.ts:885` → `mapMode: 'consent'`. Der Zustimmungspfad ist bereits gebaut und in
  `acceptance.mjs` getestet, es ist wirklich nur das eine Wort.
  **Danach die Lücke schließen**, sonst kommt es zurück: in `scripts/guard.mjs` eine Regel, die den
  Build bricht, wenn `biz.mapMode === 'embed'`, und eine zweite, die jedes fremde Origin in
  `src`/`href` innerhalb `dist/**/*.html` meldet (der Guard überspringt `dist/` heute bewusst,
  `guard.mjs:16` — dafür braucht es einen zweiten, expliziten Durchlauf).
  *Alternative, falls die Karte in der Demo sichtbar bleiben soll:* stattdessen die **8**
  Rechtstext-Stellen umschreiben (`src/content/legal.ts` Zeilen 71, 140, 189, 248, 295, 354, 401, 458).
  Beides gleichzeitig stehen zu lassen ist die einzige nicht zulässige Variante.

- [ ] **K1 · Gesperrte (⛔) Zusagen stehen live auf der Seite** (kritisch)
  **Braucht eine Entscheidung, nicht nur Code.** `instruction.md §7 Frage 4` ist unbeantwortet:
  spricht ein Mensch im Betrieb Deutsch, oder läuft es über die Agentur?
  - Solange unbeantwortet: `src/content/home.ts:419` von `'Wir sprechen Deutsch'` auf
    **`'Beratung auf Deutsch über WhatsApp'`** (so schreibt es `content/de/master.md:165-167` vor),
    `:409` im Hero-Untertitel entsprechend, und `:467` von „Beratung, Montage und Garantie auf
    Deutsch" auf das zurücknehmen, was belegt ist. EN (`:567, 577, 625`) und RU (`:250, 260, 309`)
    mitziehen.
  - `trust.emergency` (`7/24 teknik destek`, `home.ts:92, 262, 421, 579`) mit den veröffentlichten
    Zeiten in Einklang bringen — die Seite und das JSON-LD nennen beide nur Mo–Sa 08:00–20:00.
  - **Ursache abstellen:** `scripts/guard.mjs` prüft die `blocked`-Flags heute nur gegen
    `src/i18n/ui.ts` und **druckt** sie, ohne sie zu erzwingen (`guard.mjs:78-82, 133-135`). Der Build
    muss brechen, wenn der Text eines `blocked`-Schlüssels in *irgendeiner* Sprachvariante in
    `src/content/home.ts` auftaucht. Ohne diesen Schritt ist der Fix nicht haltbar — es ist genau der
    Fehlermodus, den der Guard-Kommentar (`guard.mjs:61-66`) für `soğutucu akışkan` selbst beschreibt.

---

## 🟠 Hoch — vor dem Livegang

- [ ] **H16 · `/api/chat` ohne Origin-Prüfung — Budget-Missbrauch**
  `api/chat.js`: (a) ablehnen, wenn `origin`/`referer` nicht zur eigenen Herkunft passt **und** wenn
  beide fehlen; (b) `content-type: application/json` verlangen, sonst 415 — das allein stellt die
  Preflight-Schranke wieder her, die `text/plain` heute umgeht; (c) Zähler in einen gemeinsamen
  Speicher (Upstash/Redis, in der Türkei gehostet); (d) hartes Tagesbudget, das auf
  `{reply:null, fallback:true}` umschaltet. **Vor dem Setzen eines `ANTHROPIC_API_KEY` erledigen** —
  bis dahin ist der Befund latent, danach sofort scharf.

- [ ] **H10 · Fokusring des Sonnen-Schalters wird weggeschnitten** (WCAG 2.4.7)
  `src/components/Home.astro:382`: `overflow:hidden` von `.toggle` nehmen (Ecken der Kindknöpfe
  stattdessen runden) — oder `outline-offset:-3px` für diese Knöpfe. Das CSS *behauptet* heute einen
  Ring; der Pixelvergleich zeigt 0 veränderte Pixel.

- [ ] **H12 · Chat-Antworten werden nie angekündigt** (WCAG 4.1.3)
  `src/components/Assistant.astro:28`: `role="log" aria-live="polite"` auf `#cbody`.
  Gleich mitnehmen: `:197` setzt `chips.style.display='none'`, während der Fokus noch auf dem Chip
  liegt → Fokus auf `#cin` verschieben.

- [ ] **H2 · Erster Chat-Vorschlagsknopf läuft in de/ru/en ins Leere**
  `src/content/kb.ts:193`: `angebot`, `quote`, `teklif`, `kostenvoranschlag`, `смета`, `расчет`,
  `расчёт` ergänzen. Flektierende Stämme **kürzen** statt Vollformen zu speichern: `стоимост`
  statt `стоимость`, `цен` statt `цена` — sonst greift `includes()` beim Genitiv nie.

- [ ] **H1 · Türkische GROSSSCHREIBUNG bricht 7 von 13 Absichten**
  `src/components/Assistant.astro:141`: `toLocaleLowerCase('tr-TR')` allein reicht nicht — es ist
  korrekt für `İ`→`i` und falsch für `I`→`ı`. **Beide Seiten** des Vergleichs falten
  (`ı`/`İ`/`I` → `i`), also Eingabe *und* Stichwörter, vor dem `includes()`.
  Direkt mitnehmen: Stichwörter unter 5 Zeichen brauchen Wortgrenzen — `ara` (`kb.ts:152`) trifft
  `garantı`, `para` und `aralık`; `hi` (`kb.ts:62`) trifft `hiç` und `Which`. Und jede
  Absichtsantwort sollte den WhatsApp-Link mitführen (`Assistant.astro:184` gibt heute kein `wa`
  zurück), damit eine Fehlzündung nicht in einer Sackgasse endet.

- [ ] **H4 · Chat liest die erste 2–3-stellige Zahl als Fläche**
  `src/components/Assistant.astro:158`: Einheiten-Gruppe **verpflichtend** machen und 1–4 Stellen
  erlauben — `/(\d{1,4})\s*(m2|m²|м2|м²|qm|metre|metrekare|метр|квадрат|square|kare)/`. Über 300 m²
  an einen Menschen übergeben statt zu rechnen. Den Clamp-Helfer mit `Home.astro` teilen: die beiden
  Bereiche widersprechen sich heute (6–200 im Widget, effektiv 10–300 im Chat).

- [ ] **H3 · Hängende `/api/chat`-Anfrage tötet den Chat dauerhaft**
  `src/components/Assistant.astro:204`: `signal: AbortSignal.timeout(4000)` an den `fetch`.
  `typing.remove()` und `busy = false` in ein `finally` (`:217-221`). `#cchips` am Ende einer Runde
  wieder einblenden. **Dasselbe `finally` behebt M21** (verworfene zweite Nachricht) mit, wenn du
  während `busy` zusätzlich `#cin` und den Sendeknopf deaktivierst statt still `return` zu machen.

- [ ] **H7 · Telefonfeld nimmt jede nicht-leere Zeichenfolge an**
  `src/components/RequestForm.astro:178`: nach der Leerprüfung
  `if (phone.replace(/\D/g,'').length < 7)` → Fehler, der **das Telefonfeld benennt**. Die
  Pflichtfeld-Logik selbst ist sauber (alle 8 Kombinationen geprüft) — nur das Format fehlt.

- [ ] **H15 · Blockiertes Popup lässt das Formular lautlos scheitern**
  `src/components/RequestForm.astro:207`: `const w = window.open(...)`, und bei `!w` den `wa.me`-Link
  **sichtbar und klickbar** in `#reqErr` anzeigen. Gleicher Ort, gleiche Gelegenheit: auf dem
  Erfolgspfad fehlt jede Bestätigung — eine Statuszeile in `#reqErr` (als Erfolg gestylt) schließt
  die Rückmeldelücke und dient dank `role="alert"` auch Screenreadern.

- [ ] **H8 · Chat-Eingabefeld bei 200 % Zoom und im Querformat nicht erreichbar** (WCAG 1.4.4)
  `src/components/Assistant.astro:52-57`: `overflow-y:auto` auf `.chatpanel` (oder auf eine Hülle um
  Kopf + Körper + Chips), und `:69` `min-height:0` auf `.cbody`, damit Flex schrumpfen darf. Heute
  blockiert `min-height:120px` das Schrumpfen und `overflow:hidden` amputiert den Rest.

- [ ] **H5 · Kopfzeile läuft über; Burger bei 481–535 px komplett außerhalb**
  `src/layouts/Base.astro:237`: `flex-wrap:wrap` auf `.tbin`. `:254` die Kompaktregel von
  `max-width:480px` auf `max-width:759px` heben, damit die Beizeile `.bs` früher verschwindet
  (`white-space:nowrap` macht sie unschrumpfbar). Betroffen: ≤347 px und 481–535 px.
  **`acceptance.mjs` prüft nur 390 px** — mitten im sauberen Band. Bitte 320/481/535 dort ergänzen.

- [ ] **H6 · Rechner sättigt bei 48.000 und schreibt die Fläche still um**
  `src/components/Home.astro:553-562`: den Clamp **in das Feld zurückschreiben**
  (`area.value = String(a)`), und über der höchsten Gerätestufe „mehrere Geräte /
  Vor-Ort-Auslegung" ausgeben statt 48.000 zu behaupten. Von 77 bis 200 m² liefert das Werkzeug heute
  denselben Wert, und die WhatsApp-Nachricht sagt „200 m²", wenn 500 eingetippt wurde.
  **Zusammen mit M2 und M3 in einem Durchgang machen** — alle drei sitzen in derselben Funktion.

- [ ] **H9 · Kein `<main>`, kein Sprunglink, 7 Abschnitte ohne Überschrift** (WCAG 2.4.1 + 1.3.1)
  `src/layouts/Base.astro:182`: `<main>` um den `<slot />`. Als erstes fokussierbares Element einen
  bis-zum-Fokus-versteckten Sprunglink. `src/components/Home.astro:41, 60, 96, 139, 167, 194, 218,
  240`: die `<p class="eyebrow">`-Abschnittstitel zu `<h2>` machen (die Kartentitel bleiben `<h3>`,
  damit die Gliederung nicht mehr h1 → h3 springt). Betrifft nur Markup, keine Optik, wenn die
  `.eyebrow`-Klasse mitwandert.

- [ ] **H13 · LCP-Bild ist ein CSS-Hintergrund** (Performance)
  `src/layouts/Base.astro` neben die zwei Font-Preloads:
  `<link rel="preload" as="image" fetchpriority="high" href="/images/hero-shop.webp">`. Zusätzlich
  eine mobil zugeschnittene Variante — das Handy braucht 826×2264 aus einer 1600×1200-Quelle, eine
  engere Beschneidung wäre also **kleiner und besser**. Messbar: −1104 ms LCP.

- [ ] **H14 · GSAP + ScrollTrigger sind 63 % der Blockierzeit**
  `src/scripts/motion.ts`: die Kosten sind der **Messdurchlauf**, nicht die Bytes (`Layout` 1683 ms
  gegen 11,7 ms Skriptausführung von gsap selbst). Eine `ScrollTrigger`-Instanz pro Element ist zu
  viel — `ScrollTrigger.batch` benutzen, oder für die `once:true`-Enthüllungen einen einzigen
  `IntersectionObserver` statt ScrollTrigger. Nebenbei: `:252` registriert `addEventListener('load')`,
  nachdem `load` schon gefeuert hat → nie ausgeführt; auf
  `document.readyState === 'complete' ? refresh() : addEventListener(...)` umstellen.

---

## 🟡 Mittel

**Ein-Zeiler mit hoher Wirkung — zuerst:**

- [ ] **M17 · `--warn` definieren** in `src/styles/tokens.css`. Behebt **drei** Stellen gleichzeitig:
  die Tönung der KI-Offenlegung (`Assistant.astro:68`), die Warnfarbe des Beispiel-Abzeichens
  (`Home.astro:449`) und den Akzentbalken des Entwurfshinweises auf allen 12 Rechtsseiten
  (`LegalPage.astro:35`). Kontrast auf beiden Themes nachrechnen, das Abzeichen liegt heute bei
  4,09 / 3,06 (AA braucht 4,5).
- [ ] **M1 · `toLocaleString(lang)`** statt `toLocaleString('tr-TR')` in `Home.astro:559`, und den
  SSR-Vorgabewert `:118` über denselben Helfer rendern. `/en/` zeigt heute `36.000` direkt über einem
  Produkt-Tag `24,000–48,000 BTU`.
- [ ] **M2 · `snap()`-Gleichstand nach oben:** `Home.astro:552` auf
  `STEP.find(s => s >= v) ?? STEP.at(-1)`. Auch in `Assistant.astro:148` — dieselbe Funktion ist
  dupliziert. 24 m²/5 Pers. empfiehlt heute 12.000, gebraucht sind 18.000.
- [ ] **M3 · `0`/leer nicht auf 25 m² abbilden:** `Home.astro:554-555`
  `Number.isFinite(n) ? clamp(n) : 25`, und das Ergebnis leeren (oder einen Hinweis zeigen), solange
  das Feld leer ist. `Math.round` auf die Personenzahl, damit keine „2.7 kişi" in WhatsApp landen.
- [ ] **M4 · Zähler beim Zielwert starten:** `src/scripts/motion.ts:181` `box.v = target` und nur
  Deckkraft/Position animieren — oder den bereits korrekten SSR-Text parsen und von dort aus zählen.
  Heute steht ~700 ms lang **„★ 0,8 · 10 Google"** statt 5,0 / 65.
- [ ] **M5 · Doppelklick-Sperre:** `RequestForm.astro:163` oben
  `if (form.dataset.sending) return; form.dataset.sending='1'`, Knopf deaktivieren, nach ~2 s
  freigeben (ein erneutes Senden darf möglich bleiben).
- [ ] **M6 · `boot().catch(() => {})`** in `ExplodedUnit.astro:92`. Ohne WebGL entsteht heute ein
  **unbehandelter** Seitenfehler — das bricht das eigene „keine JS-Fehler"-Tor für eine ganze
  Geräteklasse. `motion.ts:269` macht es richtig und ist die Vorlage.
- [ ] **M25 · `IntersectionObserver` um die Frost-Schleife** in `FrostHero.astro`. Das Muster steht
  160 Zeilen weiter in `ExplodedUnit.astro:349-354` und funktioniert dort messbar (0 Draws/s außer
  Sicht). Heute: 61 rAF/s mit dem Hero 14.816 px über dem Viewport.
- [ ] **M26 · `overflow-wrap:anywhere`** auf `#chatpanel .msg .b` und `maxlength="800"` auf `#cin`
  (`Assistant.astro:37, 85`). Und `raw.slice(0, 800)` vor dem `fetch`.
- [ ] **M28 · `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`** in `vercel.json`. Die Seite
  framt sich nie selbst, also risikofrei. Bei der Gelegenheit `Permissions-Policy` setzen und für
  `/_astro/(.*)` eine `immutable`-Cache-Regel ergänzen (M-Notiz „nur Fonts gecacht") — die Dateinamen
  sind inhaltsgehasht, `immutable` ist dort kostenlos sicher.
- [ ] **M29 · Drei falschsprachige `aria-label`** in die Sprachtabellen ziehen, wie `menuLabel`/
  `themeLabel` es schon machen: `Base.astro:159` (`"Language"`), `Assistant.astro:20`
  (`"Assistant"`), `Projects.astro:53` (`"Süreç"`). Und `Assistant.astro:25` `aria-label="×"` →
  „Sohbeti kapat / Chat schließen / Закрыть чат / Close chat".
- [ ] **M16 · `fWhenPh`** in `content[locale].request` ergänzen und in `RequestForm.astro:66`
  benutzen — die Nachbarfelder derselben Komponente machen es mit `fPlacePh`/`fNotePh` schon richtig.
- [ ] **M15 · Beispiel-Abzeichen lokalisieren:** `Home.astro:203` statt des Literals `Beispiel` einen
  Sprachschlüssel (`beforeAfter[locale].example` existiert bereits lokalisiert) — oder besser weglassen,
  die Bildunterschrift sagt „Пример"/„Example" ohnehin schon.
- [ ] **M10 · `theme-color` beim Laden mitsetzen:** im Inline-Skript `Base.astro:73-82` nach
  `dataset.theme` auch `document.getElementById('tcolor').setAttribute('content','#f6f3ee')`.
  `BAR` aus `:197` in das Inline-Skript ziehen, damit es eine einzige Quelle gibt.
- [ ] **M27 · Coercion in den `try` ziehen:** `api/chat.js:91` — oder besser
  `if (typeof body?.message !== 'string') return res.status(200).json({reply:null, fallback:true})`.
  `{"message":{"toString":1}}` bricht die Funktion heute mit 500 statt des zugesagten Rückfalls.

**Größere Umbauten:**

- [ ] **M11 · Fußzeile, `.mobar` und `.wafab` aus `Home.astro:276-312` in `Base.astro` verschieben**,
  damit alle 12 Rechtsseiten sie erben (heute: 0 × `tel:`, 0 × `wa.me` dort). `LegalPage.astro` die
  zwei Querverweise auf die Geschwisterdokumente geben.
- [ ] **M12 · `<Schema>` nur auf den vier Startseiten rendern** (`Base.astro:102` rendert es für jede
  Seite). Auf Rechtsseiten und der 404 höchstens `WebPage`/`BreadcrumbList` oder eine `@id`-Referenz.
  Heute behaupten `/cerez` & Co. `aggregateRating 5/65`, `foundingDate` und alle sechs Leistungen mit
  Beschreibung, obwohl nichts davon dort sichtbar ist — genau die Regel, die `Schema.astro:5-8`
  selbst aufstellt.
- [ ] **M13 · `LEGAL_PLACEHOLDER` lokalisieren** (`legal.ts:32`) — vier Zeichenketten. Der deutsche
  Marker steht heute sichtbar in der Datenverantwortlichen-Angabe aller vier KVKK-Seiten.
- [ ] **M14 · KVKK-Aufbewahrungsfrist** (`legal.ts:74-79`) nach ru/de/en übersetzen — eine
  Pflichtangabe fehlt dort.
- [ ] **M18 · Sitemap aus `hreflangs()`/`pathFor()` ableiten** (`serialize`-Hook in
  `astro.config.mjs`), oder eine ausdrückliche `trailingSlash`-Richtlinie setzen. Heute: Seiten sagen
  `de` ohne Schrägstrich, die Sitemap `de-DE` mit Schrägstrich, und `x-default` fehlt in der Sitemap —
  gegen den Kommentar „aus EINER Quelle" in `astro.config.mjs:20-28`.
- [ ] **M19/M20 · Kontrast:** die sieben Textstellen unter AA (schlimmste: Explosionslegende 2,36 /
  2,07, `#reqErr` 4,07 / 3,46) und die Ränder der Bedienelemente (alle Formularfelder 2,08 / 1,87,
  Theme-Schalter 1,39 — braucht 3,0). Konkret: inaktive Legendendeckkraft auf ≈0,75, `--line-2` für
  **interaktive** Ränder auf ≥0,55 Alpha, `opacity:.7` auf `.foot .fr` und `.exp-hint` streichen.
  Die AAA-Angaben in `tokens.css` gelten nur auf reinem Noir, nicht auf den getönten Flächen.
- [ ] **M21** — mit H3 zusammen erledigt (siehe dort).
- [ ] **M24 · `#teknik` verliert Frames** (37,4 fps, 19,8 % > 33,4 ms; einziger Abschnitt).
  ~50 Draw-Calls pro Frame; Geometrien zusammenfassen oder Instancing.
- [ ] **M22 · Font-Preloads je Sprache** ausgeben (`Base.astro:99-100` sind heute
  sprachunabhängig lateinisch): `ru` → die drei kyrillischen Dateien, `tr` → zusätzlich `latin-ext`.
  Der russische Fließtext steht sonst bis 4,2 s in der Ersatzschrift.
- [ ] **M23 · Logo verkleinern:** `logo-light.png` ist 600×213 bei 51,7 KB und wird mit 96×34
  angezeigt (39-fach). Auf ~200×71 bringen oder als SVG. Gilt auch für `logo-dark.png` (47,8 KB).
- [ ] **M7 · WebGL-Kontextverlust behandeln** (`ExplodedUnit.astro`, heute 0 Handler in ganz `src/`):
  `canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); canvas.hidden = true })`
  plus `webglcontextrestored` → `boot()` erneut. Allein das Verstecken verwandelt den weißen
  Kaputt-Bild-Kasten in den bereits sauberen Verlauf-Rückfall.
- [ ] **M8/M9 · Enthüllungs-Wettlauf und 2,5-s-Leerfenster:** die Notbremse (`Base.astro:110-125`)
  soll `root.dataset.motionAborted = '1'` setzen, und `motion.ts` `setupReveals()` überspringen, wenn
  das gesetzt ist (heute schreibt `motion.ts:142` unbedingt `opacity:0` und blendet damit Inhalt
  wieder aus, den die Notbremse gerade gerettet hat — auf echtem Fast 3G 574 ms lang). Besser noch:
  `html.motion` erst **aus** `motion.ts` setzen, wenn GSAP wirklich da ist — dann verschwindet auch
  das Leerfenster.
- [ ] **M30–M34, M31 · Barrierefreiheit-Rest:** `aria-pressed` auf die Sonne-Knöpfe und den
  Theme-Schalter, `aria-labelledby` auf die `role="group"` und ein nicht-farbliches Auswahlzeichen
  (in `forced-colors` ist die Auswahl heute unsichtbar) · Chat-Panel modal + `inert` machen, damit
  fokussierte Fußzeilenlinks nicht unsichtbar erreichbar bleiben · `#reqErr` immer im DOM lassen und
  nur den Text schreiben, plus `aria-invalid`/`aria-describedby` auf die fehlerhaften Felder ·
  `min-width:0` auf `.calc` und `width:100%;max-width:200px` auf die Rechner-Felder (bei 24 px
  Grundschrift überläuft der Kasten jeden Viewport ≤ 412 px) · `scroll-padding-bottom` in Höhe der
  `.mobar` · Bewertungssterne einen Textersatz geben.

---

## 🔵 Niedrig — Sammelkorb, keiner blockiert etwas

Vollständig in [`08-qa-ultra-bericht.md`](08-qa-ultra-bericht.md) §„Niedrig". Die entscheidungs­würdigen:

- [ ] **`/angebot/…` ist öffentlich abrufbar** (200, 372 KB — das Funktionsauswahl-Angebot der
  Agentur mit Monatspreisen in USD und Unterschriftsfeld, auf der Domain, die dem Interessenten
  gezeigt wird). Korrekt `noindex`, unverlinkt, nicht in der Sitemap — aber `robots.txt` sagt
  `Allow: /`, es gibt keinen `X-Robots-Tag`, und **`/angebot/` selbst liefert 404**, der kurze Link
  ist also kaputt. *Entscheidung:* aus `public/` herausnehmen und als E-Mail-Anhang liefern, **oder**
  `Disallow: /angebot/` + `X-Robots-Tag` + `index.html` statt des langen Dateinamens.
- [ ] **`foundingDate`-Widerspruch dokumentieren.** `instruction.md §3.1/§10` und
  `docs/04-anforderungen.md:151` verbieten das Feld noch, `acceptance.mjs:98` **erzwingt** jetzt
  `2021`. Der Kundenbeleg steht nur in einem Code-Kommentar (`home.ts:865-866`). Die Kundenantworten
  vom 05.08.2026 gehören nach `docs/04-anforderungen.md` — es sind Tatsachen über den Betrieb, keine
  Code-Kommentare. Gleiches gilt für die Garantiestufen, `yetkili servis` und `7/24`.
- [ ] **`wa.me`-Zielrichtlinie festlegen:** 6 von 9 Ankern ersetzen die Seite (darunter der
  Hero-Haupt-CTA und `#ccta`), `.wafab`, `.camp-cta` und das Formular öffnen einen Tab. Eine
  Richtlinie wählen und überall anwenden.
- [ ] **`p-vrf.webp`** wird von keiner Seite referenziert → löschen. (`og.jpg` **bleibt** — es ist
  korrekt als `og:image` eingebunden und wird absichtlich nicht von der Seite geladen.)
- [ ] Ohne JavaScript sind Chat-Knopf, Burger und Theme-Schalter sichtbar und funktionslos → hinter
  eine `html.js`-Klasse legen (eine Zeile im Inline-Skript).

---

## Die Prüfmittel selbst — bitte mitziehen

Alle drei bestehenden Tore waren **grün**, und alle 58 Befunde lagen in ihren blinden Flecken. Ohne
diesen Abschnitt wiederholt sich das.

- [ ] `acceptance.mjs:127` prüft `bot >= 2` Blasen. Unsinn-Eingabe erzeugt 2 Blasen (Begrüßung +
  Rückfall) → der Test meldet „✓ Chat versteht Freitext", während der Chat nichts verstanden hat.
  **Auf den Antwortinhalt umstellen** und Türkisch in Großbuchstaben als Fall aufnehmen.
- [ ] 13 × `waitForTimeout`, 0 × zustandsbasierte Bedingung in `acceptance.mjs` (Zeilen 26, 63, 69,
  72, 73, 121, 125, 129, 136, 138, 151, 165, 171). Auf `waitForSelector`/`waitForFunction` umstellen.
- [ ] Die Suite läuft nur `colorScheme:'dark'` und klickt `#themetog` nie — **das helle Thema hat
  null Abdeckung**, und die meisten Kontrastfehler sind dort schlechter.
- [ ] `#reqForm` (8 Felder, der Conversion-Pfad), `#themetog`, `#projeler`, der Kampagnenblock und
  die 3 Garantiestufen haben **keine** Zusicherung. Aufnehmen.
- [ ] Die Überlaufprüfung testet nur 390 px → 320/481/535 px ergänzen.
- [ ] `guard.mjs` läuft nur über `src/` und `scripts/`; `api/chat.js` und `content/` werden nie
  geprüft, `dist/` ist übersprungen (`guard.mjs:16`). Aktuell latent — es gibt dort keinen echten
  Verstoß. Trotzdem erweitern, mindestens um einen zweiten, ausdrücklichen `dist/`-Durchlauf.

---

## Was bewusst NICHT geprüft war

Beim Beheben nicht als „geprüft" behandeln: echte Anthropic-Antworten (kein Schlüssel — ob das Modell
der Prompt-Injektion widersteht, ist **offen**) · Produktions-Vercel (Header, HSTS, Brotli, HTTP/2 —
**die echten Zahlen werden besser sein als die gemessenen**) · echte WhatsApp-Zustellung · echte
Screenreader (H12 und M32 sind Mechanismus-Befunde) · echtes Windows-Kontrastmodell und echter
Browser-Zoom · echtes Mittelklasse-Android · Google-Maps-Innenleben · `astro check` (hätte zwei
Pakete installiert — einmal manuell laufen lassen).

Zwei Beobachtungen wurden **in Quarantäne** gestellt und sind keine Befunde: ein einmaliger
`Cannot read properties of null (reading 'classList')` unter Slow 3G (0 von 6 Wiederholungen) und ein
`URIError: URI malformed` im Formular, nur über ein skriptgesetztes halbes Surrogatpaar erreichbar.
Tauchen sie beim Beheben wieder auf, sind sie echt.
