# 04 — Anforderungen & Vollständigkeitsprüfung

Bis heute gab es **kein Anforderungsdokument**. Die Anforderungen lagen verstreut: in den Entscheidungstabellen auf claude.ai, in `instruction.md §2`, in Kommentaren — und faktisch im Code. Dieses Dokument schließt die Lücke.

Es ist eine **Rückverfolgung**: jede Anforderung → woher sie kommt → wo sie umgesetzt ist → wie sie geprüft wird. Am Ende (§9) stehen die **Lücken**, die die Prüfung gefunden hat.

Geprüft gegen Commit `d1f6cb8` am 12. Juli 2026, Zeile für Zeile gegen den Code — nicht gegen die Erinnerung.

**Legende:** ✅ gebaut und geprüft · 🟡 gebaut, aber eingeschränkt · ⛔ bewusst gesperrt (Beleg fehlt) · ❌ fehlt

---

## 1. Marke und Wirkung

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| M1 | Hook mit **Bau-Effekt** auf der Titelseite | Auftrag 1 | `FrostHero.astro` — Canvas: goldenes Hitzeflimmern beruhigt sich zu petrolfarbener Kühle. Der Produktnutzen als Bild. | ✅ |
| M2 | **Türkischer Adels-/Königs-Look** | Auftrag 1 | Design-System „Anadolu-Royal": warmes Noir `#100D0B`, Champagner, Gold, Petrol. Cormorant Garamond + Jost. Alle Kontraste nachgerechnet (`tokens.css`). | ✅ |
| M3 | **Wow in allen Kapiteln**, nicht nur im Hero | Auftrag 2, Pkt. 4 | Hero-Frost · 3D-Explosionszeichnung · Vorher-Nachher-Regler · Live-BTU-Rechner · KI-Chat. Fünf eigenständige Momente. | ✅ |
| M4 | **Hook-Bild** mit Wow wie beim Barbershop | Auftrag 10 | Echtes Ladenfoto aus seinem Google-Profil, 1600 × 1200 — schärfer als die 750-px-Fassung auf seiner eigenen Seite. | ✅ |
| M5 | Bilder **von der Originalseite** nutzen | Auftrag 10 | Sieben Gree-Produktbilder + `unit-teal` übernommen. | ✅ |
| M6 | **Harmonische Schrift und Größe** | Auftrag 14, Pkt. 5 | Zwei Familien, eine Skala (`clamp()`), scharfer Radius 2 px durchgehend. | ✅ |
| M7 | Seldschukischer **Achtstern** als Trenner | Phase-A-Plan | — | ❌ *(Lücke L9)* |

---

## 2. Inhalt

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| I1 | **Alle Inhalte** der Originalseite übernommen (K4-Prüfung) | Auftrag 11 | Leistungen (6), Produkte (7 Linien), Über uns, Kontakt, Öffnungszeiten, Sozialprofile. | ✅ |
| I2 | Das **leere Referenzen-Kapitel** seiner Seite füllen | K4-Prüfung | `BeforeAfter.astro` | 🟡 *— gekennzeichnete Illustration, keine echten Montagefotos (§8)* |
| I3 | **Sternebewertung sehr stark hervorheben**, für Türken und Russen auf einen Blick, Handy wie Desktop | Auftrag 14, Pkt. 4 | Im Hero: `5,0` in Display-Schrift, ★★★★★, „65 Google-Bewertungen" in der jeweiligen Sprache, verlinkt auf seinen Karteneintrag. **Gemessen: 74 px Desktop, 65 px Mobil.** | ✅ |
| I4 | Den **dünnen Querbalken löschen** | Auftrag 14, Pkt. 4 | Entfernt; sein einziger wertvoller Inhalt (die Bewertung) ist in I3 aufgegangen. | ✅ |
| I5 | **Google-Maps-Daten** auswerten | Auftrag 2, Pkt. 5 | Karteneintrag aufgelöst, Koordinaten, Bewertung, Öffnungszeiten, hochauflösendes Ladenfoto gezogen. Karte eingebettet. | ✅ |
| I6 | **Keine erfundenen Angaben** (Akquise) | Auftrag 6 | Kein Gründungsjahr, keine Preise, fremdsprachige Bewertungen als „Beispiel" markiert. Konya-Nummer entfernt. | ✅ |
| I7 | **Gründungsjahr** recherchieren | Auftrag 6 | Nirgends öffentlich belegt. „Seit 1997" gehört dem Klimabudur-Netzwerk, **nicht** diesem Betrieb. | ⛔ |
| I8 | **Yetkili servis oder bayi** klären, im Zweifel sichergehen | Auftrag 6 | „Bayi ve Servisi" steht wörtlich auf seiner Über-uns-Seite → genau so gespiegelt, nichts darüber hinaus. | ⛔ *(Servis-Status für Garantie-Abzeichen unbestätigt)* |

