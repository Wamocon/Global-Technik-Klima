# Senior-UI-Developer Tech-Audit: Methode, Prompt & Live-Testlauf

Dieses Dokument hat drei unabhängige Blöcke. Jeder Block ist einzeln herauskopierbar und für sich verständlich (keine Verweise auf "siehe oben" nötig).

- **BLOCK A** — Die Methodik (wie ein Senior-UI-Entwickler eine Seite technisch scannt)
- **BLOCK B** — Der wiederverwendbare Master-Prompt (für jede neue Website einsetzbar)
- **BLOCK C** — Das Live-Testergebnis für `alanyagreeyetkilibayi.com.tr`, bereits in exakt der Struktur, die Claude in einer neuen Aufgabe am besten versteht

---

## BLOCK A — Die Methodik

Ein Senior-UI-Entwickler scannt eine fremde Website nie linear "von oben nach unten", sondern in **9 klar getrennten Ebenen** — jede Ebene beantwortet eine andere Frage und nutzt andere Werkzeuge. Das verhindert, dass etwas übersehen wird, weil jede Ebene ihren eigenen Vollständigkeits-Check hat.

1. **Tech-Stack & Architektur** — Womit ist die Seite gebaut? (CMS, Theme/Page-Builder, Generator-Meta-Tags, Frameworks)
2. **Informationsarchitektur / Sitemap** — Welche Seiten gibt es wirklich, welche sind Duplikate/programmatisch erzeugt?
3. **Design-System-Extraktion** — Farben, Typografie, Spacing, Logo, Radius/Formsprache als Tokens, nicht als Meinung
4. **Content-Inventar** — Was steht tatsächlich auf jeder Seite (Sections, Headlines, Copy, CTAs)?
5. **Komponenten-/Pattern-Inventar** — Wiederkehrende UI-Bausteine (Header, Slider, Cards, Karten-Embed, Footer)
6. **Responsive-/Mobile-Verhalten** — Bricht etwas auf kleinen Screens? (visuell prüfen, nicht annehmen)
7. **Performance-Signale** — Ladezeit-relevante Signale (Bildformate, Skripte, Caching-Hinweise); echte Core-Web-Vitals-Zahlen kommen aus einem dedizierten Tool, nicht aus dem Content-Scan
8. **Accessibility- & SEO-Signale** — Semantische Struktur (Heading-Hierarchie), Meta-Daten, robots-Direktiven, Sprache
9. **Content-QA / Faktenabgleich** — Widersprüche im Text selbst finden (falsche Ortsnamen, kaputte Kontaktdaten, inkonsistente Telefonnummern) — dieser Schritt wird in Checklisten am häufigsten vergessen, liefert aber die konkretesten, sofort umsetzbaren Fixes

**Wichtiges Prinzip, das die Methode von einer reinen Checkliste unterscheidet:** Jeder Befund bekommt ein Label — `VERIFIZIERT` (direkt aus den Rohdaten belegbar), `ABGELEITET` (Interpretation der Rohdaten) oder `OFFEN` (nicht geprüft, z. B. weil ein Tool fehlt). Ein Senior-Entwickler vermischt nie "das sehe ich" mit "das vermute ich" — genau das führt bei Junior-Audits zu falschen Prioritäten.

---

## BLOCK B — Der wiederverwendbare Master-Prompt

