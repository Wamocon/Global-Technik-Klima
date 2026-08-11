# Anhang zum Ultra-QA-Lauf 11.08.2026 — Widerlegtes und Abdeckung je Linse

Dieser Anhang enthält das, was **nicht** in [`../08-qa-ultra-bericht.md`](../08-qa-ultra-bericht.md)
steht, weil es keine Befunde sind — und was trotzdem der wertvollste Teil der Prüfung ist:

1. **Die 61 Kandidaten, die einer Widerlegung nicht standgehalten haben.** Wer sie kennt, verschwendet
   keine Zeit damit, sie erneut zu „entdecken". Mehrere sind Messfehler der Prüfung selbst, die
   sauber zurückverfolgt wurden — sie zeigen, wo eine naive Messung dieses Projekts irreführt.
2. **Die Abdeckungstabellen je Linse** — welche Technik mit welchem Kriterium wie viele Fälle geprüft
   hat. Damit ist beantwortbar: „War X schon geprüft?"
3. **Was jede Linse nicht prüfen konnte** und warum.

Die ausführbaren Belege liegen in [`skripte/`](skripte/) (179 Dateien: Playwright-Skripte,
JSON-Rohmessungen, Textausgaben). Die 306 Screenshots liegen in `screenshots/`, sind aber
**bewusst nicht versioniert** (123 MB) — sie entstehen neu, wenn man die Skripte erneut laufen lässt.

---

## 1. Widerlegt und verworfen (61)

Aufgeteilt nach Linse. Jede Zeile: der Verdacht → warum er nicht hielt.

### Funktional-positiv (L1)

- **„Der Bewertungszähler bleibt bei 64 stehen und widerspricht der 65 im Hero."** Abtastfehler der
  Prüfung: gewartet wurde auf den *Bewertungs*-Text, gelesen wurde die *Anzahl* mitten im Tick. Mit
  Ruhebedingung (Text 40 Abfragen unverändert): **65** in 4 Sprachen × 3 Läufen.
- **„Die Explosionszeichnung ist tot — kein WebGL, Legende leuchtet nie, Seitenfehler."** Eigener
  Fehler: die Prüfung rief `canvas.getContext('2d')` zum WebGL-Test auf und **beanspruchte damit die
  Leinwand dauerhaft**, sodass Three.js nie einen Kontext bekommen konnte. Ohne die Sonde: Legende
  läuft `0→1→2→3→3→4→4→5→5→5`, Leinwand auf Layoutgröße × DPR, null Fehler.
- **„Die Legende startet bei 2 statt 0 — nicht monoton."** Die rAF-Schleife ist oberhalb des
  Abschnitts absichtlich per IntersectionObserver pausiert, der geglättete Fortschritt friert also
  mitten im Abklingen ein statt auf 0 zu laufen. Der Durchlauf im Blickfeld ist saubere Monotonie.
  So gebaut.
- **„`data-theme` ist nach dem Neuladen `"dark"` statt zu fehlen."** Nur `:root[data-theme='light']`
  ist gestylt, beide Darstellungen rendern identisch dunkel (per berechnetem Hintergrund geprüft).
- **„Konsolen-404 auf jeder Seite."** Ausschließlich `POST /api/chat` — der dokumentierte
  `astro preview`-Zustand. Zugesichert: null Nicht-`/api/chat`-404 auf jeder geöffneten Seite, und
  null 404 überhaupt, sobald der Endpunkt abgefangen wird.
- **„Die Seite lädt Schriften von `fonts.gstatic.com` — Verstoß gegen die Kein-Google-Fonts-Regel."**
  Jede Drittanbieter-Anfrage entsteht **im Google-Maps-iframe**, nie im Hauptdokument:
  Drittanbieter-Anfragen des Hauptrahmens = **0** in allen 4 Sprachen. An die Sicherheits-/
  Datenschutzlinse übergeben statt selbst behauptet.
- **„`_astro/gsap*.js` schlägt fehl (ERR_ABORTED)."** Die Prüfung navigierte weg, während der
  Leerlauf-Import noch unterwegs war. Tritt auf einer zur Ruhe gekommenen Seite nie auf.
- **„Die Randevu-WhatsApp-Nachricht beginnt in jeder Sprache mit türkischem `🌐 Web sitesi —`."**
  Betreiber­seitige Zuordnungszeile für den türkischen Betrieb; die **Feldbezeichnungen** sind korrekt
  lokalisiert. Gleiches für die dreisprachige Zeile im `#ccta`-Text. Absicht, kein Befund.
- **„Dunkel wird Besuchern aufgezwungen, deren Betriebssystem hell bevorzugt."** Es gibt keine
  `prefers-color-scheme`-Erkennung — aber Projektregel 7 macht dunkel zur festgelegten Markenvorgabe
  und hell zur ausdrücklichen Besucherentscheidung. Wie spezifiziert.

### Negativ & ungültig (L2)

- **„Nur-Leerzeichen in Name/Telefon rutscht durch."** Nein: `val()` trimmt; `"   "`, `"\t\t"` und
  geschütztes Leerzeichen `" "` werden alle abgewiesen, das Feld benannt, der Fokus auf das erste
  leere gesetzt.
- **„Ein Loch im Pflichtfeld-Tor."** Nein: alle 8 Kombinationen aus Name × Telefon × Zustimmung
  verhalten sich korrekt; `window.open` feuert nur bei allen drei.
- **„Die KVKK-Zustimmung ist umgehbar."** Nein: Zustimmung aus und alles andere gefüllt → 0 Öffnungen,
  Fehler benennt den Zustimmungssatz, Fokus landet auf der Kästchen (2 Läufe).
- **„Der Fehlerkasten bleibt nach der Korrektur stehen."** Nein, er verschwindet beim erfolgreichen
  zweiten Versuch.
- **„Der Honeypot ist per Tastatur oder Screenreader erreichbar."** Nein: `tabIndex -1`, nicht in der
  Tab-Liste des Formulars, Hülle `aria-hidden="true"`, Kasten bei x = −9415.
- **„Leerzeichen im Honeypot lösen die Falle aus."** Nein: `"   "` trimmt zu leer, das Formular geht
  normal durch.
- **„Enter-Absenden überspringt die Validierung."** Nein: Enter aus Name/Telefon/Wunschzeit läuft
  denselben Handler; Enter im Textfeld sendet korrekt **nicht**.
- **„`maxlength` ist über `fill()` umgehbar."** Nein: 500 Zeichen → 80, 200 Ziffern → 30.
- **„Der Chat stürzt ab oder erzeugt leere Blasen"** bei leer / Leerzeichen / Emoji / Satzzeichen /
  einem Zeichen / Chinesisch / Arabisch / NUL + ANSI-Escapes / RTL-Override / Zero-Width-Joinern.
  Nein: 0 Seitenfehler, keine leere Blase, immer der Rückfall plus WhatsApp-Knopf.
- **„Doppeltes Absenden im Chat verdoppelt oder verliert eine Nachricht."** Nein: mit auf 900 ms
  verbreitertem Busy-Fenster wird das zweite Absenden ignoriert, der Text bleibt aber im Feld —
  nichts verdoppelt, nichts verloren, nur unbestätigt. (Das *Verwerfen* selbst ist M21.)
- **„Der Client rendert `undefined`/`null` bei missgebildeten Antworten."** Nein: `{}`,
  `{reply:null}`, `{reply:""}`, Nicht-JSON, 500, 429, leerer Rumpf und abgebrochene Verbindung fallen
  alle auf die lokale Antwort zurück (je 2 Läufe).
- **„Das Mobilmenü hängt nach einem Größenwechsel."** Nein: 390 → 1280 → 390 und die Kante 999 → 1000
  schließen es beide, ARIA und Burger-Klasse bleiben konsistent.
- **„Ein Themawechsel bei offenem Chat verliert das Gespräch."** Nein: 3 Blasen davor, 3 danach,
  Panel offen, `localStorage.theme = 'light'`.
- **„`.mobar` / `.chatfab` verdecken den Absendeknopf oder die Zustimmungszeile am Handy."** Nein:
  0 px² Schnittfläche, beide Male gemessen (nach `scrollIntoView` und nach einem `/#randevu`-Sprung).
- **„Formularzustand geht bei Zurück-Navigation verloren."** Nein: Name, Telefon, Notiz, Auswahlfeld
  **und die Zustimmung** werden wiederhergestellt, Honeypot bleibt leer, sofortiges Absenden
  funktioniert (2 Läufe).