---

## 3. Konversion

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| K1 | **WhatsApp-Direktkontakt** | Auftrag 1 | Drei Einstiege: schwebender Knopf (Desktop), Sticky-Leiste (Mobil), Rechner-Knopf. | ✅ |
| K2 | WhatsApp-Symbol **schwebend, rechts unten** | Auftrag 13, Pkt. 1 | `.wafab`, über dem Chat-Starter. Auf Mobil deckt die Sticky-Leiste den Kanal ab. | ✅ |
| K3 | **BTU-Rechner** | Entscheidungstabelle | Fläche + Personen + Sonnenlage → auf reale Verkaufsstufen gerundet. Rechnet im Browser, sendet nichts. | ✅ |
| K4 | Rechner-Ergebnis **direkt in WhatsApp** | eigener Vorschlag | Der Knopf öffnet WhatsApp mit vorformulierter Nachricht: *„BTU: 18.000 · 32 m² · 3 kişi"*. | ✅ |
| K5 | **Telefon sichtbar** (türkisches Vertrauenssignal Nr. 1) | `docs/02-glossar.md` | Kopfzeile, Kontakt, Sticky-Leiste. Aus `biz.phone`, nirgends doppelt. | ✅ |
| K6 | **Bewertungen** als sozialer Beweis | Verkaufspsychologie (repliziert) | Echte türkische Google-Zitate; fremdsprachige als „Beispiel" markiert. | ✅ |
| K7 | **Preis-Anker** für den russischen Markt | `docs/02-glossar.md` | Russisch: „бесплатный замер" statt einer erfundenen Zahl. | ⛔ *— echter Preis-Play blockiert, bis Mindestpreise vorliegen* |

---

## 4. KI-Assistent

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| A1 | **Chat, der Freitext verarbeitet** | Auftrag 1 | `Assistant.astro` — freies Textfeld, keine Knopf-Bäume. | ✅ |
| A2 | Soll **über das Thema alles wissen** | Auftrag 11 | `api/chat.js` → echtes Sprachmodell mit dem Systemprompt aus `kb.ts`. Beantwortet jeden Freitext in der Sprache des Besuchers. | ✅ |
| A3 | Funktioniert **auch ohne Server/Schlüssel** | eigene Anforderung (Demo muss immer laufen) | Ohne `ANTHROPIC_API_KEY` meldet die Funktion ehrlich `fallback: true`; der Browser schaltet auf die Intent-Maschine um. **13 Themen** + Preisfrage + Mensch-Übergabe + Fläche → BTU. | ✅ |
| A4 | **Eine** Wissensquelle für beide Betriebsarten | eigene Anforderung | `src/content/kb.ts` — derselbe Text ist Systemprompt *und* Regelantwort. Keine Abweichung möglich. | ✅ |
| A5 | Chat lässt sich **schließen** | Auftrag 13, Pkt. 2 | War kaputt (`display:flex` schlug `[hidden]`), ist behoben; der Abnahmetest prüft öffnen/Freitext/schließen in allen vier Sprachen. | ✅ |
| A6 | **Vierprachig** | Auftrag 4 | Erkennung und Antwort je Sprache; `toLocaleLowerCase(locale)`, nie `toLowerCase()`. | ✅ |
| A7 | **KI-Kennzeichnung** | freiwilliges Vertrauenssignal | Hinweiszeile über dem Chatfenster. Rechtlich in der Türkei **nicht** erzwungen (`docs/03-recht.md`) — bleibt trotzdem. | ✅ |
| A8 | **Nichts erfinden**, bei Unsicherheit übergeben | Fakten-Sicherheit | Im Systemprompt verankert: keine Preise, keine Terminzusagen, im Zweifel WhatsApp. | ✅ |

---

