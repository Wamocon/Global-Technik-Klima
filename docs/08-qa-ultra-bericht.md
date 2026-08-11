# 🧪 Ultra QA Report — Alanya Global Teknik (Gree Alanya) Upgrade-Demo

**Datum:** 2026-08-11 · **Branch:** `feat/deutscher-master` · **Commit:** `d5dec17`
**Prüfling:** gebautes `dist/` über `astro preview` auf `http://localhost:4321`, 17 Seiten, 4 Sprachen
**Methode:** ISTQB-gestützte, risikogetriebene Prüfung. 8 Speziallinsen parallel, jede Linse hat
eigene Playwright-Skripte ausgeführt; jeder Befund danach adversarial nachgeprüft (Ziel: widerlegen).

---

## Verdikt: 🚫 BLOCK

Die veröffentlichten Rechtstexte sagen in **allen vier Sprachen**, die Google-Karte lade erst nach
ausdrücklichem Klick — sie lädt beim Scrollen. Und die als ⛔ **gesperrte** Zusage „Wir sprechen
Deutsch" steht in DE, EN und RU auf der Seite, obwohl der Redaktions-Master genau diese Formulierung
verbietet und `instruction.md §7` sie als unbeantwortete Kundenfrage führt. Beides sind Verstöße
gegen die beiden unverhandelbaren Regeln des Projekts (§3.1 Fakten-Sicherheit, §3.4 Recht) — und
beide sind mit wenigen Zeilen zu beheben.

**Bestätigt:** 58 · **Widerlegt und verworfen:** 61 · **Quarantäne (nicht gemeldet):** 2
**Linsen:** funktional-positiv · negativ/ungültig · Grenzwerte · Ausfall/Erholung ·
i18n + Fakten-Sicherheit · Sicherheit · Performance · Barrierefreiheit/Usability
**Ausgeführte Prüffälle:** ≈ 5 100 Assertions über alle Linsen

**Ausgangslage:** `npm run abnahme` 0 Fehler · `npm run guard` Leitplanken halten ·
`npm run motion` 0 Fehler. Alle drei bestehenden Prüfungen sind grün — die Befunde unten liegen
sämtlich in deren blinden Flecken (siehe §7).