- **„Dreifachklick auf den Chat-Knopf entkoppelt `aria-expanded`."** Nein.
- **„Escape in einem Formularfeld ohne offene Ebene frisst die Eingabe."** Nein.
- **„Kodierte Pfad-Traversierung liest Dateien."** Nein — Offenlegung ja (`astro preview`), Lesezugriff
  nein.
- **„Die 404 verliert die Sprachwahl."** Nein.
- **„`/KVKK` und `/DE/` liefern 200 — Routing-Fehler."** **Umgebungsartefakt, nicht gemeldet:** das
  Windows-Dateisystem ist unempfindlich, `astro preview` löst sie deshalb auf; auf Linux/Vercel
  ergeben sie 404, und `<link rel=canonical>` zeigt bereits auf `/kvkk` bzw. `/de`.
- **„`//`, `///`, `/index.html` liefern 200 — Duplikate."** Canonical ist auf allen drei korrekt.
- **„Ungültiger `select`-Wert."** Nur per Skript erreichbar (`.value='NOT-AN-OPTION'` → `''`,
  `selectedIndex -1`). Kein nutzererreichbarer Pfad; nur Härtungsnotiz.
- **„Das Chat-Panel blockiert am Handy den Formular-Absendeknopf."** Absichtliches Overlay-Verhalten;
  das fehlende `aria-modal` / der fehlende Fokusfang gehört zur Barrierefreiheitslinse.
- **„`window.open` liefert `null` (Popup blockiert)."** Als Härtungsnotiz behalten, nicht als eigener
  Befund gezählt — die Linse konnte Chromium nicht dazu bringen, wirklich zu blockieren, nur
  simulieren. (Die Barrierefreiheitslinse hat es dann als H15 belegt.)

### Grenzwerte (L3)

- **„`maxlength` per direkter `.value`-Zuweisung umgehbar."** Funktioniert (81/31/61/61/401 Zeichen
  landen wörtlich im Deeplink) — aber der einzige Verbraucher ist das WhatsApp des Besuchers auf
  seinem eigenen Gerät. Kein Server, kein anderer Nutzer, keine Datenintegrität betroffen. **Kein
  Befund.**
- **„Einzelnes Surrogat → `URIError: URI malformed` → Formular sendet nichts."** Echter Absturz, aber
  **für Menschen nicht erreichbar**: Chromium kürzt an Codepunkt-Grenzen (`'X'`+40 × 😀 = 81
  Einheiten → 79 Einheiten / 40 Codepunkte, kein zerrissenes Paar). Nur per skriptgesetztem
  `.value = 'X\uD83D'`. Als Einzeiler-Härtungsnotiz behalten: `RequestForm.astro:163-208` hat kein
  `try/catch`, jede Ausnahme beim Nachrichtenbau tötet also still den einzigen Conversion-Pfad.
- **„Arabisches RTL-Layout kaputt."** Nein: `dir=ltr` rendert byte-identisch zu `dir=auto` (erstes
  Zeichen x=207, letztes x=0 in beiden), weil `؟` U+061F die Bidi-Klasse AL hat. Nur der Fall mit
  ASCII-Satzzeichen unterscheidet sich (das ist der niedrig eingeordnete Befund).
- **„Gemischte LTR+RTL-Reihenfolge"** (`Gree GWH09 مكيف 24000 BTU`) — identisch unter `ltr` und `auto`.
- **„Emoji / ZWJ-Familie / kombinierende Diakritika im Deeplink verstümmelt."** Nein: alle 16
  Formular-Rundläufe nach `trim()` byte-exakt, korrekt prozentkodiert.
- **„Lücke zwischen `.wafab` und `.mobar` an der 760-px-Kante."** Nein: exaktes XOR bei allen 30
  geprüften Breiten (760 → mobar, 761 → wafab). Ein WhatsApp-Weg ist bei **jeder** geprüften Breite
  erreichbar, auch bei den zwei überlaufenden.
- **„Lücke zwischen `.mainnav` und `#burger` an der 1000-px-Kante."** Nein: exaktes XOR
  (999 → Burger, 1000 → mainnav).
- **„`.calc-viz` schaltet um eins verschoben."** Nein: verborgen ≤899, sichtbar ≥900, exakt wie
  `Home.astro:375`.
- **„Fußzeilen-Innenabstand gegenüber `.mobar` invertiert."** Nein: Basis `padding-bottom:96px`
  (mobil, macht der Leiste Platz), `60px` erst ab 760 px. Korrekt.
- **„Eine abweichende Array-Länge bricht den JSON-LD-Leistungskatalog."** Nein: 6 Angebote in allen
  vier Sprachen, 19 Schlüssel, keine Parse-Fehler.
- **„Langer Chat-Text erzeugt horizontales Dokument-Scrollen."** Nein: `documentElement.scrollWidth`
  überschreitet `innerWidth` nie (Panel ist `position:fixed` + `overflow:hidden`). Der Schaden bleibt
  im Panel (das ist M26).
- **„Formularlayout / Fehlermeldung überläuft bei maximalen Feldlängen."** Nein, bei 390 px und
  1440 px kein Überlauf: Fehlerknoten 288/569 px in einem 342/623 px breiten Formular.
- **„Die Endwerte der Zähler sind sprachlich falsch."** Nein: alle 4 landen auf der
  sprachrichtigen Zeichenkette (`★ 5,0` tr/de/ru, `★ 5.0` en). Falsch sind der SSR-Text und der
  Übergang (M4).
- **„200 % Zoom bricht das Layout."** Nein: 640 CSS-px sauber, kein Überlauf, kein Bedienelement
  außerhalb.
- **„24 px Grundschrift bei Desktop-Breiten."** Nein: 1280 px sauber; nur ≤412 px (und 560 px über die
  Kopfzeile) brechen.
- **Eigener erster Zählerlauf zeigte „keine Animation in tr/de/ru"** — Wettlauf im Prüfaufbau,
  zurückverfolgt: die Wartebedingung war bei t=0 schon erfüllt für Sprachen, deren korrekte
  Zeichenkette der SSR-Zeichenkette gleicht. Mit rAF-Abtastung neu gebaut; die Animation läuft in
  allen 4.
- **Eigener erster Chatlauf zeigte Blasen-/Eingabe-Abweichungen** — Prüfartefakt, zurückverfolgt auf
  den `busy`-Wächter (`Assistant.astro:191`), der jedes zweite Absenden still verwirft. Busy-bewusst
  neu gebaut, dann alle Rundläufe grün. (Das stille Verwerfen ist echt → M21.)

### Ausfall & Erholung (L4)

- **„Spätes GSAP versteckt alle 50 Enthüllungsblöcke dauerhaft."** Nein — der verborgene Zustand
  unterhalb des ersten Bildes ist der **beabsichtigte** Vor-Scroll-Zustand. Nur Inhalt, der gerade
  auf dem Schirm ist, flackert (M8); alles andere enthüllt beim Scrollen normal (50 → 49 verborgen
  nach 400 px Rad).
- **„Zurück/Vorwärts verliert die Scrollposition nach einem Hash-Sprung."** Artefakt der eigenen
  900-ms-Wartezeit. Mit Scroll-Stabilisierung, 2 Läufe: Zurück `6107 vs 6107`, Vorwärts
  `10070 vs 10070` — **Delta 0** in beide Richtungen.
- **„Zurück sollte das offene Chat-Panel schließen."** Kein Befund: Zurück hat nur einen
  Hash-Eintrag entfernt, keine Dokumentnavigation; das Panel ist nicht historienverwaltet und bleibt
  korrekt offen.
- **„Chat öffnen/schließen verliert 13 Ereignis-Zuhörer."** Widerlegt durch Skalierung: das Delta ist
  **genau 13 für 10 wie für 60 Zyklen** — spät angehängte GSAP-/Three-Zuhörer am `window`, nicht
  proportional zu den Durchläufen.
- **„Ersatzschriften verursachen Textüberlauf am Handy."** Der einzige Treffer war das
  Honeypot-`<label>` bei `left:-9999px` (`RequestForm.astro:128`), das ist Absicht.
  `scrollWidth 390 === innerWidth 390`.
- **„429 / 500 / Abbruch / `text/html` / leerer Rumpf / `{"reply":null}` brechen den Chat."** Alle
  sechs fallen in **397–412 ms** auf die lokale Absichtsmaschine zurück, Tipp-Blase entfernt, `busy`
  freigegeben, zweite Nachricht funktioniert. Nachweislich in Ordnung, kein Befund.
- **„Eine Nachricht, die genau beim Verbindungsabbruch abgeschickt wird, geht verloren."** Erste
  Zusicherung zählte Blasen über ein Neuladen hinweg falsch. Zwei saubere Läufe: in **325 ms /
  332 ms** beantwortet.