## 5. Technik, Sprache, Barrierefreiheit

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| T1 | **Vier Sprachen** TR / RU / DE / EN | Auftrag 4 | Vier Routen. Türkisch an der Wurzel (`prefixDefaultLocale: false`). | ✅ |
| T2 | **Türkisch an der Wurzel**, `.com.tr` bleibt | Auftrag 4 + adversarial geprüft | `astro.config.mjs`. ccTLD ist ein Ländersignal, keine Sprachsperre. | ✅ |
| T3 | `hreflang` **generiert**, nie von Hand | `docs/01-sprachvertrag.md` | `src/i18n/utils.ts → hreflangs()`. Gegenseitigkeit per Konstruktion. `x-default` → türkische Wurzel. | ✅ |
| T4 | **Türkische i-Falle** unmöglich machen | `docs/02-glossar.md` | `scripts/guard.mjs` bricht den Build bei `toUpperCase()`/`toLowerCase()`. | ✅ |
| T5 | **Fehlerfrei auf Desktop und Mobil** | Auftrag 14, Pkt. 2 | Abnahmetest 4 Sprachen × 2 Ansichten: **0 Fehler**. | ✅ |
| T6 | **Vollständig dynamisch** (kein horizontaler Überlauf) | Auftrag 14, Pkt. 5 | Wird je Sprache einzeln geprüft — das hat den russischen Mobil-Bruch gefunden. | ✅ |
| T7 | **Karte muss angezeigt werden** | Auftrag 13/14, Pkt. 3 | Direkt eingebettetes `<iframe>` (nicht per JavaScript erzeugt — das war der Fehler). Gemessen: 438 px Desktop, 318 px Mobil. | ✅ |
| T8 | **Ladeleistung**: 3D darf den kritischen Pfad nicht belasten | eigene Leitplanke | Three.js lädt dynamisch per `IntersectionObserver`. **Nachweis: der 707-KB-Brocken erscheint 0× in `dist/index.html`**; anfangs laden ~22 KB. | ✅ |
| T9 | **Bewegungsempfindlichkeit** respektieren | Barrierefreiheit | `prefers-reduced-motion`: Explosionszeichnung wird ein statisches Bild, keine Schleife. | ✅ |
| T10 | **Tastaturbedienbarkeit** des Reglers | Barrierefreiheit | Unsichtbarer `<input type=range>` über dem Bild. | ✅ |
| T11 | **Schriften selbst gehostet** | KVKK | `public/fonts/`. Google Fonts bricht den Build. Beide Familien tragen Kyrillisch — geprüft, nicht angenommen. | ✅ |
| T12 | **Menü auf Mobil** | implizit | `.mainnav` ist unter 1000 px ausgeblendet — **es gibt kein Mobil-Menü**. | ❌ *(Lücke L1)* |

---

## 6. Auffindbarkeit (SEO)

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| S1 | Sinnvolle `<title>` und Beschreibung je Sprache | Grundlage | `Base.astro`, `desc` je Locale. | ✅ |
| S2 | **Strukturierte Daten** (LocalBusiness / Service / FAQ) | Königsplan, Ziel „Top-3 im Kartenblock" | — | ❌ *(Lücke L2 — **hoch**)* |
| S3 | **`og:image`** — Vorschaubild beim Teilen | implizit, aber zentral | `og:title` und `og:description` sind da, **`og:image` fehlt**. | ❌ *(Lücke L3 — **hoch**)* |
| S4 | `sitemap.xml` + `robots.txt` | Grundlage | — | ❌ *(Lücke L4)* |
| S5 | Favicon | Grundlage | — | ❌ *(Lücke L5)* |
| S6 | **Eigene Seite je Leistung** statt dünner Tag-Archive | Whitespark-Rankingfaktor #1 | Phase B, noch nicht gebaut. Die Altseite hat ~140 dünne Tag-Archive. | ❌ *(Phase B — geplant, keine Lücke)* |

---

## 7. Recht (Produktion, nicht Demo)

| # | Anforderung | Herkunft | Umsetzung | Status |
|---|---|---|---|---|
| R1 | **KVKK** statt DSGVO | Kunde sitzt in der Türkei | `docs/03-recht.md`. Jede Auslandsübermittlung braucht Standardvertrag + 5-Tage-Meldung — **oder alles in der Türkei hosten, dann entfällt Art. 9**. | 🟡 *Architektur beschrieben, nicht umgesetzt (Demo)* |
| R2 | Keine Datenübermittlung ins Ausland | KVKK Art. 9 | Schriften lokal ✅ · kein GA4, kein Meta-Pixel ✅ · **Karte lädt direkt von Google** ❌ | 🟡 *(Lücke L6 — blockiert Livegang, nicht die Demo)* |
| R3 | **Rechtstexte** (KVKK Aydınlatma Metni, Gizlilik, Çerez) | KVKK | Im Fuß **als Text genannt, aber es gibt keine Seiten dahinter**. | ❌ *(Lücke L7 — blockiert Livegang)* |
| R4 | EU AI Act Art. 50 | geprüft | Gilt **nicht**, solange der Besucher in der Türkei ist und der türkische Betrieb den Chat betreibt. Kennzeichnung bleibt freiwillig. | ✅ |