```
Du agierst als Senior UI/Frontend-Entwickler und führst einen technischen Website-Audit durch.

ZIEL-URL: «URL einfügen»
KONTEXT: «z.B. "lokaler Dienstleister, Zielgruppe X" — optional»

Arbeite die folgenden 9 Ebenen STRIKT DER REIHE NACH ab. Überspringe keine Ebene,
auch wenn sie auf den ersten Blick leer erscheint — vermerke stattdessen "nichts gefunden".

1. TECH-STACK & ARCHITEKTUR
   Ermittle CMS/Generator, Theme/Page-Builder, erkennbare Frameworks, Hosting-Hinweise.
   Quelle: Meta-Tag "generator", HTML-Struktur, Script-Quellen.

2. INFORMATIONSARCHITEKTUR / SITEMAP
   Liste alle auffindbaren URLs. Trenne explizit: echte Redaktionsseiten vs.
   automatisch generierte/programmatische Seiten (z. B. Tag-Archive, Ort+Produkt-
   Kombinationen). Nenne die Gesamtzahl je Kategorie.

3. DESIGN-SYSTEM-EXTRAKTION
   Extrahiere: Primär-/Sekundär-/Akzentfarbe (Hex), Schriftfamilien (Heading/Body),
   Schriftgrößen-Skala, Logo-URL, Eckenradius/Formsprache. Kennzeichne die
   Konfidenz der Extraktion, falls das Tool das liefert.

4. CONTENT-INVENTAR (Startseite + wichtigste Unterseiten)
   Liste jede sichtbare Section in Reihenfolge mit: Zweck, Headline, Kernaussage,
   enthaltene CTAs/Links.

5. KOMPONENTEN-/PATTERN-INVENTAR
   Welche UI-Bausteine wiederholen sich (Header/Nav, Slider, Card-Grid,
   Karten-Embed, Kontakt-Block, Footer)? Wie oft und wo?

6. RESPONSIVE-/MOBILE-VERHALTEN
   Erstelle einen Mobile-Screenshot (falls Tool verfügbar) und prüfe visuell auf:
   überlappende Inhalte, abgeschnittenen Text, zu kleine Tap-Targets.

7. PERFORMANCE-SIGNALE
   Erfasse nur, was aus dem Scan ableitbar ist (Bildformate, Anzahl eingebundener
   Skripte/Drittanbieter-Embeds). Kennzeichne echte Core-Web-Vitals-Messung
   (LCP/CLS/TTFB) explizit als OFFEN — das erfordert PageSpeed Insights/Lighthouse.

8. ACCESSIBILITY- & SEO-SIGNALE
   Prüfe Heading-Hierarchie (H1 vorhanden? plausible Größe?), Meta-Description,
   robots-Direktive, Sprachauszeichnung, Alt-Texte wo sichtbar.

9. CONTENT-QA / FAKTENABGLEICH
   Lies den tatsächlichen Fließtext gegen sich selbst: Stimmen Ortsnamen,
   Telefonnummern, E-Mail-Adressen über alle Vorkommen hinweg überein?
   Das ist der Schritt, der am häufigsten übersprungen wird — nicht überspringen.

AUSGABEFORMAT:
- Eine Markdown-Datei mit exakt diesen 9 nummerierten Abschnitten als H2-Überschriften.
- Jeder Befund erhält ein Label: [VERIFIZIERT] / [ABGELEITET] / [OFFEN].
- Am Ende: Abschnitt "OFFENE PUNKTE / NÄCHSTE SCHRITTE" — alles, was mangels
  Tool-Zugriff nicht geprüft werden konnte, explizit aufgelistet statt verschwiegen.
- Keine Bewertung/Priorisierung/Empfehlungen in diesem Schritt — reines Erfassen.
  (Empfehlungen sind ein bewusst getrennter Folgeschritt.)
```

---

## BLOCK C — Live-Testergebnis: `alanyagreeyetkilibayi.com.tr`

*Erhoben per Firecrawl (Map + Scrape/Branding/Screenshot, Stealth-Proxy, Status 200). Alle Angaben mit Label versehen.*

### 1. TECH-STACK & ARCHITEKTUR
- **CMS:** WordPress 7.0 `[VERIFIZIERT]` (Meta-Tag `generator`)
- **Theme/Page-Builder:** SiteOrigin `[VERIFIZIERT]` (Footer-Credit "Theme by SiteOrigin")
- **Kartenintegration:** Google Maps Embed mit sichtbarem API-Key direkt in der URL `[VERIFIZIERT]` — potenzielles Risiko (Kontingent-Missbrauch durch Dritte), sollte serverseitig proxied oder key-restricted werden `[ABGELEITET]`
- **Kein modernes JS-Framework erkennbar** (kein React/Vue-Fingerprint in der Struktur) `[ABGELEITET]`

### 2. INFORMATIONSARCHITEKTUR / SITEMAP
- **Echte Redaktionsseiten (10):** Startseite, Hizmetlerimiz, Hakkımızda, Referanslarımız, İletişim, sowie 7 Produktseiten (Duvar Tipi, Salon Tipi, Multi Sistem, Isı Pompası, Ticari, VRF, Home Tipi, Yedek Parça) `[VERIFIZIERT]`
- **Programmatisch generierte Tag-Archive: 90+ URLs** nach Muster `/tag/{ort}-gree-{produkttyp}-servisi` (Orte: Alanya, Antalya, Akseki, Aksu, Demre, Döşemealtı, Elmalı, Finike, Gazipaşa, Gündoğmuş, İbradı, Kaş, …) `[VERIFIZIERT]`
- **Bewertung:** klassisches programmatisches Local-SEO-Muster, sehr wahrscheinlich dünner/duplizierter Inhalt auf allen 90+ Seiten — Risiko für Crawl-Budget-Verschwendung und Duplicate-Content-Abwertung `[ABGELEITET]`, tatsächlicher Seiteninhalt der Tag-Archive noch nicht einzeln geprüft `[OFFEN]`