- **„Eine um 30 s verzögerte Antwort lässt `busy` hängen."** Widerlegt — `busy` **wurde** nach 30,3 s
  freigegeben; die eigene 6-s-Abfrage lief nur ab, während die zweite 30-s-Anfrage unterwegs war. Das
  echte Problem ist das fehlende Timeout, und das ist H3.
- **„Die Three.js-Schleife rendert außer Sicht weiter."** Widerlegt: `0 rAF/s` bei `#kontakt`. Die
  dokumentierte Disziplin hält.
- **„Doppelte rAF-Schleifen stapeln sich nach Verstecken/Zeigen oder wiederholtem Scrollen."**
  Widerlegt: `244/s → 231/s` nach einem Versteck-Zyklus, `244/s → 187/s` nach 5 vollen Durchläufen,
  `244/s → 184/s` nach 3 Sichtbarkeitswechseln.
- **„Der Hero rendert ohne JavaScript halb animiert."** Artefakt — der Screenshot entstand mitten in
  der CSS-Animation. Zur Ruhe gekommen rendert der Hero vollständig.
- **Quarantäne, nicht als Befund gemeldet:** `Cannot read properties of null (reading 'classList')` —
  ein `pageerror`, einmal beobachtet, unter Slow 3G bei 390×844, während eine Abfrageschleife
  `#themetog` während des Ladens hämmerte. **Sechs** Wiederholungsversuche (3 × schlicht Slow 3G,
  3 × exakte Sequenz inklusive Klickschleife) ergaben null Fehler. Inkonsistent → Ursache nicht
  ermittelt. Festgehalten, damit es nicht verloren geht; nicht behauptet.

### i18n & Fakten-Sicherheit (L5)

- **Konya-Nummer `+90 332 325 25 50`** — 0 Treffer über alle 31 Textdateien in `dist/` (HTML,
  JS-Bündel, XML, CSS), in jeder geprüften Schreibweise (`332 325 25 50`, `3323252550`, `+90332`).
- **Jede andere Telefonnummer** — nach Filterung ist jede 10+-stellige Ziffernfolge in `dist/`
  entweder die Karten-Koordinatenzeichenkette, eine Three.js-Konstante (`4294967295`) oder eine der
  zwei korrekten Nummern.
- **`1997` / `1998` / ein anderes „seit"-Jahr** — 0 Treffer; die einzigen Jahresangaben sind die vier
  `2021`-Zeilen.
- **`Kühlmittel`, `Instandhaltung`, `кондей`, `soğutucu akışkan`** — 0 Treffer im gesamten Build.
- **Preise oder Währung auf der viersprachigen Seite** — 0. Die `руб`-Treffer stecken in `трубу` und
  `за рубеж`; die `$`-Treffer sind Template-Literal-Begrenzer im eingebetteten FrostHero-/GSAP-/
  Three-Code. (Preise gibt es nur im separaten `/angebot/`-Artefakt.)
- **`priceRange` im JSON-LD** — auf allen 17 Seiten abwesend.
- **FAQ-Schema** — kein `FAQPage`, `"Question"` oder `"Answer"` irgendwo.
- **Analytics / GA4 / gtag / Meta-Pixel / Hotjar / Matomo / Yandex / Clarity / Segment / Sentry / ein
  fremdes CDN im erstanbieterlichen Markup** — 0 Treffer.
- **Hartkodierter Schlüssel oder Geheimnis** — 0 Treffer (`sk-ant-`, `AIza…`, `ANTHROPIC_API_KEY`,
  Bearer-Token).
- **Google Fonts im eigenen Markup** — 0. Sie kommen nur transitiv über das Karten-iframe.
- **`toUpperCase()`/`toLowerCase()` von diesem Projekt geschrieben** — 0 im erstanbieterlichen Code.
  Die 20 Treffer stecken in den Fremdbündeln `gsap`, `ScrollTrigger` und `three.module` und arbeiten
  auf CSS-Eigenschaftsnamen, Farbnamen und Typnamen; `toLowerCase()` ist in JS
  gebietsschema-unabhängig, es wird also keine türkische Zeichenkette beschädigt. **Aber:** der Guard
  sieht sie überhaupt nicht (`guard.mjs:16` überspringt `dist/`) — als Abdeckungslücke gemeldet, nicht
  als Befund.
- **ALL-CAPS-Eingabe in de/ru/en** — 12/12 Sonden korrekt (`WARTUNG`, `GARANTIE`, `WÄRMEPUMPE`,
  `WAS KOSTET DIE MONTAGE`, `ОБСЛУЖИВАНИЕ`, `ГАРАНТИЯ`, `ФРЕОН`, `СКОЛЬКО СТОИТ МОНТАЖ`,
  `MAINTENANCE`, `WARRANTY`, `HEAT PUMP`, `HOW MUCH IS INSTALLATION`). Die Falle ist türkisch-spezifisch
  — genau das macht H1 zuordenbar.
- **Cookies vor der Zustimmung** — 0 in allen 4 Sprachen, **vor und nach** dem Laden der Karte, in
  frischem Chromium. Die `maps/embed`-Variante setzt keine.
- **localStorage/sessionStorage vor der Zustimmung** — beim ersten Laden in allen 4 Sprachen leer.
  `theme=light` wird erst nach ausdrücklichem Klick geschrieben, ist funktional und nutzerinitiiert.
- **Pseudo-Locale-Reste** (`src/i18n/xx.json`, `‹key›`, `TODO`, `Lorem`) — keine. Der `‹ ›`-Treffer ist
  der dekorative Griff des Vorher-Nachher-Reglers.
- **Sitemap enthält die 404** — nein. **Sitemap fehlt eine Seite** — nein; alle 16 echten Seiten da.
- **JSON-LD der vier Startseiten behauptet Unsichtbares** — nein; alle 18 geprüften Werte sind
  sichtbar vorhanden. Der einzige gemeldete Fehltreffer war ein `&amp;`-Entity-Artefakt des Prüfers,
  von Hand nachgeprüft.
- **Abweichende Array-Längen zwischen Sprachen** — 15 von 16 gemessenen Arrays in allen vier
  identisch (Leistungen 6, Produkte 7, Warum-Kacheln 4, Garantiestufen 3, B2B-Segmente 6, Systeme 4,
  Schritte 5, Kampagnenkarten 2, Chat-Chips 3, Fußzeilen-Rechtslinks 3, Formularoptionen 6,
  Explosionslegende 5, Zusicherungspunkte 3, ab-stat-Blöcke 3). Nur die Bewertungen weichen ab (M33).
  Der Unterschied bei den Vertrauens-Chips (tr 4 vs. andere 5) ist das absichtliche
  „wir sprechen Ihre Sprache"-Abzeichen.
- **Abweichende Garantie-Inhalte** — keine. Alle vier Sprachen tragen dieselben 3 Stufen, dieselbe
  20-Werktage-Grenze, dieselbe Plakette **und das sichtbar gedruckte Ablaufdatum 31.12.2026**. Am
  11.08.2026 ist die 6-Jahres-Aktion also noch ~4,7 Monate gültig und das Datum ist offengelegt.
  ✔ *Beobachtungspunkt, kein Befund:* die Plakette sagt „bis zu 6 Jahre" unbedingt, während nur der
  Stufentext das Ablaufdatum trägt — dieser Text wird am 01.01.2027 irreführend.
- **Quarantäne:** der erste Kartentest zeigte 0 Google-Anfragen, weil `scrollIntoViewIfNeeded()` die
  Lazy-iframe-Schwelle nicht überschritt. Zurückverfolgt, durch `scrollIntoView()` + Bedingungswarten
  ersetzt, dann zweimal × 4 Sprachen neu gelaufen → C1. Das ursprüngliche Nullergebnis war ein
  Prüffehler, kein Produktverhalten.

### Sicherheit (L6)

- **Stored/Reflected/DOM-XSS über den Chat** — widerlegt. 24-Payload-Matrix × 2 Läufe: Elementknoten
  in Nachrichtenblasen = **0**, `__XSS = 0`, Dialoge = 0, Nutzerblase ist ein einzelner Textknoten.
  `bubble()` benutzt `textContent` (`Assistant.astro:129`). (Der erste Lauf meldete Fehler — die
  Zusicherung zählte die legitimen `.msg.wa a`-Knöpfe mit; korrigiert und zweimal neu gelaufen.)
- **XSS über Query-String oder Hash** — widerlegt, 6 URLs. Nichts in `src/` liest `location` für
  Inhalt; die einzige Nutzung ist `motion.ts:89-101` zum Auflösen von Sprungziel-Hrefs.