**Die drei Begleitdokumente:**
[`09-qa-fixliste.md`](09-qa-fixliste.md) ist die abzuarbeitende Liste ·
[`qa-2026-08-11/10-widerlegt-und-abdeckung.md`](qa-2026-08-11/10-widerlegt-und-abdeckung.md) enthält
die **61 Widerlegungen** (damit niemand sie erneut „entdeckt") und die Abdeckungstabellen je Linse ·
[`qa-2026-08-11/README.md`](qa-2026-08-11/README.md) erklärt die 178 ausführbaren Belege.
Nachprüfen lässt sich alles mit `npm run nachpruefung` (35 automatisierte Bestätigungsprüfungen).

---

## 🔴 Katastrophal

### C1 — Die Rechtstexte behaupten in vier Sprachen eine Zustimmungsschranke, die es nicht gibt

- **Wo:** [`src/content/home.ts:885`](../src/content/home.ts) `mapMode: 'embed'` →
  [`src/components/Home.astro:257-260`](../src/components/Home.astro) (iframe bedingungslos).
  Widersprochene Texte: [`src/content/legal.ts`](../src/content/legal.ts) Zeilen **71, 140** (tr),
  **189, 248** (ru), **295, 354** (de), **401, 458** (en) — 8 Aussagen auf 12 veröffentlichten Seiten.
- **Repro:**
  1. Frischer Browser-Kontext, kein Storage. `GET /de` → **0 Drittanbieter-Anfragen, 0 Cookies,
     leerer localStorage.** (Erster Anstrich ist tatsächlich sauber.)
  2. `document.querySelector('#kontakt').scrollIntoView()` — **kein Klick, keine Zustimmung.**
  3. Netzwerkverkehr beobachten.
- **Erwartet** (laut eigenem `/cerez` und `/gizlilik`): „Die Google-Karte wird erst geladen, wenn Sie
  das ausdrücklich anklicken."
- **Tatsächlich**, in allen 4 Sprachen, mehrfach reproduziert: Anfragen an `www.google.com`,
  `maps.googleapis.com`, `maps.gstatic.com`, `places.googleapis.com` (eine Linse zählte 33–38
  Anfragen an 6 Google-Hosts, darunter `fonts.gstatic.com`). Im `embed`-Modus existiert der
  Zustimmungsknopf gar nicht. `Referer` mit der vollen Seiten-URL geht an Google mit.
- **Wirkung:** Die veröffentlichte Datenschutzerklärung macht eine **falsche Aussage** über eine
  Auslandsübermittlung — genau den Punkt, den KVKK Art. 9 regelt. Wer `/cerez` liest und die
  Entwicklerwerkzeuge öffnet, sieht den Widerspruch. Für eine Demo, deren Verkaufsargument
  KVKK-Sauberkeit ist, trifft das den Kern des Angebots.
- **Nachweis:** 3 Linsen unabhängig + eigene Gegenprüfung (0 Drittanbieter vor dem Scrollen,
  `www.google.com` danach). Screenshots in `docs/qa-2026-08-11/screenshots/L6/s6-map-loaded.png`,
  `docs/qa-2026-08-11/screenshots/L5/map-loaded-no-consent-de.png`.
- **Technik:** Zustandsbasierte Beobachtung (Zustimmungszustand × 4 Sprachen) mit sauberem Kontext.
- **Behebung:** `mapMode: 'consent'` in `home.ts:885` — der Zustimmungspfad ist gebaut und getestet.
  Danach **die Lücke schließen:** eine Guard-Regel, die den Build bricht, wenn `mapMode === 'embed'`,
  und eine, die jedes fremde Origin in `src`/`href` innerhalb `dist/**/*.html` meldet.

> **Präzisierung:** Die Seite bindet **keine** Google Fonts selbst ein — 0 erstanbieterliche
> `<link>`/`<script>` auf Google, geprüft von drei Linsen und von mir. Die Font-Anfragen entstehen
> **innerhalb** des Google-Karten-iframes. Die „keine Google Fonts"-Regel ist also durch das Markup
> nicht verletzt; verletzt ist die Zustimmungs-Zusage.

---

## 🟠 Kritisch

### K1 — Zwei vom Guard als ⛔ gesperrt gemeldete Zusagen stehen live auf der Seite

- **Wo:** [`src/i18n/ui.ts:90-96`](../src/i18n/ui.ts) (`trust.language`, `blocked`),
  [`:99-104`](../src/i18n/ui.ts) (`garantie.arbeit`, `blocked`) gegen
  [`src/content/home.ts:409, 419, 467`](../src/content/home.ts) (de), `:567, 577, 625` (en),
  `:250, 260, 309` (ru).
- **Beleglage:** `npm run guard` druckt bei **jedem** Lauf:
  ```
  Gesperrt bis zum Beleg durch den Kunden (2):
    ⛔ trust.language — Wer genau spricht Deutsch? Betrieb oder Agentur?
    ⛔ garantie.arbeit — Arbeitsgarantie mit dem Betrieb bestätigen.
  ```
  [`content/de/master.md:165-167`](../content/de/master.md) ist ausdrücklich:
  *„Läuft die Beratung nur über die Agentur, muss es präzise heißen ‚Beratung auf Deutsch über
  WhatsApp' — nicht pauschal ‚Wir sprechen Deutsch'."*
  `instruction.md §7 Frage 4` führt genau das als **unbeantwortet**.
- **Tatsächlich ausgeliefert:** `home.ts:419` `lang: 'Wir sprechen Deutsch'` — die wörtlich
  verbotene Formulierung. `:409` im Hero-Untertitel. `:467` geht **weiter** als die gesperrte
  Fassung: *„Deutschsprachiger Service / Beratung, Montage und Garantie auf Deutsch."* — verspricht
  deutschsprachige **Montage und Garantie**. Gespiegelt nach EN und RU.
- **Wirkung:** `master.md:111` nennt eine falsche Garantiezusage selbst *„Werbungshaftung"*. Ein
  deutscher Käufer, der auf „Garantie auf Deutsch" anreist und niemanden findet, ist genau der
  Schaden, den §3.1 verhindern soll. Zusätzlich: `trust.emergency` (⛔ *„nur schreiben, wenn es
  stimmt"*) steht als `7/24 teknik destek` dreimal je Seite, während dieselbe Seite Mo–Sa 08–20 und
  das JSON-LD **ausschließlich** Mo–Sa 08:00–20:00 nennt.
- **Warum der Guard es nicht fängt:** [`scripts/guard.mjs:78-82`](../scripts/guard.mjs) prüft die
  Wortlisten nur gegen `src/i18n/ui.ts`; die `blocked`-Flags werden **gedruckt, aber nie** gegen
  `src/content/home.ts` geprüft — die Datei, die der Besucher liest. Das ist wortgleich der
  Fehlermodus, den der Guard-Kommentar (`guard.mjs:61-66`) für `soğutucu akışkan` beschreibt.
- **Technik:** Anforderungs-Rückverfolgung (Guard-Ausgabe + Redaktions-Master → ausgelieferte Prosa).
- **Behebung:** Den Build brechen lassen, wenn der Text eines `blocked`-Schlüssels — in **irgendeiner**
  Sprachvariante — in `src/content/home.ts` auftaucht. Bis zur Kundenantwort auf
  „Beratung auf Deutsch über WhatsApp" zurücknehmen.

---

## 🟠 Hoch

### H1 — Türkische GROSSSCHREIBUNG bricht die Hälfte des Chats; „GARANTI" antwortet mit der Ladenadresse
[`src/components/Assistant.astro:141`](../src/components/Assistant.astro) ·
[`src/content/kb.ts:59-190`](../src/content/kb.ts)

```
'GARANTI'.toLocaleLowerCase('tr-TR')  →  'garantı'      (punktloses ı)
'garantı'.includes('garanti')  === false   ← Garantie-Stichwort greift nicht
'garantı'.includes('ara')      === true    ← Kontakt-Stichwort greift stattdessen
```

Live, je zweimal: `GARANTI KAC YIL` → Adresse + Telefon. `garanti kaç yıl` → korrekte
Garantieantwort. `TAKSIT VAR MI`, `HIZMETLERINIZ NELER`, `ILETISIM BILGILERINIZ`, `HANGI KLIMA IYI`,
`INGILIZCE BILIYOR MUSUNUZ`, `BIR INSANLA GORUSMEK ISTIYORUM` → generischer Rückfall.
**7 von 13 Absichten fallen aus.** Mit korrektem türkischem `İ` geschrieben: 16/16 richtig.
In DE/RU/EN: 12/12 richtig — die Falle ist türkisch-spezifisch.

Der Kommentar auf `Assistant.astro:140` nennt diesen Aufruf „Türkisch-sicher". Er ist sicher für
`İ`→`i` und **falsch** für `I`→`ı`. Türkische Nutzer schreiben häufig in Großbuchstaben; Türkisch ist
der Hauptmarkt.
**Behebung:** Vor dem Vergleich beide Seiten falten (`ı`/`İ`/`I` → `i`), nicht nur die Eingabe
lokal-kleinschreiben. Nebenbefund: Stichwörter unter 5 Zeichen brauchen Wortgrenzen — `ara` trifft
`garantı`, `para`, `aralık`; `hi` trifft `hiç` und `Which`.
**Teil-Widerlegung:** `KLIMA SOGUTMUYOR` scheitert auch in Kleinschreibung — das ist eine Lücke in
der Absichtstabelle, kein Schreibungsfehler.

### H2 — Der erste Chat-Vorschlagsknopf läuft in DE, RU und EN ins Leere
[`src/content/kb.ts:193`](../src/content/kb.ts) gegen `home.ts:393` (ru), `:551` (de), `:709` (en)

| Sprache | Knopftext | Treffer in `PRICE_KW` |
|---|---|---|
| tr | `Fiyat teklifi istiyorum` | `fiyat` ✓ |
| de | `Ich möchte ein Angebot` | **keiner** |
| ru | `Хочу расчёт стоимости` | **keiner** |
| en | `I want a quote` | **keiner** |

`PRICE_KW` enthält kein `Angebot`, `quote`, `teklif`, und führt das russische **Nominativ**
`стоимость`, während der Knopf den **Genitiv** `стоимости` sagt — `includes()` kann nie greifen.
Statt der Preisantwort kommt: *„Das kann ein Fachmann besser beantworten. Schreiben Sie per
WhatsApp."* Der Besucher drückt den Knopf, den der Betrieb ihm hinstellt, für die kommerziell
wichtigste Frage — und wird an einen Menschen verwiesen. Knöpfe 2 und 3 treffen in allen 4 Sprachen.
**Behebung:** `angebot`, `quote`, `teklif`, `kostenvoranschlag`, `смета`, `расчет`, `расчёт`
ergänzen und flektierende Stämme kürzen (`стоимост`, `цен`).

### H3 — Eine hängende `/api/chat`-Anfrage tötet den Assistenten für den Rest des Besuchs
[`src/components/Assistant.astro:191-222`](../src/components/Assistant.astro)

`busy = true` wird vor `await fetch()` gesetzt; es gibt **kein** `AbortController`, **kein** Timeout,
**kein** `finally`. Route auf „annehmen, nie beantworten" (Anthropic-Stall, kalte Vercel-Funktion,
hängender Proxy):

```
nach 12 s / 20 s / 45 s:  Tipp-Blase „…" bleibt · Nutzerblasen = 1 · zweite Nachricht steht
                          unverschickt im Eingabefeld · Chips für immer versteckt
Erholung durch Schließen + Öffnen:  nein
Erholung durch Warten (45 s):       nein
Erholung durch Neuladen:            ja
```
Die Kopfzeile meldet weiter „● çevrimiçi". Die zweite Nachricht erzeugt **keine** Blase, keinen
Fehler, kein Signal — nur der Text bleibt stehen. Von drei Linsen unabhängig bestätigt.
**Zum Kontrast, und das ist gut gebaut:** Abbruch, 500, 429, `text/html`, leerer Rumpf und
`{reply:null}` fallen alle in 325–412 ms saubere auf die lokale Absichtsmaschine zurück.
**Behebung:** `AbortSignal.timeout(4000)`; `typing.remove()` und `busy = false` in ein `finally`;
`#cchips` am Ende einer Runde wieder einblenden.

### H4 — Der Chat liest die erste 2–3-stellige Zahl als Raumgröße, nicht die Fläche
[`src/components/Assistant.astro:158`](../src/components/Assistant.astro) — die Einheiten-Gruppe im
Regex ist **optional**, und `String.match` nimmt den ersten Treffer.

| Eingabe | Antwort | Korrekt nach eigener Formel |
|---|---|---|
| `0242 513 86 51 numarasından beni arayın, 80 m2 salon…` | **12.000 BTU** (nahm `024` → 24 m²) | ~48.000 |
| `Cumartesi 12:00 uygun, 60 m2 oda için klima istiyorum` | **9.000 BTU** (nahm `12`) | ~36.000 |
| `80 m2 salon için klima lazım` (Kontrolle) | 48.000 BTU ✓ | 48.000 |
| `1000 m2 depo için klima` | 48.000 BTU, Deeplink sagt **100 m²** | außer Reichweite → Mensch |

Die falsche Fläche geht auch in die WhatsApp-Übergabe. Genau die zwei Dinge, die ein Besucher auf
einer terminorientierten Seite natürlich tippt — Wunschzeit und Rückrufnummer — zerstören die
Auslegung. Ein 60-m²-Salon mit 9.000 BTU ist 4-fach unterdimensioniert, mit vollem Selbstvertrauen
gesagt. Zweimal reproduziert, plus eigene Gegenprüfung.
**Behebung:** Einheit verpflichtend, 1–4 Stellen (`/(\d{1,4})\s*(m2|m²|…)/`); über 300 m² an einen
Menschen übergeben. Denselben Clamp-Helfer wie der Rechner benutzen (die Bereiche widersprechen sich
heute: 6–200 im Widget, effektiv 10–300 im Chat).

### H5 — Die Kopfzeile läuft über; zwischen 481 und 535 px liegt der Burger komplett außerhalb des Bildes
[`src/layouts/Base.astro:237`](../src/layouts/Base.astro) (`.tbin`, kein `flex-wrap`) ·
[`:254-262`](../src/layouts/Base.astro) (Kompaktregel endet bei `max-width:480px`)

| Breite | Horizontaler Überlauf | Burger (unter 1000 px das einzige Navigationselement) |
|---|---|---|
| 320 px | **+28 px** | Box 304..348 — beschnitten, ~16 px erreichbar |
| 347 px | +1 px | beschnitten |
| 348–480 px | keiner | innen |
| **481 px** | **+55 px** | Box **492..536 — vollständig außerhalb des Viewports** |
| 500 px | +36 px | 8 px sichtbar |
| 535 px | +1 px | beschnitten |
| ≥536 px | keiner | innen |

Bei 481 px erscheint die Beizeile `GREE · ALANYA` wieder (`white-space:nowrap`), die Zeile braucht
536 px, und `.mainnav` kommt erst ab 1000 px. In diesem Band gibt es **keine erreichbare Navigation**
ohne seitliches Scrollen. Betroffen: iPad-Splitview (507 px), verkleinerte Desktop-Fenster,
Faltgeräte-Außenschirme; 320 px ist zugleich das WCAG-1.4.10-Reflow-Ziel und 400 % Zoom auf 1280 px.
`npm run abnahme` prüft 390 px — mitten im sauberen Band.
**Behebung:** `flex-wrap:wrap` auf `.tbin`, Kompaktregel auf `max-width:759px` heben.

### H6 — Der BTU-Rechner sättigt bei 48.000 und schreibt die eingegebene Fläche still um
[`src/components/Home.astro:551-562`](../src/components/Home.astro)

```
76 m², 2 Pers.   → 36.000
77 m², 2 Pers.   → 48.000     ← ab hier ändert sich nichts mehr
200 m², 12 Pers., Sonne → Last 133.400 BTU, Anzeige 48.000  (−64 %)
500 m² eingetippt → Feld zeigt weiter „500", Anzeige 48.000,
                    WhatsApp-Nachricht sagt „200 m²"
```
Von 77 bis 200 m² (124 von 195 Werten bei 2 Personen) liefert das Werkzeug **denselben** Wert;
`snap()` kann `STEP[5]` nie überschreiten. Die Villa mit 200 m² und die Halle mit 500 m² bekommen
dieselbe Antwort wie die 77-m²-Wohnung — und der Betrieb bekommt eine **falsche Fläche** für genau
die hochwertigen Anfragen. Der sichtbare Hinweis „Näherung, wir messen vor Ort" mildert die Zahl,
nicht das stille Umschreiben.
**Behebung:** Clamp in das Feld zurückschreiben; über der höchsten Stufe „mehrere Geräte /
Vor-Ort-Auslegung" sagen statt 48.000 zu behaupten.

### H7 — Das Telefonfeld nimmt jede nicht-leere Zeichenfolge an
[`src/components/RequestForm.astro:52`](../src/components/RequestForm.astro) + `:163-192`

Das Formular ist `novalidate`, `type="tel"`/`inputmode` prüfen zur Laufzeit nichts, und der eigene
Handler testet nur Leere nach `trim()`. Alle 12 ungültigen Klassen gehen durch: `1`, `0`, `abc`,
`++++`, `-`, `!!!`, `a@b.com`, `DROP TABLE`, 29 Nullen, `çğüöşı`, `💩💩`, `<script>x</script>`.
Der Besucher sieht WhatsApp aufgehen und glaubt, der Termin sei unterwegs; der Betrieb bekommt eine
Anfrage, die er nicht zurückrufen kann — beim einzigen Feld, auf das er handeln muss.
**Behebung:** nach der Leerprüfung `if (phone.replace(/\D/g,'').length < 7)` → Fehler, der das
Telefonfeld benennt. **Positiv:** die Pflicht-/Zustimmungs-Logik selbst ist sauber — alle 8
Kombinationen aus Name × Telefon × Zustimmung verhalten sich korrekt.

### H8 — Der Chat ist bei 200 % Zoom und im Querformat nicht bedienbar (WCAG 1.4.4, AA)
[`src/components/Assistant.astro:52-57`](../src/components/Assistant.astro) (`max-height` +
`overflow:hidden`) + `:69` (`.cbody{min-height:120px}` blockiert das Schrumpfen)

| Viewport | Panel | `#cin` | Trefferprüfung in der Feldmitte |
|---|---|---|---|
| 390×844 Hochformat | 422..832 | 773..819 | `cin` ✓ |
| 640×400 (200 % Zoom) | 78..388 | 369..**415** | liefert einen Link, **nicht das Feld** |
| 320×200 (400 % Zoom) | 78..188 | **429..475** | **NULL** |
| 844×390 Telefon quer | 42..312 | **393..439** | **NULL** |

Das Mausrad hilft nicht (`overflow:hidden`). Nur Tab erreicht das Feld, und dann scrollen Kopfzeile
und Begrüßung aus dem Bild. **Wer sein Telefon quer dreht, erreicht das Eingabefeld nicht.**
Eingeordnet als Hoch, nicht Kritisch: Telefon, WhatsApp und das Terminformular bleiben intakt.
**Behebung:** `overflow-y:auto` auf `.chatpanel`, `min-height:0` auf `.cbody`.

### H9 — Kein `<main>`, kein Sprunglink, sieben von elf Abschnitten ohne Überschrift (WCAG 2.4.1 + 1.3.1, A)
[`src/layouts/Base.astro:128`](../src/layouts/Base.astro) ·
[`src/components/Home.astro:41,60,96,139,167,194,218,240`](../src/components/Home.astro)

`document.querySelector('main,[role=main]')` → **`null`** auf allen 6 geprüften Seiten. **13
Tab-Anschläge** am Desktop (7 mobil) bis zum ersten Inhaltselement. axe meldet `region` auf 48–50
Knoten: praktisch der gesamte Inhalt liegt außerhalb jedes Landmarks. Von 11 `section[id]` haben
**7 gar keine Überschrift** (`#urunler`, `#teknik`, `#referanslar`, `#kesif`, `#yorumlar`,
`#hakkimizda`, `#kontakt`) — die Abschnittstitel sind `<p class="eyebrow">`. Auf der ganzen Startseite
existieren **2 `<h2>`**; die Gliederung springt h1 → h3. Ein Screenreader-Nutzer kann „Ürünler",
„BTU hesapla", „Yorumlar", „Hakkımızda" und „İletişim" über keinen der drei üblichen Wege finden.
**Behebung:** `<main>` um den Slot, Sprunglink als erstes fokussierbares Element, `.eyebrow` zu `<h2>`.

### H10 — Der Sonnen-Schalter hat keinen sichtbaren Fokusring (WCAG 2.4.7, AA)
[`src/components/Home.astro:382`](../src/components/Home.astro) — `.toggle{overflow:hidden}` gegen
`global.css:85` `outline-offset:3px`

Die berechnete CSS-Angabe *behauptet* `solid 2px rgb(217,194,122)` und `:focus-visible` greift — aber
ein Pixel-Vergleich fokussiert/unfokussiert ergibt **0 veränderte Pixel**, in beiden Themes, an
Desktop und Handy, über 6 Läufe. `outline-offset:3px` schiebt den Ring nach außen, wo `overflow:hidden`
ihn abschneidet. Der zweite Knopf behält 88 px Ring gegen 400–2.530 px bei korrekt umrandeten
Elementen. Hier lügt das CSS — nur der Pixelbeweis zeigt es.
**Behebung:** `overflow:hidden` von `.toggle` nehmen (Kindecken stattdessen runden) oder
`outline-offset:-3px`.

### H11 — Der Chat-Dialog fängt den Fokus nicht und lässt ihn nach Escape auf einem versteckten Element
[`src/components/Assistant.astro:20`](../src/components/Assistant.astro) (`role="dialog"`, ohne
`aria-modal`, ohne `aria-labelledby`) · `:115-122`

AX-Baum: `dialog "Assistant" modal=false`. Vom Sende-Knopf führt **ein** Tab aus dem Dialog heraus auf
den ersten Seitenlink, während der Dialog offen bleibt und die Seite verdeckt. Nach Escape ist
`document.activeElement` das `INPUT#cin` **innerhalb des jetzt `hidden` Panels** (3 von 4
Theme/Viewport-Kombinationen) bzw. `BODY` — nicht `#chatfab`. Der nächste Tab beginnt wieder oben.
**Der Burger macht es richtig** und ist die Vorlage: Escape schließt und gibt den Fokus an `#burger`
zurück ([`Base.astro:224`](../src/layouts/Base.astro)).

### H12 — Die Antworten des Assistenten werden nie angekündigt (WCAG 4.1.3, AA)
[`src/components/Assistant.astro:28`](../src/components/Assistant.astro) — `#cbody` hat
`aria-live: null`, `role: null`. Blasen entstehen per `createElement`. Ein Screenreader-Nutzer stellt
eine Frage und erfährt nichts. **Behebung:** `role="log"` + `aria-live="polite"` auf `#cbody`.
Verstärkend: nach einem Chip-Klick bleibt der Fokus auf dem gerade `display:none` gesetzten Chip
(`:197`).

### H13 — Das LCP-Bild ist ein CSS-Hintergrund und damit für den Preload-Scanner unsichtbar
[`src/components/FrostHero.astro:76`](../src/components/FrostHero.astro)

| Ereignis | ms nach Navigationsstart (mobil, Fast 3G, CPU 4×) |
|---|---|
| HTML fertig | 664 |
| `Home.*.css` fertig — Bild jetzt erst auffindbar | 1360 |
| **`hero-shop.webp` startet** | **1480** |
| fertig (168 KB) | 4337 |
| **LCP** | **4544 ms** (Fast 3G) · **18.496 ms** (Slow 3G) |

Es startet 816 ms zu spät und **hinter** vier ebenfalls spät entdeckten Font-Subsets, die sich
dieselbe Leitung teilen. Kausal belegt: Bild blockieren → LCP **−1104 ms**, und das LCP-Element wird
Text. Der Kontaktweg ist nicht blockiert (FCP 2,0 s; WhatsApp-Knopf, beide Nummern und 5,0/65 sind
zum FCP lesbar) — es ist Glaubwürdigkeitsschaden, keine gebrochene Aufgabe.
**Behebung:** `<link rel="preload" as="image" fetchpriority="high">` neben die zwei Font-Preloads,
und eine mobil dimensionierte Variante (das Handy braucht 826×2264 aus einer 1600×1200-Quelle — eine
engere Beschneidung wäre **kleiner und besser**).

### H14 — GSAP + ScrollTrigger verursachen 63 % der Blockierzeit
[`src/scripts/motion.ts:255-284`](../src/scripts/motion.ts)

| Variante (mobil, Fast 3G, CPU 4×, je 3 Läufe) | TBT Median | FCP |
|---|---|---|
| unverändert | **1377 ms** | 2288 ms |
| gsap + ScrollTrigger blockiert | **514 ms** | 1956 ms |

−863 ms TBT (−63 %) und −332 ms FCP. Über die Drossel-Matrix: 36 ms ungedrosselt → 942 → 1268 →
1353 → **3312 ms** (Slow 3G / CPU 6×), schlimmste Einzelaufgabe **2185 ms**. Die Ablaufverfolgung
zeigt: die Kosten sind **Layout, nicht Bytes** — `Layout` 1683,7 ms und `UpdateLayoutTree` 485,2 ms
gegen ~250 ms Skriptausführung (gsap.js selbst nur 11,7 ms). Der teure Teil ist ScrollTriggers
Messdurchlauf über jedes `[data-reveal]`. Für rund eine Sekunde (bis 3,3 s) stauen sich Taps auf den
WhatsApp-Knopf hinter dem Hauptthread.
**Behebung:** `ScrollTrigger.batch` bzw. ein einziger `IntersectionObserver` für die `once:true`-
Enthüllungen statt einer Instanz pro Element.

### H15 — Ein blockiertes Popup lässt das Terminformular völlig lautlos scheitern
[`src/components/RequestForm.astro:207`](../src/components/RequestForm.astro) — der Rückgabewert von
`window.open()` wird nicht geprüft.

Mit `window.open → null` (Safari/Firefox bei nicht klar nutzerinitiierten Aufrufen, Inhaltsblocker,
In-App-Webviews): `#reqErr` bleibt `hidden` und leer, kein Erfolgstext, Formular bleibt gefüllt,
Fokus bleibt auf dem Knopf. Der Besucher drückt den Haupt-Conversion-Knopf und **es passiert nichts,
ohne jede Erklärung.** Die `wa.me`-URL wird korrekt gebaut — sie geht nur nirgendwohin.
**Behebung:** `const w = window.open(...); if (!w) { den wa.me-Link sichtbar und klickbar in #reqErr
anzeigen }`. Dazu fehlt auch auf dem Erfolgspfad jede Bestätigung (siehe M-Liste).

### H16 — `/api/chat` hat keine Origin-Prüfung: fremde Seiten können das Anthropic-Budget verbrennen
[`api/chat.js:82-96`](../api/chat.js) (keine `Origin`/`Referer`-Prüfung, keine CORS-Erklärung,
kein Token) und [`:59-80`](../api/chat.js) (Zähler im Instanzspeicher, Schlüssel aus einem
Client-Header)

Gegen den echten Handler in einem lokalen Node-Harnisch ausgeführt: eine Angreiferseite feuert
`fetch(..., {mode:'no-cors', headers:{'content-type':'text/plain'}})`. `text/plain` ist CORS-sicher,
also wird **kein Preflight** gesendet und der Browser blockt nie; `chat.js:90` parst den String-Rumpf
bereitwillig. 20 Anfragen, `preflightSent=false`, **8 erreichten das LLM**. Mit rotierendem
`X-Forwarded-For`: **60 von 60**. Und da Vercel XFF selbst setzt, ist in Produktion jeder Besucher
der Angreiferseite ein **frischer Eimer** — 10.000 Besucher = 80.000 Claude-Aufrufe. `hits` ist
zudem pro Instanz.
**Heute latent**, weil kein `ANTHROPIC_API_KEY` gesetzt ist — scharf in dem Moment, in dem einer
gesetzt wird.
**Behebung:** (a) ablehnen, wenn `origin`/`referer` nicht zur eigenen Herkunft passt (und wenn beide
fehlen); (b) `content-type: application/json` verlangen, sonst 415 — das allein stellt die
Preflight-Schranke wieder her; (c) Zähler nach Upstash/Redis; (d) hartes Tagesbudget, das auf
`fallback:true` umschaltet.

---

## 🟡 Mittel

| # | Befund | Ort | Nachweis |
|---|---|---|---|
| M1 | BTU-Ergebnis in **allen** Sprachen `tr-TR` formatiert: `/en/` zeigt `36.000` direkt über einem Produkt-Tag `24,000–48,000 BTU`; der Chat auf derselben Seite sagt korrekt `36,000` | `Home.astro:559`, `:118` | 3 Linsen + eigene Prüfung, 4 Sprachen |
| M2 | `snap()` bricht Gleichstände **nach unten**: 24 m²/5 Pers. = Last 15.000 → empfiehlt `12.000` statt 18.000. Alle 5 erreichbaren Mittelpunkte, −14 bis −20 % | `Home.astro:552`, dupliziert in `Assistant.astro:148` | analytisch + 20 Läufe |
| M3 | `0` oder leeres Feld erfindet ein Ergebnis für 25 m²/2 Pers.: `f(5)=9000`, **`f(0)=12000`**, `f(-1)=9000` — nicht monoton, und der Deeplink behauptet „25 m²" | `Home.astro:554-555` | eigene Prüfung |
| M4 | Die Zähler starten bei 0 und überschreiben den korrekten SSR-Text: für ~700 ms steht **„★ 0,8 · 10 Google"** statt 5,0/65 — die Vertrauenszahl der ganzen Demo sinkt sichtbar unter die Wahrheit | `motion.ts:175-198` | rAF-Abtastung, 2 Sprachen × 2 Läufe |
| M5 | Doppeltipp auf „Senden" öffnet **zwei** identische `wa.me`-Deeplinks; Knopf wird nie deaktiviert → doppelte Anfrage beim Betrieb | `RequestForm.astro:163`, `:207` | dblclick + 2 Klicks, je 2 Läufe |
| M6 | Ohne WebGL: **unbehandelter** `PAGEERROR: THREE.WebGLRenderer: Error creating WebGL context` (bricht das eigene „keine JS-Fehler"-Tor), Legende bleibt bei `opacity:.45` → **3,46:1** (eine Linse maß 2,36:1); AA braucht 4,5 | `ExplodedUnit.astro:92` bar aufgerufen, während `motion.ts:269` fängt | eigene Prüfung, 2 Läufe |
| M7 | Verlorener WebGL-Kontext (Android-Speicherdruck, GPU-Absturz): weißer 633×423-Kasten mit Bild-Kaputt-Symbol mitten auf der dunklen Seite, **erholt sich nie** — 0 `webglcontextlost`/`restored`/`dispose`-Handler in ganz `src/` | `ExplodedUnit.astro` | Clip-Hash-Vergleich, 2 Läufe |
| M8 | Auf echtem Fast 3G blendet das Bewegungssystem Inhalt, den die Notbremse gerade gerettet hat, wieder auf **opacity 0**: Notbremse 3110 ms, gsap 3271 ms, 574 ms dunkel | `Base.astro:110-125` gegen `motion.ts:142` | CDP-Drosselung, ohne Route-Eingriff |
| M9 | Fällt das Bewegungs-Bundle aus, ist alles unter dem ersten Bild **~2,5 s leer** (`tr 2557 · de 2533 · ru 2550 · en 2557 ms`; mobil 2558) | `Base.astro:110-125`, `global.css:118` | 4 Sprachen + mobil |
| M10 | `theme-color` wird beim Laden nie wiederhergestellt: `meta=#100D0B` über `bodyBg=rgb(246,243,238)` — genau der Fehler, den der Kommentar auf `Base.astro:64` verhindern will | `Base.astro:66`, `:73-82` vs `:203` | 2 Linsen, 4 Sprachen + 2 Rechtsseiten |
| M11 | Alle 12 Rechtsseiten haben **keine** Fußzeile, keine `.mobar`, kein `.wafab`, keinen Chat — 0 `tel:`, 0 `wa.me` gegen 4 bzw. 9 auf der Startseite; und keine Querverweise zwischen den drei Dokumenten | Fußzeile etc. liegen in `Home.astro:276-312` statt im Layout | alle 12 Routen |
| M12 | Der vollständige Geschäfts-Graph inkl. `aggregateRating 5/65`, `foundingDate`, Öffnungszeiten und **allen 6 Leistungen mit Beschreibung** steht im JSON-LD der 12 Rechtsseiten und der 404, wo nichts davon sichtbar ist (20–24 unbelegte Aussagen je Seite) — die Regel, die `Schema.astro:5-8` selbst aufstellt | `Base.astro:102` | 17 Seiten geprüft |
| M13 | Der deutsche Platzhalter `⟨vom Betrieb zu ergänzen⟩` steht sichtbar in der Datenverantwortlichen-Angabe aller vier KVKK-Seiten (tr 4× · ru 3× · de 3× · en 3×) | `legal.ts:32` | Zählung im Build |
| M14 | Der KVKK-Abschnitt **Aufbewahrungsfrist** existiert nur auf Türkisch (`legal.ts:75`); ru/de/en haben 5 statt 6 Blöcke — eine Pflichtangabe fehlt in drei Sprachen | `legal.ts` | Blockvergleich |
| M15 | Das deutsche Wort **„BEISPIEL"** ist das Beispiel-Abzeichen für russische und englische Besucher; ein übersetzter Schlüssel existiert und wird nicht benutzt | `Home.astro:203` | 3 Linsen |
| M16 | Der Platzhalter des Wunschtag-Feldes ist in allen 4 Sprachen hartkodiert türkisch (`Örn. Cumartesi öğleden sonra`) — die Nachbarfelder derselben Komponente machen es richtig | `RequestForm.astro:66` | 4 Sprachen |
| M17 | **`--warn` ist nie definiert**, wird aber dreimal benutzt: die KI-Offenlegung verliert ihre Tönung, das „Beispiel"-Abzeichen seine Warnfarbe, und der Entwurfs-Hinweis auf allen 12 Rechtsseiten seinen Akzentbalken | `Assistant.astro:68`, `Home.astro:449`, `LegalPage.astro:35`; `tokens.css` hat kein `--warn` | eigene Prüfung |
| M18 | Sitemap und hreflang widersprechen sich, entgegen dem Kommentar „aus EINER Quelle": Seiten sagen `de` + kein Schlussschrägstrich, Sitemap `de-DE` + Schrägstrich; `x-default` fehlt in der Sitemap (0 von 64) | `astro.config.mjs:20-28` vs `i18n/utils.ts:59-64` | Dateivergleich |
| M19 | Kontrast unter AA in beiden Themes, im hellen schlechter: `#reqErr` **4,07 / 3,46** · Legende (5 von 6 Einträgen dauerhaft) **2,36 / 2,07** · `.exp-hint` **4,13** · Fußzeilen-Copyright **4,10 / 3,40** · „Beispiel"-Abzeichen **4,09 / 3,06** | `RequestForm.astro:135`, `ExplodedUnit.astro:64`, `Home.astro:449,501` | Pixelmessung, 1.811 Textläufe |
| M20 | Nicht-Text-Kontrast von Bedienelement-Rändern (WCAG 1.4.11, braucht 3,0): alle Formularfelder **2,08 / 1,87–2,03**; der Theme-Schalter **1,39 / 1,35** — sein 1-px-Rand bei 16 % Deckkraft ist das Einzige, was ihn als Knopf erkennbar macht; WhatsApp-FAB 1,96 | `RequestForm.astro:116`, `Base.astro:272` | Randabtastung |
| M21 | Der Chat verwirft eine zweite Nachricht innerhalb von **300 ms** stillschweigend (0/3 bei 50–260 ms, 3/3 ab 300 ms; 20 Schnellfeuer-Sends → 1 angenommen, 19 verworfen). Text bleibt im Feld, also kein Datenverlust — aber „Enter tat nichts" | `Assistant.astro:193` | Grenzwertanalyse |
| M22 | Die zwei Font-Preloads sind **sprachunabhängig lateinisch**; die drei kyrillischen Subsets werden nie vorgeladen → der ganze russische Fließtext steht 0,9–1,8 s (Fast 3G) bzw. 3,1–4,2 s (Slow 3G) in der Ersatzschrift | `Base.astro:99-100` | Subset-Timing, 2 Netze × 2 Sprachen |
| M23 | `logo-light.png` ist 600×213 bei **51,7 KB** und wird mit 96×34 CSS angezeigt → **39-fache** Überlieferung, im kritischen Pfad aller 4 Sprachen (52 von 220 KB Bildboden). Theme-Wechsel holt zusätzlich 47,8 KB `logo-dark.png` | `Base.astro:246-249` | `sharp`-Metadaten + Ressourcen-Timing |
| M24 | `#teknik` ist der **einzige** Abschnitt, der Frames verliert: **37,4 fps, 19,8 % Frames > 33,4 ms** (übrige Seite 58–60 fps, Produktbild-Parallaxe 0 %) — ~50 Draw-Calls pro Frame ohne Instancing | `ExplodedUnit.astro:333-346` | Abtastung mit konstanter Geschwindigkeit, 5 Läufe |
| M25 | Die Hero-Partikelschleife pausiert **nicht**, wenn der Hero außer Sicht ist: 61 rAF/s mit dem Hero 14.816 px über dem Viewport, **448 ms Hauptthread je 3 s zu 100 % unsichtbar**. `FrostHero.astro` hat 0 `IntersectionObserver`, `ExplodedUnit.astro` hat 3 — und pausiert korrekt auf 0 Draws/s | `FrostHero.astro` | 2 Linsen, Draw-Call-Zählung |
| M26 | Chat-Blasen haben kein `overflow-wrap`: ein 200-Zeichen-Token oder eine eingefügte URL erzeugt eine 1.385–1.562 px breite Blase, `#cbody` bekommt einen horizontalen Scrollbalken; das Dokument-`scrollWidth` bleibt unverändert — deshalb sieht die bestehende Überlaufprüfung es nicht | `Assistant.astro:84-85`, kein `maxlength` auf `#cin` | 2 Linsen |
| M27 | `{"message":{"toString":1}}` bricht die Funktion mit unbehandeltem `TypeError` → 500, statt des zugesagten `200 {reply:null, fallback:true}`. `String()` in Zeile 91 steht **außerhalb** des `try` in Zeile 97 | `api/chat.js:91` | eigene Prüfung + 11 Rumpfformen |
| M28 | Die Seite lässt sich von jeder Herkunft in einen Frame setzen: kein `X-Frame-Options`, kein CSP `frame-ancestors`, kein Frame-Buster. Von einer Angreiferseite aus wurde der Chat im Frame geöffnet | `vercel.json` | 2 Läufe |
| M29 | Drei zugängliche Namen in der falschen Sprache: `nav.lang` = `"Language"` (englisch, alle 4), `#chatpanel` = `"Assistant"` (englisch, alle 4), `ol.flow` = `"Süreç"` (türkisch in de/ru/en). Chat-Schließknopf heißt `aria-label="×"` → „Multiplikationszeichen, Schaltfläche" | `Base.astro:159`, `Assistant.astro:20,25`, `Projects.astro:53` | 2 Linsen, 4 Sprachen |
| M30 | Der Sonne-ja/nein-Zustand ist für Hilfsmittel unsichtbar (kein `aria-pressed`, `role="group"` ohne Beschriftung) und in `forced-colors` **auch visuell weg** (beide Knöpfe `rgb(255,255,255)`); der Theme-Schalter meldet ebenfalls kein `aria-pressed` | `Home.astro:111-115`, `Base.astro:149` | AX-Baum, 2 Läufe |
| M31 | Bei offenem Chat sind fokussierte Fußzeilen-Links zu **4 von 4 Ecken** verdeckt (WCAG 2.4.11); das Panel ist nicht modal und nicht `inert`, bleibt also unsichtbar tastaturerreichbar. Ohne Chat verdeckt die `.mobar` `#ccta` zu 47 % und das Wunschzeit-Feld zu 49 % | `Assistant.astro:57`, `Home.astro:514` | Ecken-Trefferprüfung |
| M32 | Die Fehlermeldung wird **geschrieben, während `#reqErr` noch `hidden` ist**, und dann eingeblendet — das Muster, das in NVDA/JAWS nicht ankündigt; zweimaliges Absenden erzeugt byte-identischen Text (keine Mutation). Kein `aria-invalid`, kein `aria-describedby` auf den fehlerhaften Feldern | `RequestForm.astro:181-190` | Mechanismus gemessen; Ankündigung nicht prüfbar (kein Screenreader) |
| M33 | Die Bewertungen sind asymmetrisch (tr 3, de/ru/en je 2, davon eine als Beispiel gekennzeichnet) → ab 820 px bleibt eine 383-px-Spalte des Dreierrasters leer, und die drei Exportsprachen zeigen **je eine** echte Bewertung. Die eine echte fremdsprachige Rezension ist eine unmarkierte Übersetzung von Adem Tokaç | `home.ts:216-220` vs `:376,534,692`; `Home.astro:443` | 2 Linsen |
| M34 | Bei 24 px Grundschriftgröße läuft der Rechnerkasten auf 389 px und überläuft jeden Viewport ≤ 412 px (`.calc-cta{width:max-content}`, `input{width:140px}`, kein `min-width:0`) | `Home.astro:376,380,390` | 2 Läufe je Breite |

---

## 🔵 Niedrig (verdichtet)

**Inhalt & i18n:** `/en/` zeigt `5,0` im Hero und `5.0` bei „Über uns" · der WhatsApp-Text des
Rechners ist in allen Sprachen `kişi/чел./Pers.` ohne ein englisches Wort · die 404 kanonisiert auf
die Startseite und trägt eine nicht-gegenseitige hreflang-Gruppe · die 404 hat **kein `h1`** ·
`foundingDate: "2021"` steht im JSON-LD aller 17 Seiten, sichtbar aber nur auf 4 — und
`instruction.md §3.1/§10` sowie `docs/04-anforderungen.md` verbieten das Feld noch, während
`acceptance.mjs:98` es inzwischen **erzwingt**; der Kundenbeleg steht nur in einem Code-Kommentar.

**Ausfallverhalten:** ohne JavaScript sind Chat-Knopf, Burger und Theme-Schalter sichtbar und
funktionslos (der Kontaktweg über `.mobar` bleibt vollständig intakt) · das Formular verliert bei
Sprachwechsel alle Eingaben ohne Warnung (Zurück stellt sie her) · bei blockiertem Google ist die
Karte ein leerer 440-px-Kasten ohne Erklärung · fällt `/images/**` aus, verschwindet der Firmenname
aus der Kopfzeile (er existiert nur als CSS-Hintergrund) · das Logo ist in `forced-colors` unsichtbar
(3.113 von ~3.292 Pixeln reinweiß, ≈1,0:1), und es gibt **0** `@media (forced-colors)`-Regeln.

**Sicherheit:** `waButton()` schreibt eine ungeprüfte URL direkt in `a.href`, gefüttert aus
`j.wa` der API-Antwort — als XSS **widerlegt** (Chromium blockt `javascript:` unter `target=_blank`,
mit Kontrollversuch belegt), als Phishing-/Open-Redirect-Senke im „mit einem Menschen sprechen"-Knopf
aber real · zwischen LLM-Antwort und Besucher liegt **kein** Ausgabefilter: eine eingespeiste Antwort
mit Preis, Gründungsjahr 1997, der Konya-Nummer und „Kühlmittel" wurde wörtlich gerendert
(4 Projektregeln in einem String) · `locale` wird nicht gegen eine Positivliste geprüft, sodass
`__proto__`/`constructor` als Sprachanweisung in den Systemprompt geraten (echte Prototype Pollution
**widerlegt**) · kein `maxlength` auf `#cin`, eine 1-MB-Nachricht erzeugt einen 1.000.028-Byte-POST ·
der Karten-iframe hat kein `sandbox`, sendet die volle URL als `Referer` und darf `allowfullscreen`.

**Auslieferung:** `/angebot/Global%20Technik%20Klima%20Bestellung.html` ist öffentlich abrufbar
(200, 371.874 Bytes) — das Funktionsauswahl-Angebot der Agentur mit Monatspreisen in USD und
Unterschriftsfeld, auf der Domain, die dem Interessenten gezeigt wird. Es trägt korrekt
`<meta name="robots" content="noindex,nofollow">`, steht nicht in der Sitemap und ist von nirgends
verlinkt; `robots.txt` sagt aber `Allow: /` und es gibt keinen `X-Robots-Tag`. **`/angebot/` selbst
liefert 404** — nur der lange Dateiname funktioniert. · `p-vrf.webp` wird von keiner Seite
referenziert (toter Ballast; `og.jpg` dagegen **ist** korrekt als `og:image` eingebunden und wird
absichtlich nicht von der Seite geladen). · `vercel.json` cacht nur `/fonts/(.*)`; für die
inhaltsgehashten `/_astro/*` — inklusive des 724-KB-Three.js-Bündels — gibt es keine Cache-Regel,
obwohl `immutable` dort kostenlos sicher wäre. · 6 von 9 `wa.me`-Ankern ersetzen die Seite statt
einen Tab zu öffnen (darunter der Hero-Haupt-CTA und `#ccta`), während `.wafab`, `.camp-cta` und das
Formular es umgekehrt machen — eine Richtlinie fehlt.

---

## ✅ Nachweislich in Ordnung

**Fakten-Sicherheit (statischer Durchlauf über 31 Textdateien des Builds, inkl. aller Client-Bündel)**
Die **Konya-Nummer `+90 332 325 25 50` kommt nirgends vor** — in keiner Schreibweise. Jede
10+-stellige Ziffernfolge im Build ist entweder eine Kartenkoordinate, eine Three.js-Konstante oder
eine der zwei korrekten Nummern. Kein `1997`, kein anderes Gründungsjahr. Die vier verbotenen
Glossarwörter (`Kühlmittel`, `Instandhaltung`, `кондей`, `soğutucu akışkan`) stehen **nur** in
Kommentaren und in `master.md`, nie in ausgelieferter Prosa. **Kein Preis, keine Währung** auf der
vierprachigen Seite. Kein `priceRange`, kein FAQ-Schema. Keine Analytics, kein Pixel, kein fremdes
CDN im eigenen Markup, keine Google-Fonts-Einbindung, keine Schlüssel oder Sourcemaps im Build.
Keine Pseudo-Locale-Reste. `/instruction.md`, `/HANDBUCH.md`, `/docs/`, `/.git/config`, `/.env`,
`/package.json`, `/api/chat.js` und 28 weitere Pfade: alle 404.

**Funktional (1.590 Assertions, 4 Sprachen)**
Alle 13 Abschnitte vorhanden und gefüllt, mit korrekten Stückzahlen in jeder Sprache (6 Leistungen,
7 Produkte, 6 B2B-Segmente, 4 Systeme, 5 Prozessschritte, 3 Garantiestufen, 4 Warum-Kacheln,
2 Kampagnenkarten, 6 Formularoptionen, 3 Rechtslinks, 5 Legendenteile). **Terminformular-Happy-Path:
genau ein `window.open` mit `('_blank','noopener')` auf `wa.me/905330461387`, und die entschlüsselte
Nachricht trägt jeden eingegebenen Wert mit dem Etikett **seiner** Sprache** — 8 Zeilen, Herkunft
zuerst. Leere Optionalfelder werden korrekt weggelassen. **BTU-Entscheidungstabelle: alle 80 Regeln
(8 Flächen × 5 Personen × 2 Sonne) treffen einen unabhängig nachgebauten Orakelwert**, in Anzeige
und Deeplink — der Wert ist überall richtig, nur die Notation nicht (M1). Sprachumschalter: **alle 48
sprachübergreifenden Wechsel landen auf demselben Dokument** — `/de/kvkk` → RU ergibt `/ru/kvkk`,
nie die Startseite. Alle 28 Navigationslinks landen unter der Sticky-Kopfzeile auf ihrem Ziel.
Vorher-Nachher-Regler: per Maus **und** per Tastatur (Pfeile, Pos1/Ende, Bild↑/↓), `--pos` und
Reglerwert stimmen überein, nach `pointerup` friert er korrekt ein.
`hreflang`: 5 Einträge auf allen 17 Seiten, absolut, **volle Gegenseitigkeit auf allen 16 echten
Seiten**, `x-default` auf die türkische Wurzel, `canonical` selbstreferenzierend, `og:url` gleich
`canonical`. Die JSON-LD-Aussagen der **vier Startseiten** sind zu 100 % sichtbar belegt.

**Robustheit — das beste Ergebnis der Prüfung**
**Ohne JavaScript** (4 Sprachen + mobil) ist die Seite vollständig: alle ~50 Enthüllungsblöcke
sichtbar, 6.434–7.115 Zeichen Text, 4 × `tel:`, 9 × `wa.me`, beide Nummern lesbar, alle Rechtslinks
da, kein Überlauf. Ein Crawler ohne JS sieht die komplette Seite. Wird das Bewegungs-Bundle
abgebrochen (gsap, ScrollTrigger, preload-helper, **alle** `_astro/*.js`), endet es **jedes Mal** im
sicheren Zustand ohne unbehandelten Fehler. Google, `/images/**`, `/fonts/*.woff2` blockiert — einzeln
und alle zusammen: kein Überlauf, kein Seitenfehler, kein Bild mit Nullhöhe, Kartenhöhe identisch zur
Grundlinie. **Storage-API 13/13:** wenn `localStorage` wirft, bleibt es dunkel, der Schalter arbeitet
für die Sitzung weiter, nichts landet in der Konsole; alle 10 Müllwerte in `theme` (inkl. 1 MB String
und `__proto__`) fallen sauber auf dunkel zurück. **`prefers-reduced-motion` 20/20:** Inhalt ab
t=0 ms sichtbar, Explosionszeichnung als statisches Bild mit **0 rAF über 2 s**, Zähler stehen still
mit korrekter Sprachformatierung, **CLS = 0,0000**, und das Umschalten mitten im Besuch räumt GSAPs
Inline-Stile korrekt auf. Kein Blinken: 20 Leuchtdichte-Proben über 2 s, monotoner Anstieg, dann auf
5 Dezimalstellen konstant. Historie 8/8: Hash-Zurück und -Vorwärts treffen den Scroll-Offset exakt
(Delta 0). Kein Speicherleck im eigenen Code: mit blockierter Karte plateauen Heap, DOM-Knoten (+0)
und Listener (+5) über 10 volle Scroll-Durchläufe.

**Performance-Disziplin, die hält**
**Three.js ist nachweislich nicht im Erstladen:** 0 Vorkommen in allen 6 gebauten HTML-Dateien,
**0 Anfragen vor `load` in 24 von 24 Läufen**, 0 WebGL-Kontexte, wenn `#teknik` nie erreicht wird.
Erst-JS: **26,0 KB unkomprimiert / 13,1 KB gzip**, exakt 4 Dateien, stabil in 23/24 Läufen — die
dokumentierte Disziplin ist eingehalten. Der Lazy-Import hängt korrekt am `IntersectionObserver`
(12/12), Parsen+Szenenaufbau nur 137–144 ms. **CLS 0,0051 mobil / 0,0496 Desktop** — beide im guten
Band, und durch Mutationstests eindeutig dem Font-Swap zugeordnet (Fonts blockiert → CLS exakt 0),
womit Enthüllungssystem, Zähler, Hero-Canvas und Bilder freigesprochen sind. Alle 10 `<img>` tragen
`width`/`height` mit korrektem Seitenverhältnis. Kein Preload ungenutzt. Kyrillische Subsets laden
**nicht** auf tr/de/en. `font-display: swap` auf allen 9 Schnitten, kein unsichtbarer Text.
Ein-Logo-Disziplin bestätigt. Statische Auslieferung: 32 gleichzeitige Anfragen → 800–941 req/s,
p95 37 ms, 0 Fehler. Chat serialisiert sauber: 20 Nachrichten einzeln → je 298 ms **ohne
Latenzanstieg**, +6 Knoten pro Austausch, 0 verloren, 0 vertauscht.

**Sicherheit, die hält**
24 XSS-Payloads × 2 Läufe durch den Chat: **kein einziges** erzeugte einen Elementknoten, einen
Dialog oder einen Kanarienvogel-Treffer — `bubble()` benutzt konsequent `textContent`. DOM-XSS über
Query und Hash: nichts liest `location` für Inhalt. Formular → URL: fester `https://wa.me/`-Präfix
plus `encodeURIComponent` macht Schema- und Trennzeichen-Injektion unmöglich (mit `<img onerror>`,
NUL, Zeilenumbruch und `${7*7}` geprüft). **24 von 24** `target="_blank"`-Links tragen `noopener`,
und `window.open(url,'_blank','noopener')` trennt die Referenz messbar (`window.opener === null`).
Kein ReDoS (1 MB Ziffern → 658 ms). Endpunkt: 405 für alle Nicht-POST-Methoden, 10 von 11
missgebildeten Rümpfen und 15 von 15 Locale-Werten sauber, Schlüssel nie in einer Antwort, kein
`Access-Control-Allow-*`. **Null Cookies, null localStorage, null sessionStorage und null
Drittanbieter-Anfragen beim ersten Anstrich** in allen 4 Sprachen und auf 5 Rechtsseiten; `theme=light`
erst nach ausdrücklichem Klick.

**Barrierefreiheit, die hält**
**Kein Tastaturfang** — 48 Stationen Desktop, 43 mobil, dann saubere Übergabe an die Browserleiste;
Shift+Tab spiegelt die Reihenfolge. Fokusanzeige stark und vorhanden auf **21 von 24** Elementen in
**beiden** Themes (2 px Akzent, 11,02–11,32:1 dunkel / 4,86–5,95:1 hell), per Pixelvergleich belegt.
**Die Fokusverwaltung des Burgermenüs ist vorbildlich** und viermal geprüft: Enter öffnet,
`aria-expanded` kippt, Tab läuft in visueller Reihenfolge durch die 7 Links, Escape schließt **und
gibt den Fokus an `#burger` zurück** — genau das, was der Chat tun sollte. Jedes Formularfeld hat
eine programmatische Beschriftung über sein umschließendes `<label>`, `autocomplete="name"`/`"tel"`,
`inputmode`, `maxlength`; native `required` ist gesetzt, wird also angekündigt. Die
Fehlerbehebung ist inhaltlich gut: die Meldung benennt exakt die fehlenden Felder und **aktualisiert
sich beim Ausfüllen**, der Fokus springt jeweils auf das erste fehlende Feld. Alle 132 gemessenen
Ziele erfüllen WCAG 2.5.8 (24×24). `/kvkk` hat eine saubere `h1 → 6×h2`-Gliederung und **0
Kontrastfehler in beiden Themes**. 200 % Seitenzoom auf 1280 px: **kein** horizontales Scrollen.
Die Tokens des Design-Systems halten ihre Zusagen auf reinem Noir (`--frost` 17,51:1, `--champ`
11,02:1, `--stone` 7,32:1, `--petrol-lt` 9,38:1).

---

## 🚫 Nicht geprüft — und warum

1. **Echte Anthropic-Antworten.** Kein `ANTHROPIC_API_KEY`. Der Client-Vertrag wurde über
   `page.route`-Attrappen vollständig geprüft; ob das Modell der eingespeisten Prompt-Injektion
   widersteht, ist **offen** — belegt ist nur, dass die Eingabe ungefiltert ankommt und die Antwort
   wörtlich veröffentlicht wird.
2. **Produktions-Vercel.** Keine Bereitstellung erreichbar. HSTS, die echten Header aus `vercel.json`,
   Brotli statt gzip, HTTP/2 statt HTTP/1.1, das Verhalten bei Groß-/Kleinschreibung in URLs
   (Windows-Dateisystem ist unempfindlich) und ob Vercel ein mitgeschicktes `X-Forwarded-For`
   überschreibt — alles mit `curl -I` gegen den echten Host zu prüfen. **Die Produktionszahlen
   werden besser sein als die hier gemessenen, in unbekanntem Maß.**
3. **Echte WhatsApp-Zustellung.** Geprüft ist die Deeplink-URL und ihr entschlüsselter Inhalt,
   nie ein gesendetes. Ebenso ungeprüft: wie WhatsApp mit dem 3.969 Zeichen langen `text`-Parameter
   umgeht, der bei maximal gefüllten Feldern mit Umlauten/Kyrillisch entsteht.
4. **Echte Screenreader.** Kein NVDA/JAWS/VoiceOver/TalkBack verfügbar. Alle Namen, Rollen und
   Zustände stammen aus Chromiums Accessibility-Baum über CDP — das ist für berechnete Eigenschaften
   verbindlich, **beweist aber keine Ankündigung**. M32 und H12 sind Mechanismus-Befunde: das fehlende
   `aria-live` ist gemessen, das Nicht-Ankündigen erschlossen.
5. **Echtes Windows-Kontrastmodell** und echter Browser-Zoom — beides über Chromium-Emulation
   (`forcedColors`, Layout-Viewport-Rechnung nach WCAG-Methode) geprüft, nicht am echten System.
6. **Echtes Mittelklasse-Android.** CPU-Drosselung 4×/6× nähert es an, reproduziert aber nicht GPU,
   Thermik oder Speicherdruck. Die WebGL-Zahlen (M24) wären auf echter Mobil-Silizium eher schlechter.
7. **Google-Maps-Innenleben** — laut Auftrag ausgeschlossen; gemessen ist nur, was das iframe die
   erste Partei kostet (+6,4 MB Heap, +480 Knoten, +253 Listener, +31 Documents über 10 Durchläufe).
8. **`astro check`** — hätte `@astrojs/check` + `typescript` in das Projekt installiert; als
   Fremdeingriff unterlassen. Empfehlung: einmal manuell laufen lassen.
9. **11 der 12 Rechtsseiten** im Kontrast-Pixeldurchlauf (nur `/kvkk`, 0 Fehler); Struktur, Namen und
   Überschriften wurden auf allen vier Sprachen geprüft. Kontrast-Pixeldurchlauf auf `/ru/` und `/en/`
   ebenfalls nicht — die Tokens sind identisch.
10. **Zwei Quarantänefälle, nicht als Befund gemeldet:** ein einmaliger
    `Cannot read properties of null (reading 'classList')` unter Slow 3G bei gleichzeitigem
    Theme-Klick-Hämmern (6 Wiederholungsversuche: 0 Fehler, Ursache nicht ermittelt), und ein
    `URIError: URI malformed` beim Formular, der nur über eine skriptgesetzte halbe Surrogatpaar-Wert
    erreichbar ist (Chromium kürzt an Codepunkt-Grenzen). Beide festgehalten, keiner behauptet.

---

## 📊 Abdeckung

| Linse | Technik & Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| funktional-positiv | Use-Case/Szenario + Entscheidungstabelle (80 BTU-Regeln) + vollständige Link-Inventur; jeder Abschnitt × 4 Sprachen | 1 590 | 1 545 | 45 → 6 Ursachen |
| negativ & ungültig | Äquivalenzklassen der **ungültigen** Klassen + Entscheidungstabelle der Validierung (8/8 Kombinationen) | ~217 | ~130 | 12 Befunde |
| Grenzwerte | 3-Werte-BVA auf jedes Feld und jeden CSS-Breakpoint + erschöpfende Aufzählung der 4 680 Domänenpunkte | ~660 | ~470 | 15 Befunde |
| Ausfall & Erholung | Fehlerinjektion (Bundle, Drittanbieter, Netz, GPU, Storage) + Zustandsübergänge | 150 | 103 | 12 Befunde |
| i18n & Fakten-Sicherheit | statischer Regeldurchlauf (22 Muster × 31 Dateien) + metamorphes Testen über 4 Sprachen + Anforderungs-Rückverfolgung | 1 842 | 1 594 | 17 Befunde |
| Sicherheit | OWASP-Payload-Matrix (24 × 2) + Endpunkt-Negativtests + Missbrauchsfälle + Header-Prüfung | 223 | 200 | 12 Befunde |
| Performance | Wasserfall-/kritischer-Pfad-Analyse + Mutationstests für Kausalität + Draw-Call-Zählung + Speicher-Soak | ~358 | — | 10 Befunde |
| Barrierefreiheit & Usability | axe-core + **Pixelwahrheit-Kontrast** (1 811 Textläufe) + erschöpfende Tastaturdurchläufe + AX-Baum | ~700 | — | 18 + 7 Usability |
| Prüfmittel-Review (eigen) | Bewertung der bestehenden `acceptance.mjs` und `guard.mjs` | 6 | — | 6 |

---

## 🧰 Zusatz: die bestehenden Prüfmittel selbst (Prüfqualitäts-Review)

Alle drei bestehenden Prüfungen sind grün, und alle 58 Befunde oben liegen in ihren blinden Flecken.
Das ist der wichtigste Nebenbefund dieser Prüfung.

1. **Die Chat-Zusicherung kann nicht fehlschlagen.** `acceptance.mjs:127` prüft `bot >= 2` Blasen.
   Mit absichtlichem Unsinn (`zzzqqq vvvv 8888 !!!!`) entstehen 2 Blasen (Begrüßung + Rückfall), also
   meldet der Test **„✓ Chat versteht Freitext"**, während der Chat nichts verstanden hat. Die
   Zusicherung zählt Blasen statt die Antwort zu prüfen.
2. **13 feste Wartezeiten, 0 zustandsbasierte Bedingungen** (`waitForTimeout` in Zeilen 26, 63, 69,
   72, 73, 121, 125, 129, 136, 138, 151, 165, 171; kein einziges `waitForSelector`/`waitForFunction`).
   Auf langsamerer Hardware entscheidet der Zufall.
3. **Das hellere Thema hat null Abdeckung.** Die Suite läuft ausschließlich `colorScheme:'dark'` und
   klickt `#themetog` nie — obwohl der Umschalter die Darstellung messbar ändert
   (`#100D0B` → `#f6f3ee`). Die meisten Kontrastfehler in M19/M20 sind im hellen Thema schlechter.
4. **Ganze Funktionen werden nicht angefasst:** `#reqForm` (8 Felder, der Conversion-Pfad),
   `#themetog`, `#projeler`, der Kampagnenblock und die 3 Garantiestufen — alle im Build, keine
   Zusicherung.
5. **`guard.mjs` läuft nur über `src/` und `scripts/`.** `api/chat.js` und `content/` werden nie
   geprüft, `dist/` ist ausdrücklich übersprungen (`guard.mjs:16`) — die Leitplanken sagen also
   nichts über das ausgelieferte Bündel. Aktuell **latent**: es gibt dort keinen echten Verstoß.
6. **Die `blocked`-Flags werden gedruckt, nie erzwungen** — die Ursache von K1.

**Vorschlag für die Suite, nach Wirkung geordnet:** (a) `blocked`-Schlüssel gegen `home.ts`
erzwingen; (b) `mapMode === 'embed'` den Build brechen lassen; (c) die Chat-Zusicherung auf den
Antwortinhalt umstellen und Türkisch in Großbuchstaben als Fall aufnehmen; (d) das Terminformular und
das helle Thema in die Abnahme aufnehmen; (e) die Überlaufprüfung auf 320/481/535 px erweitern;
(f) die 13 festen Wartezeiten durch Bedingungen ersetzen.

---

## Empfohlene Reihenfolge

**Vor dem Zeigen beim Kunden (blockierend):**
1. `mapMode: 'consent'` (**C1**) — ein Wort.
2. Die gesperrten Zusagen zurücknehmen (**K1**) — auf „Beratung auf Deutsch über WhatsApp", bis die
   Kundenfrage beantwortet ist; `7/24` mit den veröffentlichten Zeiten in Einklang bringen.
3. Guard-Regeln für beides, damit es nicht zurückkommt.

**Vor dem Livegang (hoch):**
4. Türkische Groß-/Kleinschreibung im Chat falten (**H1**) und `PRICE_KW` ergänzen (**H2**).
5. `AbortSignal.timeout` + `finally` im Chat (**H3**); Flächen-Regex reparieren (**H4**).
6. `flex-wrap` auf `.tbin` (**H5**); Clamp in das Feld zurückschreiben und die Sättigung benennen
   (**H6**); Telefonformat prüfen (**H7**).
7. Chat-Panel scrollbar machen (**H8**); `<main>` + Sprunglink + echte `<h2>` (**H9**);
   `overflow:hidden` von `.toggle` (**H10**); Fokusrückgabe und `aria-live` im Chat (**H11**, **H12**).
8. Hero-Bild vorladen und mobil zuschneiden (**H13**); ScrollTrigger bündeln (**H14**);
   `window.open`-Rückgabewert prüfen (**H15**).
9. Origin- und Content-Type-Prüfung in `api/chat.js`, **bevor** ein Schlüssel gesetzt wird (**H16**).

**Ein-Zeiler mit hoher Wirkung:** `--warn` definieren (**M17**, behebt drei Stellen) ·
`toLocaleString(lang)` im Rechner (**M1**) · `snap()` auf `<=` bzw. `find(s => s >= v)` (**M2**) ·
Zähler beim Zielwert starten (**M4**) · Doppelklick-Sperre am Formular (**M5**) ·
`boot().catch(() => {})` (**M6**) · `IntersectionObserver` um die Frost-Schleife (**M25**) ·
`overflow-wrap:anywhere` auf Chat-Blasen (**M26**) · `X-Frame-Options` + `frame-ancestors` in
`vercel.json` (**M28**) · die drei falschsprachigen `aria-label` (**M29**).

---

*Erzeugt von einem KI-Prüflauf. Jeder Befund ist reproduziert und gegen einen Widerlegungsversuch
verteidigt; die Skripte liegen unter `docs/qa-2026-08-11/skripte/` (Belege) und `docs/qa-2026-08-11/screenshots/` (Bilder, nicht versioniert).
**Die Befunde brauchen dennoch eine menschliche Freigabe**, insbesondere die Einordnung von C1 und K1,
weil deren Schweregrad von einer Geschäftsentscheidung abhängt (Demo vs. Livegang), und die
Screenreader-Aussagen (H12, M32), die ohne echtes Hilfsmittel erschlossen sind.*