### 3. DESIGN-SYSTEM-EXTRAKTION
| Token | Wert | Status |
|---|---|---|
| Primärfarbe | `#F14E4E` (Rot) | VERIFIZIERT |
| Sekundärfarbe | `#F04D24` (Orange-Rot) | VERIFIZIERT |
| Akzent-/Textfarbe | `#034DA2` (Blau) | VERIFIZIERT |
| Hintergrund | `#F9F9F9` | VERIFIZIERT |
| Heading-Font | Montserrat | VERIFIZIERT |
| Body-Font | Open Sans | VERIFIZIERT |
| H1-Größe | 15px | VERIFIZIERT (ungewöhnlich klein für H1 — siehe Abschnitt 8) |
| H2-Größe | 32px | VERIFIZIERT |
| Body-Größe | 19px | VERIFIZIERT |
| Eckenradius | 0px (durchgehend eckig) | VERIFIZIERT |
| Logo | JPG-Datei, kein SVG/PNG-transparent | VERIFIZIERT |
| Extraktions-Konfidenz Farben | 0.9 laut Tool | VERIFIZIERT |
| Extraktions-Konfidenz gesamt | 0.45 laut Tool (niedrig — Komponenten-Erkennung fehlgeschlagen) | VERIFIZIERT |

### 4. CONTENT-INVENTAR (Startseite)
1. **Sticky Header:** Logo (verlinkt Startseite) + Nav (Ana Sayfa, Hizmetlerimiz mit 8 Subitems, Referanslarımız, İletişim) `[VERIFIZIERT]`
2. **Hero-Slider:** 4 Slides, aber ohne erkennbaren Bild-/Text-Inhalt pro Slide extrahierbar `[ABGELEITET]`
3. **"HİZMETLERİMİZ"-Grid:** 8 Service-Kacheln (Duvar/Salon/Multi/Isı Pompası/Ticari/VRF/Home Tipi/Yedek Parça), je mit Titel + Kurztext + Link `[VERIFIZIERT]`
4. **Mission/Über-uns-Block "GLOBAL TEKNİK KLİMA"** mit Fließtext + CTA-Button "İLETİŞİM BİLGİLERİMİZ" `[VERIFIZIERT]`
5. **"HİZMET ANLAYIŞIMIZ"-Block:** 4 Trust-Kacheln (Garantili Yedek Parça, 7/24 Teknik Destek, Mutlu Müşteri, Profesyonel Destek) `[VERIFIZIERT]`
6. **Externer Link "BTU Hesaplama"** zur offiziellen Gree-Türkiye-Seite (Klimarechner) `[VERIFIZIERT]`
7. **Google-Maps-Embed** mit 5,0-Sterne-Bewertung (65 Rezensionen) `[VERIFIZIERT]`
8. **Kontaktblock:** Firma, Tel, Gsm, "Mail", Adresse, Facebook/Instagram-Icons `[VERIFIZIERT]`
9. **Footer:** Copyright 2026, Theme-Credit `[VERIFIZIERT]`
10. **Sticky Mobile-Buttons:** "HEMEN ARA" (Jetzt anrufen) + "WHATSAPP" `[VERIFIZIERT]` — WhatsApp-Anbindung existiert also bereits als einfacher Click-to-Chat-Link

### 5. KOMPONENTEN-/PATTERN-INVENTAR
- Header/Sticky-Nav mit Dropdown (1×)
- Bild-Slider/Carousel (1×, Startseite)
- Card-Grid wiederkehrend (Service-Kacheln, Trust-Kacheln) — **gleiches Pattern, zwei verschiedene Inhalte**
- Google-Maps-Embed (1×)
- Sticky Call-to-Action-Leiste unten (Anruf + WhatsApp) — mobil UND wahrscheinlich desktop sichtbar `[ABGELEITET]`
- Kein sichtbares Kontaktformular auf der Startseite `[VERIFIZIERT]` — Kontaktaufnahme läuft ausschließlich über Telefon/WhatsApp/Karte

### 6. RESPONSIVE-/MOBILE-VERHALTEN
- Mobile-Screenshot (Full-Page) wurde erfolgreich erstellt `[VERIFIZIERT]`
- **Visuelle Detailprüfung auf Überlappung/Clipping steht noch aus** — Screenshot liegt vor, muss noch pixelgenau durchgesehen werden `[OFFEN]`
- Viewport-Meta-Tag korrekt gesetzt (`width=device-width, initial-scale=1`) `[VERIFIZIERT]` — Grundvoraussetzung für Responsive ist technisch gegeben