- **XSS / Schema-Injektion über die Randevu-Felder** — widerlegt. Alle fünf Felder mit
  `<img src=x onerror=alert(1)>"'` + Zeilenumbruch + NUL + `${7*7}` + `javascript:` geladen; die
  gebaute URL ist `https://wa.me/…` (`protocol=https:`, `host=wa.me`) mit allem prozentkodiert.
- **`javascript:`-XSS über die `waButton`-href-Senke** — widerlegt **als XSS** (der Browser blockt es
  unter `target="_blank"`, mit Kontrollversuch belegt: dasselbe `<a>` **ohne** `target` führt aus,
  **mit** `target=_blank rel=noopener` nicht). Die Senke selbst ist real → als niedriger Befund
  geführt.
- **Prototype Pollution in `api/chat.js`** — widerlegt, `{}.polluted === undefined`.
- **API-Schlüssel in einer Antwort, einem Header oder dem Bündel** — widerlegt. Der Schlüssel reist
  ausschließlich als `x-api-key` zu `api.anthropic.com`; nie in einem Antwortrumpf oder Header;
  Upstream-500 und Upstream-`null`-JSON liefern beide das generische
  `{reply:null,fallback:true}` ohne Innereien.
- **Geheimnisse oder Sourcemaps in `dist/`** — widerlegt. Überhaupt keine `.map`-Dateien; der einzige
  Treffer für `ANTHROPIC|api.key|secret|token` über 56 gebaute Dateien ist das Wort „tokens.css" in
  einem Kommentar.
- **Interne Dateien ausgeliefert** — widerlegt, alle `404`: `/instruction.md`, `/HANDBUCH.md`,
  `/Senior_UI_Tech_Audit_…md`, `/docs/`, `/content/de/master.md`, `/.git/config`, `/.git/HEAD`,
  `/.env`, `/.env.production`, `/package.json`, `/package-lock.json`, `/vercel.json`,
  `/astro.config.mjs`, `/src/…`, `/scripts/guard.mjs`, `/node_modules/`, `/.astro/`, `/api/chat.js`
  (35 Pfade geprüft).
- **Tabnabbing** — widerlegt. **24/24** `target="_blank"`-Links über 18 Seiten tragen `rel*=noopener`.
  `window.open(url,'_blank','noopener')` trennt die Referenz wirklich: `window.opener === null` im
  geöffneten Tab gemessen. Cross-Origin-`wa.me`-Links **ohne** `target` haben kein `noopener` — per
  Definition harmlos (kein neuer Kontext).
- **ReDoS im Absichtserkenner** — widerlegt. `/(\d{2,3})\s*(m2|…)?/` hat keinen verschachtelten
  Quantor. 1 MB Ziffern + `m2` → in **658 ms** beantwortet; 1 MB `a`+`oda` → 591 ms; 1 MB
  alternierend → 609 ms; 210 KB wiederholte Flächenwörter → 357 ms (davon je 260 ms die absichtliche
  Tippverzögerung). Seite durchweg reaktionsfähig, null Seitenfehler.
- **Cookies oder Tracking-Speicher vor der Zustimmung** — widerlegt. Null Cookies, null
  localStorage, null sessionStorage, leeres `document.cookie` auf `/`, `/de/`, `/ru/`, `/en/`,
  `/kvkk`, `/gizlilik`, `/cerez`, `/de/cerez` und der 404. Nach einem ausdrücklichen Themaklick genau
  ein streng funktionaler Schlüssel: `theme=light`. Nie ein Identifikator.
- **Drittanbieter-Kontakt beim ersten Anstrich** — widerlegt bei 1280×800, 1280×2400 und 390×844:
  0 Google-Anfragen ohne Scrollen. (Der Verstoß ist scroll-ausgelöst → C1.)
- **Nicht-POST-Methoden am Endpunkt** — widerlegt, `405 {"error":"method"}` für
  GET/PUT/DELETE/PATCH/OPTIONS/HEAD/TRACE.
- **Unbegrenzter Speicher in der Ratenbegrenzungs-Map** — widerlegt; die `>5000`-Aufräumung
  (`chat.js:71-73`) läuft (5 200 verschiedene IPs → 27 MB Heap-Delta, danach zurückgewonnen).
- **CORS-Fehlkonfiguration** — widerlegt, es wird nie ein `Access-Control-Allow-*`-Header ausgegeben,
  fremdes JS kann die Antwort also nicht **lesen**. Es kann sie weiter **auslösen** → H16.

### Performance (L7)

