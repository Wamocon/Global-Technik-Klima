# Rechtslage

Stand: 9. Juli 2026. Jede Behauptung wurde von drei unabhängigen Prüfern angegriffen, deren Auftrag es war, sie zu **widerlegen**.
Zwei von drei sind gefallen. Beide standen vorher im Master.

**Dies ist kein Rechtsrat.** Vor dem Livegang gehören diese Punkte zu einem türkischen Anwalt.

---

## 1. EU-KI-Verordnung, Artikel 50 — GEFALLEN (3 von 3 Prüfern)

### Was ich behauptet hatte

> Die Transparenzpflicht nach Artikel 50 der Verordnung (EU) 2024/1689, anwendbar ab 2. August 2026, gilt für den KI-Chat — auch wenn der Kunde in der Türkei sitzt, weil die Agentur in Deutschland sitzt und deutsche Besucher bedient werden. „Im Zweifel offenlegen."

Das war eine Ausrede, keine Rechtsanalyse.

### Was tatsächlich gilt

Der räumliche Anwendungsbereich (Artikel 2 Absatz 1) knüpft **ausschließlich an den Ort** an — nicht an die Staatsangehörigkeit der Nutzer und nicht an den Sitz der bauenden Agentur.

| Anknüpfungspunkt | Trifft hier zu? |
|---|---|
| Art. 2(1)(a) — Inverkehrbringen oder Inbetriebnahme **in der Union** | Nein. Und: Der Anbietersitz wird ausdrücklich für **unerheblich** erklärt. |
| Art. 2(1)(b) — **Betreiber** mit Sitz in der Union | Nein. Betreiber ist das türkische Unternehmen. |
| Art. 2(1)(c) — Anbieter/Betreiber im Drittland, wenn der **Output in der Union verwendet** wird | Nein, solange der Besucher physisch in der Türkei sitzt. |

**Ergebnis:** Ruft ein Nutzer den Chat aus Alanya auf, wird der Output in der Türkei verwendet. Kein Anknüpfungspunkt greift. Artikel 50 ist **nicht anwendbar**. Die bloße weltweite Erreichbarkeit einer Website begründet kein Inverkehrbringen in der Union — Erwägungsgrund 22 verlangt Output, der „zur Verwendung in der Union bestimmt" ist.

Nebenbei: Die Offenlegungspflicht nach Artikel 50 Absatz 1 trifft den **Anbieter**, nicht den Betreiber. Anbieter im Sinne von Artikel 3 Nummer 3 ist, wer das System unter eigenem Namen betreibt — also der türkische Kunde, nicht WAMOCON als Auftragsentwickler.

### Zwei Ausnahmen, die alles ändern

1. **Nutzer aus der EU.** Ruft jemand den Chat auf, während er sich physisch in der Union aufhält, wird der Output in der Union verwendet. Dann könnte Art. 2(1)(c) den türkischen Betreiber für diese Interaktionen erfassen. Auslegungsumstritten; bloße Abrufbarkeit genügt nach herrschender Meinung nicht. Eine weltweit erreichbare Website wird solche Nutzer aber faktisch bedienen — ein deutscher Wohnungsbesitzer, der von Hamburg aus nach seiner Klimaanlage fragt, ist genau dieser Fall.

2. **WAMOCON als Betreiber.** Betreibt die Agentur den Chat unter eigener Verantwortung als gemanagten Dienst — also als *deployer* im Sinne von Artikel 3 Nummer 4 —, dann greift Artikel 2(1)(b) **unabhängig davon, wo der Output verwendet wird**. Weil WAMOCON in der Union niedergelassen ist.

### Konsequenz für die Seite

Die KI-Offenlegung bleibt im Master stehen. **Nicht weil Artikel 50 sie hier verlangt, sondern als freiwilliges Vertrauenssignal.** Das ist ein Unterschied, der in die Dokumentation gehört: Wir bauen keine Compliance-Schwere, die das Gesetz nicht fordert — aber wir nehmen ein billiges Vertrauenssignal mit.

**Zu entscheiden:** Wer betreibt den Chat? Läuft er unter dem Namen und der Verantwortung des türkischen Kunden, bleibt die KI-Verordnung außen vor. Betreibt WAMOCON ihn als Dienstleistung, fällt sie hinein. Das ist eine Vertrags- und Architekturfrage, keine Textfrage.

Quellen: eur-lex.europa.eu (ABl. L 2024/1689) · artificialintelligenceact.eu/article/2 · /article/3 · /article/50

---

## 2. KVKK Artikel 9 — Auslandsübermittlung — GEFALLEN (3 von 3 Prüfern)

### Was ich behauptet hatte