---

## 8. Ehrlichkeits-Sperren (`⛔`)

Der Build listet sie bei jedem Lauf auf. Sie sind **kein Fehler** — sie sind das Gedächtnis des Projekts.

| Gesperrt | Warum | Freigabe durch |
|---|---|---|
| „seit 1998" / „Servicepartner" im Hero | unbelegt | Betrieb |
| „Wir sprechen Deutsch" | Wer genau — Betrieb oder Agentur? | Betrieb |
| Arbeitsgarantie | unbestätigt | Betrieb |
| Echte Montagefotos im Regler | existieren nicht öffentlich | Betrieb |
| Preise | veröffentlicht er keine | Betrieb |

---

## 9. Die Lücken, die diese Prüfung gefunden hat

Nach Wirkung sortiert. **L1–L3 sind neu** — sie standen in keinem Dokument und in keinem Test.

| # | Lücke | Wirkung | Blockiert | Empfehlung |
|---|---|---|---|---|
| **L1** | **Kein Menü auf Mobil.** Die Navigation ist unter 1000 px ausgeblendet. Ein türkischer Besucher am Handy — die Mehrheit — kann **nicht** zum BTU-Rechner, zu den Produkten oder zur Technik springen. Er kann nur scrollen. | **hoch** | nichts formal, aber es kostet Konversion in genau der Zielgruppe | Menü nachrüsten (Burger oder Sprungleiste). Die Sticky-Leiste deckt nur Anruf und WhatsApp ab, nicht die Navigation. |
| **L2** | **Keine strukturierten Daten.** Kein `LocalBusiness`, kein `Service`, kein `FAQ`. | **hoch** | das erklärte 90-Tage-Ziel „Top-3 im türkischen Kartenblock" | `LocalBusiness` mit `biz`-Daten + `aggregateRating` einbauen. Die Daten liegen alle schon in `home.ts`. |
| **L3** | **Kein `og:image`.** Wer den Link auf **WhatsApp** teilt — dem Hauptkanal dieses Marktes — bekommt eine **graue Vorschau ohne Bild**. | **hoch** | nichts formal, aber es entwertet den Kanal, auf den alles ausgelegt ist | Hero-Ladenfoto als `og:image` setzen (1200 × 630). |
| L4 | Kein `sitemap.xml`, kein `robots.txt` | mittel | schnelle Indexierung | `@astrojs/sitemap` |
| L5 | Kein Favicon | niedrig | — | aus dem Achtstern ableiten |
| L6 | **Die Karte lädt direkt von Google** → Datenübermittlung ins Ausland | mittel | **Livegang** (nicht die Demo) | in Produktion: Klick-zum-Laden oder statisches Kartenbild |
| L7 | **Rechtstexte sind Fußzeilen-Wörter ohne Seiten** | mittel | **Livegang** | drei echte Seiten je Sprache; Inhalt aus `docs/03-recht.md` |
| L8 | **Keine Missbrauchsbremse auf `api/chat.js`** | mittel | Produktion (Kostenrisiko) | Rate-Limit je IP, Längenbegrenzung |
| L9 | Achtstern-Trenner (aus Phase A offen) | niedrig | — | Phase B |
| L10 | Keine 404-Seite | niedrig | — | `src/pages/404.astro` |
| L11 | `Phase0.astro` (Debug-Ansicht der Nullsprache) liegt noch im Baum | niedrig | — | vor dem Livegang entfernen |

---

## 10. Fazit der Prüfung

**Alles, was der Auftraggeber ausdrücklich verlangt hat, ist gebaut** — Hook mit Bau-Effekt, Königs-Look, Wow in allen Kapiteln, KI-Assistent mit Freitext, WhatsApp, vier Sprachen, Originalbilder, prominente Sternebewertung, Explosionszeichnung, Vorher-Nachher-Regler. Der Abnahmetest läuft in acht Kombinationen ohne Fehler durch.

**Was fehlt, hat niemand verlangt — es ist trotzdem wichtig.** Drei Dinge sind mir bei dieser Prüfung aufgefallen, die in keinem Dokument standen und die kein Test abgedeckt hat: das **fehlende Mobil-Menü** in einem mobil-dominierten Markt, die **fehlenden strukturierten Daten** für genau das Kartenblock-Ziel, das wir uns selbst gesetzt haben, und das **fehlende Vorschaubild beim Teilen über WhatsApp** — den Kanal, auf den die ganze Seite ausgelegt ist.

Diese drei gehören vor die Vorführung, nicht danach.