- **„Three.js steckt im Erstbündel."** Widerlegt. `three` erscheint **0 ×** in `dist/index.html`,
  `dist/{de,ru,en}/index.html`, `dist/404.html`, `dist/kvkk/index.html` (der einzige Treffer in
  `en/index.html` ist das englische Wort „three" in einem Rezensionszitat); keine HTML-Datei
  referenziert `three.module`. **0 Three.js-Anfragen vor `load` in 24/24 Läufen** über 4 Sprachen × 2
  Viewports.
- **„Das Erst-JS sprengt das ~22-KB-Budget."** Widerlegt. Genau 4 Dateien vor `load` in jedem Lauf:
  `Assistant…js` 16 774 B + `Base.astro…js` 3 901 B + `ExplodedUnit.astro…js` 4 601 B +
  `preload-helper…js` 1 342 B = **26 618 B = 26,0 KB unkomprimiert / 13,1 KB gzip** (13,1 KB in 23/24
  Läufen). GSAP/ScrollTrigger sind per `requestIdleCallback` verzögert und erschienen vor `load` in
  nur **1 von 24** Läufen (Desktop, ungedrosselt, wo `load` bei 142 ms feuert); in keinem gedrosselten.
- **„20,9 fps beim Scrollen der ganzen Seite" / „`#teknik` läuft mit 5,9 fps."** Eigenes
  **Prüfartefakt** — die erste Messung scrollte schrittweise mit 2–3 rAF pro Schritt und blockierte
  damit den Abtaster. Mit konstanter rAF-Geschwindigkeit neu gemessen: **58,0 fps** ganze Seite,
  `#teknik` **37,4 fps**. Die korrigierten Zahlen sind die gemeldeten.
- **„Die Frost-Schleife läuft in einem versteckten Tab weiter."** Erst in 2 von 3 Läufen so gesehen.
  Zurückverfolgt (5 Läufe mit nachweislich zuerst gestarteter Schleife): **0 Fills in 5/5**. Der
  frühere Befund entstand, weil die Prüfung `visibilitychange` feuerte, **bevor** FrostHeros
  `requestIdleCallback(…, {timeout:900})` die Schleife gestartet hatte — `stop()` war also ein No-op
  und `start()` lief danach. Zudem feuert rAF in einem wirklich versteckten Tab gar nicht. Kein
  Befund. (Das Fehlen des IntersectionObserver ist ein anderer, echter Befund: M25.)
- **„Ein `<link rel=preload>` ist ungenutzt (verschwendete Bytes)."** Widerlegt. Beide Preloads holen
  mit `initiatorType: 'link'` **und** ihre `FontFace`-Objekte erreichen `status: 'loaded'` in allen 4
  Sprachen × 2 Viewports; keine „preloaded but not used"-Warnung in 24 Läufen.
- **„Das Enthüllungssystem / die `data-count`-Zähler / die Hero-Leinwand verursachen CLS."**
  Widerlegt durch kontrolliertes Experiment: GSAP+ScrollTrigger blockiert lässt CLS bit-identisch
  (0,0496 Desktop / 0,0051 mobil); die Zähler tragen gepoolt 0,0006 bei; Fonts blockiert treibt CLS
  auf **exakt 0**.
- **„Bildern fehlen intrinsische Maße → CLS."** Widerlegt. Alle 10 `<img>` tragen `width`+`height`;
  das Attributverhältnis stimmt mit dem intrinsischen überein; Bilder blockiert lässt CLS unverändert.
- **„Ein Bild über dem ersten Bildschirm hat `loading=lazy`."** Widerlegt. Beide Bilder über dem
  Falz (`hero-shop.webp`, `logo-light.png`) sind CSS-Hintergründe, die sind nie lazy. Kein `<img>`
  liegt auf einem der beiden Viewports über dem Falz.
- **„+11,7 MB Heap-Wachstum über eine lange Sitzung = ein Leck in unserem Code."** Widerlegt durch
  Differenzmessung: 6,4 MB sind das Maps-iframe, ~3,0 MB das einmalige Three.js-Modul samt Szene, und
  jede erstanbieterliche Kurve plateaut. Chat (50 × öffnen/schließen): +869 KB, davon +833 KB im
  ersten Zyklus, danach ≈1 KB/Zyklus. Themawechsel (30): +15 KB, 0 Knoten, 0 Zuhörer. Größenwechsel
  (20, Karte blockiert, 3D geladen): Heap 5340 → 5427 → 5413 → **5410 KB, also flach**.
- **„Ein WebGL-Kontext leckt / der Renderer wird nie entsorgt."** `renderer.dispose()` wird
  tatsächlich nie aufgerufen (Quellfakt) — aber gemessen: **genau 1 WebGL-Kontext erzeugt, 0
  `webglcontextlost`-Ereignisse** nach 10 vollen Scrolldurchläufen + 20 Größenwechseln; 0 Kontexte,
  wenn `#teknik` nie erreicht wird. Auf einer Nicht-SPA-Seite harmlos — nicht gemeldet.
- **„Produktbilder werden am Handy überliefert."** Widerlegt für mobil: 1,63-fache Fläche bei DPR 2
  ist korrekte Dimensionierung. Das >2-fach-Problem ist Desktop DPR 1 (5,64-fach) und `ba-*.webp` am
  Handy (2,62-fach).
- **„Ein Nicht-webp/avif-Raster über 100 KB wird ausgeliefert."** Widerlegt — größtes
  Nicht-webp-Raster ist `logo-light.png` mit 51,7 KB; `og.jpg` (52,4 KB) wird von der Seite nie
  angefordert (korrekt, es ist das Social-Vorschaubild).
- **„Der Vorschau-Server bricht unter Parallelität ein."** Widerlegt: 32 gleichzeitige `GET /` →
  800–941 req/s, p95-Latenz 37 ms, **0 Fehler**, 3 Runden. 8 echte Browser-Ladungen: TTFB 4–19 ms,
  `load` 152–245 ms gegen 113 ms sequenzielle Grundlinie — und die ~2-fache Differenz ist
  CPU-Konkurrenz von 8 headless Chromiums auf dem Wirt, nicht der Server.

### Barrierefreiheit & Usability (L8)

- **„Die Hero-CTA-Knöpfe haben keinen Fokusring."** Widerlegt. Die erste Messung zeigte 6–8
  veränderte Pixel; mit angehaltener `#frost`-Leinwand sind die echten Werte **962 px / 10,8:1**
  (primär) und **926 px / 9,66:1** (sekundär). Die frühere Ablesung war rAF-Rauschen zwischen den
  zwei Screenshots.
- **„`.mobar .mo-wa`, `#ccta`, `.btn-primary` bei 1,6–2,6:1."** Widerlegt. Abtastartefakt: teilweise
  abgeschnittene Textrechtecke wurden auf Screenshot-Zeile 0 geklemmt, wo die mitlaufende Kopfzeile
  gezeichnet ist. Echte Werte **11,02:1** dunkel / **5,95:1** hell. Behoben durch die Forderung
  vollständig im Viewport liegender Rechtecke plus `elementFromPoint`-Verdeckungsprüfung.
- **„74 % des gesamten Textes unter AA (1 428 von 1 919 Läufen)."** Widerlegt.
  `src/scripts/motion.ts:147` ruft `gsap.set(targets,{opacity:0,y:18})` und hinterlässt damit ein
  **inline `opacity:0`** auf jedem `[data-reveal]`; die `motion`-Klasse zu entfernen genügt nicht. Nach
  erzwungener Sichtbarkeit per `!important` ist die echte Zahl **213 von 1 811**.
- **„`.kicker` unter AA im hellen Thema."** Widerlegt. Saubere Messung: **4,69:1** Desktop, **4,53:1**
  bei 390 px, **4,83–4,97:1** auf `.sec`. Besteht AA — aber bei 390 px nur um 0,03, jede weitere
  Abdunklung der Abschnittstönung bricht es.
- **„h1 bei 200 % Nur-Text-Zoom abgeschnitten."** Widerlegt. `.build .ln` misst
  `scrollHeight == clientHeight == 107` auf einer zur Ruhe gekommenen Darstellung; die früheren 193 px
  waren mitten in der Animation. Die 110 px Hero-Überlauf sind das absichtliche `height:120%` auf
  `.hero-photo`.
- **„Drei `[data-reveal]`-Elemente werden nie sichtbar."** Widerlegt. Sie waren mitten in der
  Animation; Abfragen bestätigt, dass alle 50 opacity > 0,9 erreichen.
- **„Der Hero wird in `forced-colors` leer."** Widerlegt. Der Screenshot entstand, bevor die
  1,5–1,7-s-Hero-Animationen fertig waren; zur Ruhe gekommen sind h1 und Claim `rgb(0,0,0)` auf Weiß.
- **„Das Google-Maps-iframe fügt viele Tab-Stopps ein."** Widerlegt *in dieser Umgebung*: 40
  Anschläge erreichen es, **1** weiterer landet auf „KVKK Aydınlatma Metni". Googles interne
  Tab-Stopps wurden nicht beobachtet und werden nicht behauptet.
- **„Zustimmungs-Kästchen 17×17 verletzt 2.5.8."** Widerlegt. Das umschließende `<label>` ist
  klickbar, das ergibt ein effektives Ziel von **288 × 39,4**. Optisch klein, kein Verstoß.
- **„Unbeschriftete Inline-SVGs verschmutzen den Barrierefreiheitsbaum."** Widerlegt. Der erste
  Durchlauf markierte 11 SVGs ohne `aria-hidden`; jedes liegt entweder in einer
  `aria-hidden`-Hülle (`.sdiv`, `.camp-ic`) oder in einem Link mit eigenem Namen. Die AX-Namen kamen
  sauber zurück: „Hemen arayın", „WhatsApp", „Facebook", „Instagram".
- **„Pflichtfelder werden nicht programmatisch übermittelt."** Widerlegt. Natives `required` steht auf
  `name`, `phone` und `consent`, Hilfsmittel kündigen also „erforderlich" an; das dekorative
  `<b aria-hidden>*</b>` ist nicht tragend.
- **„`.card`-Ränder verletzen 1.4.11"** (1,36–1,46:1) — widerlegt. Karten sind keine
  Bedienelemente; 1.4.11 gilt dort nicht.
- **„Der Honeypot leckt in die Tab-Reihenfolge oder den Barrierefreiheitsbaum."** Widerlegt.
  `aria-hidden="true"` + `tabindex="-1"` + außerhalb des Bildes; in den 48 Stationen nicht enthalten.
- **„Irgendwo auf der Seite ist ein Tastaturfang."** Widerlegt (48 Stationen Desktop, 43 mobil, dann
  saubere Übergabe an die Browserleiste).

---

## 2. Abdeckung je Linse

### L1 · Funktional-positiv

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| Use-Case/Szenario (Abschnittsdarstellung) | jeder Landmark-Abschnitt × 4 Sprachen, nicht leer + dokumentierte Anzahl | 208 | 208 | 0 |
| Use-Case + CRUD-Zustandskonsistenz (Formular) | Happy Path × 4 Sprachen; jedes Feld mit Sprach-Etikett in den Deeplink | 96 | 96 | 0 |
| Entscheidungstabelle (BTU) | alle Kombinationen 8 Fläche × 5 Personen × 2 Sonne, Anzeige + Deeplink | 26¹ | 24 | 2 |
| Use-Case + Absichtsabdeckung (Chat) | Begrüßung/Offenlegung/3 Chips + 3 Absichtsklassen × 4 Sprachen; Schließen ×2; LLM-Route | 182 | 176 | 6 |
| Use-Case + Zustandsübergang (Navigation) | 7 Links × 4 Sprachen × 2 Viewports; 48 Sprachwechsel | 333 | 333 | 0 |
| Zustandsübergang (Thema) | 4 Übergänge der 2-Zustands-Maschine × 4 Sprachen, alle Nebeneffekte | 121 | 117 | 4 |
| Use-Case + Scroll-Zustandsdurchlauf (Schaustücke) | Regler in 2 Modalitäten × 2 Richtungen; Explosionslegende über den Scrollbereich | 100 | 100 | 0 |
| Erschöpfende Inventur (Links) | 100 % der Anker auf 16 Seiten + 2 Viewport-Partitionen | 140 | 140 | 0 |
| Erschöpfende Aufzählung (Rechtsseiten) | 12 Routen + 36 Sprachwechsel + Affordanz-Inventur | 351 | 327 | 24 |
| Inventur + Verhaltensprüfung (CTAs) | jeder wa.me-Anker nach `target`; Hero-CTA-Klick; Zähler in Ruhe | 48 | 39 | 9 |
| Use-Case auf Mobil-Viewport (Formular) | Conversion-Pfad bei 390×844 × 4 Sprachen | 28 | 28 | 0 |
| **Summe** | | **1 590** | **1 545** | **45** |