> Der KI-Chat löst KVKK Artikel 9 aus. Der einzige realistische Weg ist der Standardvertrag, binnen fünf Werktagen an die Behörde gemeldet. Ausdrückliche Einwilligung trägt nicht.

Zu absolut, an drei Stellen.

### Was tatsächlich gilt

**Erstens: Artikel 9 greift überhaupt nur, wenn Daten das Land verlassen.** Wird der Chat-Dienst **in der Türkei gehostet**, gibt es keine Auslandsübermittlung und Artikel 9 ist gegenstandslos. Das ist der einfachste Weg, die Pflicht ganz zu vermeiden — und ich hatte ihn nicht einmal erwogen.

**Zweitens: Zwei Bedingungen müssen kumulativ erfüllt sein.**

- (i) ein Verarbeitungsgrund nach Artikel 5 oder 6, **und**
- (ii) ein Übermittlungsmechanismus nach Artikel 9.

Die Vertragserforderlichkeit (Art. 5 Abs. 2 Buchst. c) erfüllt nur (i) und **ersetzt Artikel 9 nicht**. Verarbeitung und Übermittlung sind zwei getrennte Fragen.

**Drittens: Der Standardvertrag ist der praktischste, nicht der einzige Weg.**

| Mechanismus | Für diesen Betrieb? |
|---|---|
| Angemessenheitsbeschluss (`yeterlilik kararı`) | Praktisch unbenutzbar — bis heute für **kein einziges Land** erlassen. |
| Standardvertrag (`standart sözleşme`) | Praktischster Weg. Meldung an die Behörde **binnen fünf Werktagen** nach Unterzeichnung. |
| Zusicherung (`taahhütname`) + vorherige Genehmigung des Kurul | Alternative. Langsamer. |
| Verbindliche Unternehmensregeln (BCR) | Nur für Konzerne. Scheidet aus. |
| Ausnahmen für **gelegentliche** (`arızi`) Übermittlungen, Art. 9 Abs. 6 | Siehe unten. |

**Viertens — und hier lag mein Fehler:** Für **gelegentliche** Übermittlungen tragen sowohl die ausdrückliche Einwilligung nach Risikoaufklärung (Art. 9 Abs. 6 Buchst. a) **als auch** die vorvertragliche Erforderlichkeit (Buchst. b) — **ohne Standardvertrag und ohne Fünf-Tage-Meldung**.

Richtig ist nur: Seit der Novelle durch Gesetz 7499 ist die ausdrückliche Einwilligung **kein allgemeiner Übermittlungsgrund** mehr, sondern stützt nur noch gelegentliche Übermittlungen. Ein dauerhaft laufender Website-Chat, der jede Besuchernachricht ins Ausland schickt, ist eine regelmäßige, systematische Übermittlung. Für ihn scheidet die `arızi`-Schiene aus.

**VERBIS:** Ein kleiner Handwerksbetrieb ist von der Registrierungspflicht meist befreit — unter 50 Beschäftigte **und** Jahresbilanz unter 100 Mio. TL (Kurul-Beschluss 2018/87 in der Fassung 2023/1154). Das entbindet ihn **nicht** von Artikel 9.

**Bußgeld** für die versäumte Meldung des Standardvertrags: 50.000 bis 1.000.000 TL.

### Die Architekturentscheidung, die daraus folgt

Die richtige Reihenfolge ist umgekehrt zu der, die ich vorgeschlagen hatte. Erst die Architektur, dann die Compliance.

| Weg | KVKK Art. 9 | Qualität | Kosten pro Monat |
|---|---|---|---|
| **A · Alles in der Türkei** | **Entfällt** — wenn wirklich *alles* im Land bleibt | Gemma 3 27B oder Qwen 3 30B, selbst gehostet. Türkisch gut, Russisch und Deutsch ordentlich, Werkzeugaufrufe brauchen Nachprüfung. | **180–620 $** (ein warmer GPU-Server: 165–565 $) |
| **B · Statisch im Ausland, Gehirn in der Türkei** | Entfällt für die Chat-Inhalte | Identisch zu A | 180–600 $ |
| **C · Claude über Bedrock Frankfurt** | **Greift.** Standardvertrag + Fünf-Tage-Meldung | Bestes Modell auf allen Achsen | **~22 $** (+10 % EU-Region) |
| **D · Claude direkt über die Anthropic-API** | Greift. Zusätzlich Verarbeitung in den USA | Identisch zu C | ~20 $ |

**Der Preis der Souveränität ist der Faktor zehn.** Nicht in der Rechnung für das Modell, sondern in der Miete für einen GPU-Server, der rund um die Uhr warm laufen muss. Türkische Anbieter vermieten monatlich, nicht sekundengenau; ein Kaltstart eines 27-Milliarden-Modells dauert eine bis anderthalb Minuten. Für einen Chat ist das unbrauchbar.