### 7. PERFORMANCE-SIGNALE
- Logo als JPG statt SVG eingebunden `[VERIFIZIERT]` — unnötig groß für ein Vektor-Logo, schlecht skalierbar
- Mehrere eingebettete Google-Maps-Kachel-Requests bei einem einzigen Seitenaufruf `[VERIFIZIERT]` — potenziell performance-relevant
- **Echte Core-Web-Vitals (LCP, CLS, TTFB, PageSpeed-Score): nicht gemessen** `[OFFEN]` — erfordert Google PageSpeed Insights oder Lighthouse, nicht Teil dieses Content-Scans

### 8. ACCESSIBILITY- & SEO-SIGNALE
- **H1 mit 15px Schriftgröße** `[VERIFIZIERT]` — für ein Hauptüberschrift-Element ungewöhnlich klein, deutet auf falsche Heading-Hierarchie hin (vermutlich wird visuell ein anderes Element als "größte Überschrift" behandelt als semantisch H1 getaggt ist) `[ABGELEITET]` — konkreter Accessibility-/SEO-Fix-Kandidat
- Meta-Description sehr lang und keyword-gestapelt (17+ Keyword-Varianten in einem Satz aneinandergereiht) `[VERIFIZIERT]` — klassisches veraltetes SEO-Muster, wirkt in Suchergebnis-Snippets nicht mehr zeitgemäß `[ABGELEITET]`
- `robots: index, follow` gesetzt `[VERIFIZIERT]` — Seite ist grundsätzlich indexierbar
- Sprache korrekt als `tr` ausgezeichnet `[VERIFIZIERT]`
- Kein sichtbarer Cookie-/KVKK-Consent-Hinweis im gescrapten Inhalt gefunden `[VERIFIZIERT im Scan]` — entweder nicht vorhanden oder JS-verzögert geladen `[OFFEN, unklar welcher Fall zutrifft]`

### 9. CONTENT-QA / FAKTENABGLEICH — die wichtigsten Funde
- **Orts-Fehler im Fließtext:** Der Abschnitt "HİZMET ANLAYIŞIMIZ" endet mit "…Konya'da iklimlendirme sektörünün lider firmalarından biri olmak" — die Seite heißt und wirbt für **Alanya**, nennt hier aber **Konya** `[VERIFIZIERT]`. Klassischer Copy-Paste-Fehler aus einer Template-/Multi-Standort-Vorlage. Hohe Priorität, da vertrauensschädigend für Besucher, die genau hinlesen.
- **Ungültige E-Mail-Adresse:** Im Kontaktblock steht `alanyagreeyetkilibayisi.com.tr` als "Mail" — das ist keine gültige E-Mail-Adresse (kein `@`, vermutlich fehlt ein `info@` davor oder es ist versehentlich die Domain statt der Adresse eingetragen) `[VERIFIZIERT]`
- **Zwei unterschiedliche Telefonnummern-Sätze:** Im oberen Hero-Bereich taucht `+90 332 325 25 50` auf (Vorwahl 0332 = **Konya**, nicht Antalya/Alanya!), während Footer und Sticky-Buttons konsistent `+90 242 513 86 51` (Alanya-Vorwahl) und `+90 533 046 13 87` zeigen `[VERIFIZIERT]`. Das bestätigt den Konya-Fund oben — es scheint, als sei die Seite aus einer Konya-Vorlage geklont und nicht vollständig lokalisiert worden.
- **Google-Bewertung:** 5,0 Sterne bei 65 Rezensionen `[VERIFIZIERT]` — starkes, bisher ungenutztes Vertrauenssignal (wird nur im Karten-Embed gezeigt, nicht als eigenes Trust-Element auf der Seite hervorgehoben) `[ABGELEITET]`

### OFFENE PUNKTE / NÄCHSTE SCHRITTE
- Die 7 Produktseiten sowie Hakkımızda, Referanslarımız, İletişim wurden noch **nicht einzeln inhaltlich** gescannt (nur ihre URLs sind bekannt) `[OFFEN]`
- Stichprobe der 90+ Tag-Archiv-Seiten auf tatsächlichen Dünn-/Duplicate-Content-Grad steht aus `[OFFEN]`
- Echte Performance-Messung (PageSpeed Insights/Lighthouse) steht aus `[OFFEN]`
- Pixelgenaue Mobile-Screenshot-Analyse auf Überlappungen steht aus (Screenshot ist bereits vorhanden) `[OFFEN]`
- Cookie-/KVKK-Consent-Frage ungeklärt `[OFFEN]`

---

**Hinweis zur Weiterverwendung:** Für die separate Aufgabe reicht es, **Block C** (plus bei Bedarf Block A als Kontext) in die neue Unterhaltung einzufügen — Block C ist vollständig in sich abgeschlossen und referenziert nichts Externes.