¹ die 80 Entscheidungstabellen-Regeln werden als eine Aggregation plus 8 benannte Orakelprüfungen und
18 Zustands-/Formatzusicherungen geprüft.

### L2 · Negativ & ungültig

| Technik | Kriterium | Fälle | Bestanden | Gefallen | Befund |
|---|---|---|---|---|---|
| Entscheidungstabelle | alle 8 Name × Telefon × Zustimmung | 8 | 8 | 0 | — |
| ÄP, ungültige nicht-leere Telefonklassen | 12 Partitionen | 12 | 0 | 12 | H7 |
| ÄP, Leerzeichenklasse (Name/Telefon/Honeypot) | 4 | 4 | 0 | — | |
| Fehlermeldungsqualität | jede fehlschlagende Zeile, tr + de | 3 | 0 | 3 | M-Notiz |
| Honeypot-Entscheidungszeilen | gefüllt / Leerzeichen / Vorfehler / Erreichbarkeit | 5 | 4 | 1 | M-Notiz |
| Absende-Pfad-Äquivalenz | 5 | 5 | 0 | — | |
| Grenzwert der Eingabelänge (`maxlength`) | 2 | 2 | 0 | — | |
| Fehlerpfad-Injektion (`window.open`→null) | 1 | 0 | 1 | H15 | |
| Ungültiger `select`-Wert | 1 | 0 | 1 | Notiz | |
| ÄP, ungültige `type=number`-Klassen (BTU) | 34 (27 Fläche + 7 Personen) | 4 | 30 | H6/M3 |
| Negativklassen, Chat-Freitext | 22 | 20 | 2 | H4/M26 |
| Absichtstabellen-Fehlzündungssonde (tr/en/de × 2 Läufe) | 28 | 4 | 24 | H1/H4 |
| Missgebildete API-Antworten (× 2 Läufe) | 24 | 22 | 2 | niedrig |
| Netzwerk-Fehlerinjektion (Abbruch, Hänger) | 2 | 1 | 1 | H3 |
| Parallelität / Doppelabsende-Wächter | 2 | 2 | 0 | — |
| Illegale Zustandsübergänge & Overlay-Geometrie | 13 + 2 Navigationssonden | 10 | 5 | M31 |
| Ungültige Routenklassen | 30 Pfade + POST | 28 | 3 | niedrig |
| **Summe** | | **~217** | **~130** | **~87** | **12** |

Die hohe Fehlzahl bei BTU und Absichten ist **zwei Ursachen, über Partitionen multipliziert** — nicht
54 einzelne Fehler.

### L3 · Grenzwerte

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| 3-Werte-BVA — Rechnerfelder | beide Grenzen von `#ca` und `#cp` × 3 Werte × 4 Sprachen + 8 Negativ-Rand-Eingaben | 164 | 60 | 104 (überlappend) |
| Ausgabepartitions-Grenze — `snap()` | alle 5 berechneten Mittelpunkte × 3 Werte × 4 Sprachen | 60 | 40 | 20 |
| Erschöpfende Äquivalenz-Aufzählung | alle 4 680 ganzzahligen Domänenpunkte | 2 Zusicherungen | 0 | 2 |
| Sprachformat-Orakel | jeder erreichbare Ausgabewert × 4 Sprachen, Rechner vs. Chat vs. Zähler | 24 + 4 | 12 + 2 | 12 + 2 |
| Animations-Wertebereichsgrenze | t=0 und t=Ende beider Zähler × 4 Sprachen × 2 Läufe | 8 / 24 Zus. | 14 | 10 |
| 3-Werte-BVA — `maxlength` per `fill()` | 5 Felder × (max−1, max, max+1) | 15 | 15 | 0 |
| Negativ-Rand — `maxlength` per DOM | 5 Felder × (max+1) am Attribut vorbei | 5 | 0 | 5 (alle widerlegt) |
| Kodierungs-Ausdehnungsgrenze | 4 Inhaltsklassen bei gleichzeitigen Feldmaxima | 4 | 1 | 3 (Risiko) |
| Layout bei maximalen Feldlängen | 2 Breiten × (Maximalwerte, Fehlermeldung) | 4 | 4 | 0 |
| Zeichenklassen-Partitionierung — Formular | 16 Unicode-/Schrift-/Leerzeichenklassen in den Deeplink | 16 | 15 | 1 (unerreichbar) |
| Zeichenklassen-Partitionierung — Chat | 13 Klassen × (Rundlauf, Dok-Überlauf, Panel-Eingrenzung) | 39 | 35 | 4 |
| 3-Werte-BVA — Chat-Flächenparser | Grenzen 5/6/9/10, 199/200/201, 250/300/301, 1000 | 13 | 7 | 6 |
| Bidi-Differenzialorakel | 3 RTL-Zeichenketten × 3 `dir`-Modi + echte Blase × 2 Läufe | 11 | 9 | 2 |
| Viewport-Breakpoint-BVA | jeder CSS-Breakpoint ±1 (30 Breiten) × 5 Zustandsorakel | 150 | 148 | 2 |
| Bandbisektion (Wiederholungen) | 21 Breiten × 2 Läufe + 13 Breiten × 3 Läufe | 81 | 55 | 26 (13 Breiten) |
| Zoom / Textskalierungsgrenze | 100 %, 200 %, 400 %, 24 px Grundschrift bei 1280 und 390 | 5 | 3 | 2 |
| Inhaltsanzahl-Äquivalenz | 15 Array-Listen × 4 Sprachen + JSON-LD-Angebotszahl + Abzeichentext | 68 | 65 | 4 |
| **Summe** | | **~660** | **~470** | **~190** |

### L4 · Ausfall & Erholung

Ein *Fall* = eine injizierte Störung (oder ein Zustandsübergang) plus ihre Zusicherungen. Mehrere
„gefallen"-Zellen sind derselbe Befund in einer anderen Sprache, einem anderen Viewport oder Lauf.

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| Fehlerinjektion — Fähigkeitsentzug (JS aus) | 4 Sprachen × Desktop + mobil 390 + Inertkontroll-Audit + Nach-Animation | 7 | 6 | 1 |
| Fehlerinjektion — eigenes JS-Bündel (Abbruch/404/500/Verzögerung) | jedes eigene Chunk × Fehlerart; 3 GSAP-Timing-Klassen; Leerfenster × 4 Sprachen + mobil | 31 | 12 | 19 |
| Fehlerinjektion — Drittanbieter & Asset-Klasse | google+gstatic+googleapis, `/images/**`, `/fonts/*.woff2`, alles kombiniert; 1440 + 390 | 6 | 6 | 0 |
| Entscheidungstabelle — `/api/chat`-Antwortraum | Abbruch, 500, 429, 200 `text/html`, 200 leer, 200 `{reply:null}`, 200 +30 s, Hänger | 8 | 6 | 2 |
| Zustandsübergang — Chat-`busy`-Flag | Toteintritt, stiller Verlust, Erholung durch Schließen/45 s/Neuladen | 5 | 2 | 3 |
| Fehlerinjektion — Leitung tot (`setOffline`) | Chat, Hash-Navigation, Formular, volle Navigation, wieder online, Abbruch während Fetch ×2 | 7 | 6 | 1 |
| Fehlerinjektion — Bandbreite (CDP) | Slow 3G, Fast 3G: Lesbarkeit, Enthüllung nach schwerem Chunk, JS-Fehler, gsap-vs-Notbremse | 2 | 0 | 2 |
| Zustandsübergang — unterbrochener Formularfluss | F5; dblclick / 2 echte Klicks / programmatisch ×2 (je ×2); Absenden+Escape; Absenden+Navigation; Fußzeilenlink; Sprachwechsel | 12 | 5 | 7 |
| Zustandsübergang — Historie | Hash-Zurück, Hash-Vorwärts (×2), Chat+Zurück, Menü+Zurück, Thema über Navigation/Zurück/Vorwärts, Neuladen mit offenem Menü | 8 | 8 | 0 |
| Fehlerinjektion — Storage-API | `getItem`+`setItem` werfen (×2), Quota beim Schreiben; Müll-`theme` (10 Klassen) | 13 | 13 | 0 |
| Zustandsübergang — `theme-color`-Vertrag | Umschalten, F5, Frischeintritt × 4 Sprachen + 2 Rechtsseiten, hell→dunkel | 9 | 3 | 6 |
| Stress / Leck-Signal | Chat 30×, Thema 30×, Größe 20×, Zuhörer-Skalierung 10 vs 60, ein-Klick-eine-Blase ×2, Heap-Trend | 7 | 7 | 0 |
| rAF-Buchhaltung je Schleife | 7 Scroll-/Sichtbarkeitszustände × 2 Schleifen; `visibilitychange`-Vertrag | 11 | 9 | 2 |
| Fehlerinjektion — GPU | `getContext('webgl*') → null` (×2); `WEBGL_lose_context` (×2) + Erholung | 4 | 0 | 4 |
| Vertragsprüfung — `prefers-reduced-motion` | 4 Sprachen + TR (statische Bilder ×2, Legende, Hero, CLS, Wechsel mitten im Besuch) | 20 | 20 | 0 |
| **Summe** | | **150** | **103** | **47** |