### Was in der Türkei überhaupt läuft

**Kein Hyperscaler hat eine Region in der Türkei.** AWS betreibt seit dem 20. Mai 2026 eine Istanbul Local Zone — ein Kind der Frankfurter Region, ohne Bedrock. Die Google-Cloud-Region mit Turkcell kommt **2028 bis 2029**. Ein verwaltetes Sprachmodell aus türkischer Hand existiert nicht. Wer in der Türkei hosten will, mietet GPUs und betreibt selbst.

**Und kein türkisches Modell spricht Russisch oder Deutsch.** Kumru, Cosmos, Trendyol-LLM, Turkcell-LLM, T3 AI — alle einsprachig türkisch, allenfalls mit etwas Englisch. Der Cetvel-Benchmark (KUIS-AI, EACL 2026) sagt es unverblümt: *„Turkish-centric instruction-tuned models generally underperform relative to multilingual/general-purpose models."* Der Reflex, türkisch zu kaufen, wäre hier kontraproduktiv.

Was tatsächlich trägt, sind allgemeine offene Modelle mit türkischer Stärke:

| Modell | TurkBench (Jan 2026) | Passt auf | Russisch/Deutsch |
|---|---|---|---|
| Qwen 3 30B-A3B | 73,4 | 24–48 GB | ja, 100+ Sprachen |
| Gemma 3 27B | 73,0 | 24 GB (4 Bit) | ja, 140+ Sprachen |
| Gemma 3 12B | 71,0 | 24 GB | ja |
| Llama 3.1 8B | 45,7 | 24 GB | schwach |

### Die drei Lecks, die auch ein türkisches Modell nicht schließt

Und hier liegt der Befund, der Ihre Entscheidung wirklich betrifft. **Artikel 9 greift nicht nur beim Sprachmodell.** Eine IP-Adresse ist nach dem KVKK-Leitfaden ein personenbezogenes Datum. Jeder ausländische Dienst, der sie auch nur *sieht*, verarbeitet personenbezogene Daten im Ausland.

| Element | Übermittlung? | Was zu tun ist |
|---|---|---|
| **Gmail** | **Ja.** Kurul-Beschluss **2019/157**: Wer Gmail nutzt, speichert Post in Rechenzentren weltweit — das ist eine Auslandsübermittlung nach Artikel 9. | **Die offizielle Adresse des Betriebs ist `alanyaglobalteknik@gmail.com`.** Sie ist selbst nicht konform. Postfach auf die `.com.tr`-Domain in türkisches Hosting. |
| **Google Fonts vom CDN** | Ja, überträgt die IP an Google | Bereits erledigt: Schriften liegen lokal in `public/fonts`. |
| **Google-Maps-Einbettung** | Ja | Erst nach Einwilligung nachladen, oder durch statisches Bild plus Link ersetzen. |
| **Google Analytics** | Ja | Ersatzlos streichen. Selbst gehostete oder türkische Analytik. |
| **Cloudflare oder Vercel als Proxy** | Ja, sie sehen jede Besucher-IP | Der Chat-Endpunkt darf **niemals** über einen ausländischen Proxy laufen. Bei Cloudflare: graue Wolke, kein Proxy. |
| **WhatsApp Business Platform** | Ja — Meta sitzt im Ausland. Die KVKK ermittelt gegen WhatsApp und Meta. | Der schlichte `wa.me`-Deeplink ist vermutlich keine Übermittlung *durch den Verantwortlichen* — der Kunde öffnet seine eigene App. Sobald der Betrieb aber über die Plattform antwortet, ist es eine. Mit ausdrücklicher Einwilligung absichern oder türkischen Live-Chat als Alternative anbieten. |
| **Sentry, Formulare, Datenbank** | Ja, wenn im Ausland | Türkischer VPS, 5–30 $ im Monat. |

**Der Chat-Endpunkt darf kein Proxy sehen.** Ruft das Widget im Browser eine eigene türkische Domain direkt auf, spricht ein Besucher in Alanya mit einem Server in Ankara — die Nachricht verlässt das Land nie. Läuft derselbe Aufruf über eine Vercel-API-Route oder eine orange geschaltete Cloudflare-Domain, geht er zuerst ins Ausland. Der Unterschied ist ein DNS-Schalter, und er entscheidet über die gesamte Rechtslage.

### Meine Empfehlung

**Weg B, der Hybrid.** Die statische Seite läuft auf einem billigen globalen CDN — Schriften selbst gehostet, keine Analytik, keine Karten-Einbettung. Der Chat-Endpunkt und das Modell liegen auf einem warmen türkischen GPU-Server, den der Browser **direkt** anspricht. Die Post zieht von Gmail auf ein türkisches Postfach. WhatsApp bleibt ein `wa.me`-Button.