### L5 · i18n & Fakten-Sicherheit

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| Statischer Verbotsinhalts-Durchlauf | 22 Regelmuster × 31 gebaute Textdateien (inkl. aller 6 Client-Bündel) | 682 | 660 | 22 |
| hreflang/canonical/og-Entscheidungstabelle | 8 Invarianten × 17 Seiten | 136 | 128 | 8 |
| Gegenseitigkeitsprüfung | jede hreflang-Kante im Build | 68 | 64 | 4 |
| Sitemap ↔ hreflang-Konsistenz | Vokabular, x-default, Form je URL ×16 | 18 | 2 | 16 |
| JSON-LD ↔ sichtbarer Inhalt | ~24 Aussagen × 17 Seiten | 401 | 289 | 112 |
| Metamorphe Sprachparität — Anzahlen | 16 Arrays × 4 Sprachen | 64 | 60 | 4 |
| Metamorphe Sprachparität — Rechtsblöcke | 3 Dokumente × 4 Sprachen (Blöcke + Absätze + Platzhalter) | 36 | 27 | 9 |
| Metamorphe Sprachparität — Attribute/Zeichenketten | 23 Attribute + 8 Leckmuster × 4 Sprachen | 124 | 104 | 20 |
| Metamorphe Schreibung — Türkisch (live, ×2) | 16 Handler × 3 Schreibungsklassen | 96 | 88 | 8 |
| Metamorphe Schreibung — de/ru/en (live) | 4 Sonden × 3 Sprachen | 12 | 12 | 0 |
| Stichwortkollisions-Äquivalenzklassen (live) | 4 kleingeschriebene Eingaben | 4 | 1 | 3 |
| Netzwerk-/Speicher-Zustandsbeobachtung (live, ×2) | 5 Beobachtungen × 4 Sprachen × 2 Phasen | 80 | 40 | 40 |
| Anforderungs-Rückverfolgung | `instruction.md §3.1/3.2/3.3`, `docs/04 §8/§9`, `master.md`, Guard-Ausgabe | 21 Regeln | 15 | 6 |
| **Summe** | | **1 842** | **1 594** | **248** |

Die Fehlzahlen sind **Zusicherungsinstanzen, nicht eigene Befunde** — 248 gefallene Zusicherungen
fallen in 17 Befunde zusammen.

### L6 · Sicherheit

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| XSS-Payload-Matrix (Chat) | 24 Payload-Klassen × 2 Läufe, Senke = Nachrichtenblase | 48 | 48 | 0 |
| DOM-XSS über URL | Query + Hash + kombiniert, 4 Sprachen berührt | 6 | 6 | 0 |
| Injektion über Randevu-Felder | alle 5 Freitextfelder, ein feindlicher Payload, 3 Zusicherungen | 3 | 3 | 0 |
| URL-Senken-Fehlerinjektion (`j.wa`) | 6 Schemata + 1 Kontrollpaar + 1 Markup-Fall, Schlüsselfall ×2 | 11 | 9 | 2 |
| Linksicherheit / Tabnabbing | jedes `target=_blank` auf 18 Seiten + `window.open`-Form | 25 | 25 | 0 |
| Endpunkt-Negativ- & Missbrauchsprüfung | 7 Methoden, 11 Rumpfformen, 15 Locales, Kürzung, 5-MB-Rumpf, Schlüsselexposition, Upstream-Fehler | 50 | 49 | 1 |
| Ratenbegrenzung / Budget-Missbrauch | stabile IP, rotierendes XFF, fehlendes XFF, 5 200 IPs, Cross-Origin-Aufruf | 5 | 3 | 2 |
| Sicherheits-Header | 6 Header × ausgeliefert + `vercel.json`-Prüfung | 12 | 4 | 8 |
| Clickjacking | Cross-Origin-Framing + Interaktion im Frame, ×2 | 2 | 0 | 2 |
| Datenschutz / Zustimmungszustand | 4 Sprachen × (erster Anstrich, nach Scroll, Cookies, Storage) + 5 Rechtsseiten + Themaschreibung | 18 | 14 | 4 |
| Client-DoS / ReDoS | 4 Chat-Payloads + 1 Formular-Payload + maxlength | 6 | 5 | 1 |
| Datei-Expositions-Aufzählung | 35 Pfade inkl. Traversierung, VCS, Env, Quelle, Doku | 35 | 34 | 1 |
| Ausgabe-Wächter-Fehlerinjektion | 4 Projektregeln in einer Antwort, ×2 | 2 | 0 | 2 |
| **Summe** | | **223** | **200** | **23** |

### L7 · Performance

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| Nutzlastbudget / statisches Asset-Audit | 4 Sprachen × 2 Viewports × 3 Läufe, präziser `load`-Schnitt | 24 | 22 | 2 |
| Kritischer-Pfad-/Wasserfallanalyse | jede Anfrage auf `/` nach Entdeckung geordnet, Fast 3G | 18 Anfragen | — | 1 |
| Differenzial-(Mutations-)Prüfung | 5 Blockvarianten × 3 Läufe für LCP/TBT; 5 × 2 Viewports × 3 Läufe für CLS | 45 | 40 | 2 (+3 Widerlegungen) |
| Trace-basierte Hauptthread-Zuordnung | 1 volles Trace, Ereignistyp- + Skript-URL-Aggregation | 1 | — | 1 |
| Frameraten-Abtastung (konstante Geschwindigkeit) | ganze Seite × 3 Varianten × 5 Läufe; 13 Abschnitte × 5 Läufe | 80 | 79 | 1 |
| Zustandsübergang (rAF-Pause) | {sichtbar, außer Sicht, Tab versteckt} × {WebGL, 2D} × 3–5 Läufe | 26 | 20 | 6 |
| Kontrolliertes Experiment (Kostenisolierung) | 6 Zustände × 3 Läufe, `TaskDuration` mit chirurgischer Kontrolle | 18 | — | 1 |
| Speicher-/Langzeit-Soak | 4 Aktionen, 19 Post-GC-Kontrollpunkte × 3 Läufe + 4 Isolationsvarianten × 3 | 69 | 69 | 0 |
| Cache-/Wiederbesuchsanalyse | 3 Phasen × 3 Läufe + `vercel.json`-Prüfung | 9 | 9 | 1 (Konfig) |
| Last / Parallelität | 4 Parallelitätsstufen × 3 Runden (HTTP) + 8 parallele Browser × 3 Runden | 15 | 15 | 0 |
| Stress / Schnellfeuer (Chat) | 4 Varianten × 3 Läufe + 7 Zeitabstände × 3 Läufe | 33 | 12 | 21 |
| Grenzwertanalyse | Chat-Wächterfenster, 50…600 ms | 7 | 3 | 4 |
| Font-Subset-Timinganalyse | 2 Netze × 2 Sprachen × 3 Läufe, je Datei vs. FCP | 12 | 2 | 10 |
| Bildüberlieferungsanalyse | 10 `<img>` + 2 CSS-Hintergründe × 2 DPR | 24 | 19 | 5 |
| **Summe** | | **~358** | | **10 Befunde + 13 Widerlegungen** |

### L8 · Barrierefreiheit & Usability

| Technik | Kriterium | Fälle | Bestanden | Gefallen |
|---|---|---|---|---|
| Automatisierter Regelscan (axe-core 4.10.2) | 6 URLs × 2 Themes × 2 Viewports + 2 Widget-Zustände | 26 Scans | 0 saubere | 6 Regeln (alle `best-practice`); **0 WCAG-markiert**; `color-contrast` **unvollständig** auf 43 Knoten/Seite |
| Pixelwahrheit-Kontrastdurchlauf (1.4.3/1.4.6) | jeder Textknoten, 4 URLs × 2 Themes × 2 Viewports | 1 811 | 1 598 ≥ AA | 213 → 16 Elemente nach Dedup |
| Zielgerichteter Kontrast (Risikoliste) | 51 Selektoren × 2 Themes × 2 Viewports + 2 auf `/de/` | ~176 | 159 | 17 |
| Nicht-Text-Kontrast (1.4.11) | 9 UI-Grenzen × 2 Themes + 2 gefüllte Bedienelemente | 20 | 6 | 14 |
| Tastaturdurchlauf (2.1.1/2.1.2/2.4.3) | voller Tab-Durchlauf Desktop + mobil, Shift+Tab rückwärts | 91 + 24 | 91 (kein Fang) | 2 Reihenfolgeinversionen |
| Fokusanzeigen-Beweis (2.4.7/2.4.13) | 24 Elemente × 2 Themes × 2 Viewports + 11 visuelle A/B × 2 Themes | 96 + 22 | 84 | 12 |
| Widget-Fokusverwaltung | Burger + Chat-Dialog × 2 Themes × 2 Viewports | 8 | 4 (Burger) | 4 (Chat) |
| Namen/Rollen/Werte + Struktur | 6 URLs, voller AX-Baum + Landmark + Überschrift + Bild + Formular | 6 | 1 (`/kvkk`) | 6 Landmarks, 5 Gliederung, 3 Sprachnamen |
| Reduzierte Bewegung (2.3.3) + Blinken (2.3.1) | 2 Themes × 8 Zusicherungen + 20 Leuchtdichteproben | 36 | **36** | 0 |
| Zoom & Reflow (1.4.4/1.4.10/1.4.12) | 4 Viewportfälle × 2 Themes + Nur-Text 200 % × 2 | 10 | 4 | 6 |
| Zielgröße (2.5.8) + Abstand | 26 Bedienelementgruppen, 132 Messungen bei 390×844 × 2 Themes | 132 | 132 ≥ 24×24 | 0 bei AA; **24 < 44×44**, 8 Paare < 8 px |
| Usability-Heuristik-Durchlauf (Nielsen 1/3/5/9, ISO 9241-110) | mobiler Conversion-Pfad, 7 Szenarien | 7 | 4 | 3 |
| Forced-Colors-Robustheit | 7 Elemente × 2 Läufe | 14 | 10 | 4 |

**Wichtige Einordnung:** axe-core meldet `color-contrast` als **UNVOLLSTÄNDIG auf 43 Knoten je
Seite** („background color could not be determined due to a background image"), weil das Design
`color-mix()`, radiale Verläufe, `backdrop-filter`, eine `<canvas>` und `mix-blend-mode` benutzt. Die
**automatisierte Kontrastabdeckung dieser Seite ist damit praktisch null** — jeder Kontrastwert im
Bericht stammt aus echten gerenderten Pixeln (zwei Screenshots je Scrollposition, einer mit
`*{color:transparent!important}`, damit Glyphen verschwinden und alle Hintergrundebenen überleben).

---

## 3. Was jede Linse nicht prüfen konnte

**Alle Linsen gemeinsam:** echte Anthropic-Antworten (kein `ANTHROPIC_API_KEY`; `api/chat.js` ist
eine Vercel-Funktion, die `astro preview` nicht ausliefert — der volle HTTP-Antwortraum wurde per
`page.route` simuliert, was den Client-Vertrag deckt, nicht das Upstream-Streaming) · echte
WhatsApp-Zustellung (Deeplink-URL und entschlüsselter Inhalt geprüft, nie gesendet) ·
Produktions-Vercel (Header, HSTS, Brotli statt gzip, HTTP/2 statt HTTP/1.1, Groß-/Kleinschreibung in
URLs auf einem case-sensitiven Dateisystem, ob Vercel ein mitgeschicktes `X-Forwarded-For`
überschreibt) · Google-Maps-Innenleben.

**L2:** ob echtes Chromium-/Safari-Autofill oder ein Passwortmanager das Honeypot-Feld
`name="website"` je füllt (headless nicht steuerbar) · ob `role="alert"` auf `#reqErr` bei der
Schreiben-dann-Einblenden-Reihenfolge tatsächlich angekündigt wird.

**L3:** WhatsApps Umgang mit einem 3 969 Zeichen langen `text`-Parameter · echter Browser-Zoom
(Playwright kann die Zoomstufe nicht setzen; nach WCAG-Definition emuliert: 200 % @1280 = 640 CSS-px
bei `deviceScaleFactor:2`, 400 % = 320) · `maxlength`-Kürzungsverhalten in Firefox/Safari — **falls
eine andere Engine ein Surrogatpaar zerreißt, wird der dort widerlegte Absturz zu einem echten
kritischen Befund; einmal auf Safari/iOS manuell prüfen** · physische Darstellung im Band 481–535 px
(iPad-Splitview, Faltgeräte).

**L4:** echtes Tab-Throttling (`Emulation.setPageVisibilityOverride` existiert in diesem Chromium
nicht mehr; `bringToFront()` setzt `document.hidden` headless nicht — geprüft wurde der
**Handler-Vertrag** per `defineProperty` + synthetischem `visibilitychange`, nicht Chromes echte
rAF-Unterdrückung) · Service-Worker-/Offline-Rückfall (existiert nicht) · `performance.memory` ist
Chromium-only und ein Trend, kein Beweis · Vercel-/CDN-Edge-Verhalten (echte 502/504,
`stale-while-revalidate`, ob ein schlechtes Deploy wirklich ein veraltetes gehashtes Chunk ausliefert).

**L5:** ob der Kunde `2021`, `yetkili servis`, `7/24`, die 6-Jahres-Garantiestufen und
deutschsprachiges Personal wirklich bestätigt hat — der einzige Beleg sind Code-Kommentare, die
WhatsApp-Antworten vom 05.08.2026 zitieren; **keine `docs/`-Datei hält sie fest** · ob Google Maps
für einen echten Besucher Cookies setzt (die Kontexte waren frisches Chromium ohne Google-Sitzung;
ein eingeloggter Besucher mit erlaubten Drittanbieter-Cookies könnte welche bekommen, was C1 von
„nur IP-Übermittlung" auf eine zusätzliche Cookie-Aussage ausweiten würde) · ob Google für M12
wirklich eine manuelle Maßnahme verhängt (die Richtlinienbedingung ist geprüft, das Ergebnis nicht) ·
die menschliche Beurteilung, ob eine übersetzte echte Google-Rezension unmarkiert gezeigt werden darf.

**L6:** ob Claude der eingespeisten Prompt-Injektion **widersteht** — belegt ist nur, dass die
Eingabe das Modell ungefiltert erreicht und die Antwort wörtlich veröffentlicht wird; **vor dem
Livegang mit echtem Schlüssel nachprüfen** · ob `text/plain`-Rümpfe Vercels eigenen Body-Parser
überleben (das Verhalten wurde nachgebildet; der String-Rumpf-Zweig in `chat.js:90` existiert genau
für diesen Fall).

**L7:** INP / echte Interaktionslatenz (TBT ist ein Stellvertreter) · echtes Mittelklasse-Android
(4×/6×-CPU-Drosselung nähert es an, reproduziert aber GPU, Thermik und Speicherdruck nicht — die
WebGL-Zahlen wären auf echtem Silizium eher schlechter) · serverloses `/api/chat` unter Last
(Kaltstart, die 8/min-Begrenzung, Anthropic-Latenz) · `p-vrf.webp` (5,3 KB) und `og.jpg` (52,4 KB)
wurden von **keiner** Seite angefordert — `p-vrf.webp` ist toter Ballast, `og.jpg` ist korrekt als
`og:image` eingebunden und wird absichtlich nicht von der Seite geladen.

**L8:** echte Screenreader (kein NVDA/JAWS/VoiceOver/TalkBack — alle Namen/Rollen/Zustände stammen
aus Chromiums Barrierefreiheitsbaum über CDP, verbindlich für berechnete Eigenschaften, **kein
Beweis für Ankündigungsverhalten**) · echtes Windows-Kontrastmodell (nur
`forcedColors: 'active'`-Emulation) · Kontrast-Pixeldurchlauf auf `/ru/` und `/en/` (geprüft wurden
`/`, `/de/`, `/kvkk`, 404; Struktur/Namen/Überschriften auf allen vier) · 11 der 12 Rechtsseiten
(nur `/kvkk`, 0 Fehler; die drei Vorlagen sind identisch) · echte Berührungseingabe (Zielgrößen sind
geometrische Messungen, keine beobachteten Fehltippraten) · `prefers-contrast: more` (das Stylesheet
hat keine solchen Regeln — nichts zu prüfen, aber angesichts M19/M20 eine ungenutzte Verbesserung).