Damit bleiben alle Chat-Inhalte und die gesamte E-Mail im Land. Es kostet ungefähr dasselbe wie der reine Souveränitäts-Weg und spart den Betrieb eines eigenen Webservers.

**Weg A** wählen Sie nur, wenn „veriniz Türkiye'den çıkmaz" — Ihre Daten verlassen die Türkei nicht — ein ausdrückliches Verkaufsversprechen werden soll. Das ist in Alanya ein besseres Argument, als es in Deutschland wäre.

Zwei Dinge sind vor der Festlegung zu klären: das genaue GPU-Modell, ob dediziert oder geteilt, ISO-27001-Zertifikat und ein unterschriebener Auftragsverarbeitungsvertrag des türkischen Anbieters. Und der aktuelle Lira-Preis — die genannten Dollar-Beträge beruhen auf dem Kurs vom 10. Juli 2026.

Quellen: mevzuat.gov.tr (Gesetz 6698) · kvkk.gov.tr (Yurtdışına Aktarım · Kurul-Beschluss 2019/157 zu Gmail · Kamuoyu-Duyurusu zu WhatsApp · Rehber, IP-Adresse als personenbezogenes Datum) · aws.amazon.com (Istanbul Local Zone, 20.05.2026) · cloud.google.com (Türkiye-Region 2028–2029) · arxiv.org/abs/2601.07020 (TurkBench) · arxiv.org/abs/2508.16431 (Cetvel)

---

## 3. Gree-Garantie — HÄLT (0 von 3 widerlegt)

Bestätigt durch die Primärquelle `gree.com.tr/sayfa/garanti-sartlari`.

| Regelung | Frist |
|---|---|
| Herstellergarantie auf **alle Teile** | 3 Jahre (mindestens 2) |
| **10 Jahre** auf Wandgeräte, **Aphro ausgenommen**, bei Kauf beim autorisierten Händler und **Montage durch den autorisierten Service** | Montage muss **bis 31.07.2026** abgeschlossen sein |
| **6 Jahre** auf I-Shine (Standgerät) und Multisplit | bis 31.12.2026 |
| Maximale Reparaturdauer | 20 Werktage |

Zwei Präzisierungen für die Dokumentation:

1. Die Quelle formuliert „alle Teile sind von der Garantie erfasst" (`tüm parçaları garanti kapsamındadır`). Der **Kompressor wird nicht namentlich genannt**, ist als Teil aber eingeschlossen. Im Werbetext weiterhin sagbar. In einer Rechtszusage wörtlich „alle Teile" zitieren.
2. Kanonische Quelle ist **`gree.com.tr`**. Nicht `tlcklima.com/garanti-sartlari` (liefert HTTP 404) und nicht Händlerspiegel wie `peraklima.com`, die noch das veraltete Enddatum 31.12.2025 zeigen.

**Die Zehnjahresgarantie setzt den `yetkili servis`-Status voraus.** Der ist für diesen Betrieb nicht belegt — belegt ist nur `yetkili bayi`. Bis TLC Klima den Servicestatus schriftlich bestätigt, bleibt das Badge im Master gesperrt. Eine falsche Garantiezusage ist Werbungshaftung.

---

## 4. Was daraus für die Website folgt

| Pflicht | Grundlage | Umsetzung |
|---|---|---|
| Aydınlatma metni | KVKK, Gesetz 6698 | Eigene Seite. Fehlt auf der Altseite vollständig. |
| Çerez-Banner mit echter Wahl | KVKK-Çerez-Rehber | Drei Schaltflächen. „Ablehnen" so leicht erreichbar wie „Akzeptieren". |
| Gizlilik politikası | KVKK | Ersetzt die Aydınlatma metni **nicht**. Beide getrennt vorhalten. |
| İYS-Einwilligung | Türkisches Recht, nur für Werbenachrichten | Erst relevant, wenn WhatsApp-Marketing kommt. Nicht für Serviceantworten. |
| KI-Offenlegung | **Keine Pflicht** (siehe Abschnitt 1) | Bleibt trotzdem. Freiwilliges Vertrauenssignal. |
| Standardvertrag + Fünf-Tage-Meldung | KVKK Art. 9, **nur bei Weg B oder C** | Entfällt bei Weg A. |

Die DSGVO gilt hier nicht. Das BFSG gilt hier nicht. Das DDG gilt hier nicht. Wer diese Gesetze in einem Angebot für einen türkischen Betrieb aufführt, hat den Kunden nicht gelesen.
