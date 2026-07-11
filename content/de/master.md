# Deutscher Master — Alanya Global Teknik

Redaktionssprache. Keine Vorstufe, sondern die deutsche Endfassung.
Fassung 2, nach adversarialer Kritik durch fünf Linsen (49 Befunde, 7 Blocker) und dreifacher Rechtsprüfung.
Stand: 9. Juli 2026 · Grundlage: [Sprachvertrag](../../docs/01-sprachvertrag.md) · [Glossar](../../docs/02-glossar.md) · [Rechtslage](../../docs/03-recht.md)

`tier` = Schicht · `register` = zu erzeugende Wirkung · `→` = Anweisung an die Transkreation
`invariant: true` = Wert kommt aus dem CMS oder aus strukturierten Daten. Nie als Prosa, in keiner Sprache.
`⛔` = gesperrt bis zum schriftlichen Beleg durch den Kunden.

---

## 0 · Seitenkopf

```yaml
meta.title:
  tier: seo
  ⚠: NICHT ÜBERSETZEN. Pro Sprache nativ recherchieren.
  de: "Klimaanlagen in Alanya — Verkauf, Montage & Wartung | Autorisierter Gree-Händler"
  → tr: Muster "{Stadt} {Leistung} {Jahreszahl}". Etwa "Alanya Klima Servisi ve Montajı 2026 | Gree Yetkili Bayi"
  → ru: Muster "{Leistung} {Stadt} {Preis}". Der Preis gehört in den Titel.
  → en: "Air Conditioning in Alanya — Sales, Installation & Service | Authorized Gree Dealer"

meta.description:
  tier: seo
  de: "Autorisierter Gree-Händler in Alanya. Verkauf, Montage und Wartung von Klimaanlagen und Wärmepumpen. Kostenlose Besichtigung, Festpreis vor der ersten Bohrung, Rechnung und ausgefüllte Garantieurkunde."
  ⚠: Keine Keyword-Listen. Die Altseite reiht 17 Varianten aneinander — ein Muster von 2012.

firmenname:
  tier: chrome
  invariant: true
  ⛔: "Alanya Global Teknik" oder "Global Teknik Klima"? Der exakte Handelsname muss beim Kunden
     geklärt und dann überall identisch geführt werden: Footer, LocalBusiness-Schema, Meta, Google, Yandex.
```

---

## 1 · Hero

```yaml
hero.eyebrow:
  tier: chrome
  register: sachlich
  maxLen: 42
  de: "Autorisierter Gree-Händler · Alanya"
  ⛔: "seit 1998" ist unbelegt. Erst nach Handelsregisterauszug ergänzen: "… seit {jahr}".
     Der türkische Kritiker verlangt den Erfahrungs-Anker (`X yıllık tecrübe`) als stärkstes
     Vertrauenselement des Marktes. Eine Jahreszahl, die ein Kunde widerlegt, kippt die ganze Seite.
     Ein erfundener Anker ist schlimmer als gar keiner.
  ⛔: "Vertragshändler" und "Servicepartner" (yetkili servis) sind zwei verschiedene Autorisierungen.
     Belegt ist nur "Händler". Bis TLC Klima den Servicestatus schriftlich bestätigt, steht hier
     nur "Händler" — und das 10-Jahres-Badge unten bleibt gesperrt.

hero.claim:
  tier: stimme
  register: sachlich
  maxLen: 72
  de: "Ihre Klimaanlage in Alanya — Verkauf, Montage und Service aus einer Hand, mit Rechnung."
  ⚠: Der türkische und der russische Kritiker haben unabhängig dieselbe Zeile verworfen.
     Ein Aphorismus an der wichtigsten Stelle der Seite übernimmt keine Verantwortung.
     Die Poesie darf bleiben — eine Zeile tiefer.

hero.claim.sub:
  tier: stimme
  register: warm
  maxLen: 48
  de: "Kühle, nur eine Nachricht entfernt."
  → tr: "Serinlik bir mesaj uzağınızda."
  → ru: "Прохлада — в одном сообщении." Danach sofort eine Zahl.

hero.sub:
  tier: stimme
  register: sachlich
  maxLen: 150
  de: "Die Besichtigung ist kostenlos. Den Festpreis bekommen Sie schwarz auf weiß, bevor wir die erste Bohrung setzen."
  → tr: Kein Preishinweis. Stattdessen `ücretsiz keşif`, `faturalı hizmet`, Telefonnummer, Erreichbarkeit.
  → ru: Hier gehört eine echte Zahl hin. Ohne Zahl liest sich der Satz ausweichend.

hero.cta.primary:
  tier: chrome
  register: dringlich
  maxLen: 26
  de: "Über WhatsApp schreiben"
  → tr: DIE REIHENFOLGE DREHT SICH. Primär "Ücretsiz keşif iste", Telefon gleichrangig daneben.
        Im türkischen Markt ruft man an. Ein WhatsApp-Button ohne gleichwertigen Anruf-Knopf
        verschenkt Vertrauen und Conversion.
  → ru: "Написать в WhatsApp" plus Telegram.

hero.cta.secondary:
  tier: chrome
  register: dringlich
  maxLen: 30
  de: "Kostenlose Besichtigung sichern"
  ⚠: Aktive Form. Nicht "besichtigen lassen" — der Kunde handelt, nicht wir.

hero.telefon:
  tier: chrome
  invariant: true
  festnetz: "+90 242 513 86 51"
  mobil_whatsapp: "+90 533 046 13 87"
  darstellung: "Anruf: {festnetz} · WhatsApp: {mobil_whatsapp}"
  ⚠: Beide Nummern gelabelt, groß, klickbar, in jeder Sprache im Hero.
     In der Türkei IST die sichtbare Nummer das Vertrauenssignal. Auf Mobil immer Klick-zu-Anruf.
  ⛔: Die dritte Nummer +90 532 261 76 92 aus dem Yandex-Eintrag ist ungeklärt.
     Entweder aktivieren und überall durchsetzen, oder aus allen Verzeichnissen entfernen.

hero.badge.warranty:
  tier: fach
  invariant: true
  register: dringlich
  ⛔ GESPERRT: Die Zusage "bei Montage durch den Vertragsservice" setzt den yetkili-servis-Status
     voraus. Der ist nicht belegt. Eine falsche Garantiezusage ist Werbungshaftung.
  fallback_bis_beleg:
    de: "Gree-Herstellergarantie: 3 Jahre auf alle Teile. Maximale Reparaturdauer 20 Werktage."
  ziel_nach_beleg:
    de: "Nur noch {tage} Tage: 10 Jahre Gree-Garantie auf Wandgeräte bei Montage durch unseren Vertragsservice — bis {datum}. Modell {ausgenommenes_modell} ausgenommen."
    auto_fallback_ab: "2026-08-01"
    danach: "6 Jahre Gree-Garantie auf I-Shine und Multisplit bei Montage bis 31.12.2026."
  ⚠: Kanonische Quelle ist gree.com.tr/sayfa/garanti-sartlari. NICHT tlcklima.com (liefert 404),
     NICHT Händlerspiegel (zeigen noch das veraltete Enddatum 31.12.2025).
     Die Quelle sagt "alle Teile" (tüm parçaları). Der Kompressor wird nicht namentlich genannt.
     Im Werbetext sagbar; in einer Rechtszusage wörtlich "alle Teile" zitieren.

hero.temp:
  tier: chrome
  invariant: true
  de: "Gerade in Alanya: {temperatur} °C"
  ⚠: Echte Ortstemperatur. Fällt die Datenquelle aus, verschwindet der Baustein — kein Platzhalter.
```

---

## 2 · Vertrauensleiste

```yaml
trust.dealer:
  tier: fach
  register: sachlich
  de: "Autorisierter Gree-Fachhändler"
  ⛔: "und Servicepartner" erst nach schriftlicher Bestätigung durch TLC Klima.
  → tr: "Gree Yetkili Bayi" — stärkstes Signal des Marktes.
  → ru: "Официальный дилер Gree" — ebenfalls Platz eins.

trust.faturali:
  tier: stimme
  register: sachlich
  de: "Leistung mit Rechnung"
  ⚠: Eigener sichtbarer Chip auf Vertrauensebene, nicht vergraben.
  → tr: "Faturalı hizmet" — das zentrale Gegen-Schwarzarbeit-Signal. Prominent.

trust.rating:
  tier: fach
  invariant: true
  de: "5,0 von 5 Sternen aus {count} Google-Bewertungen"
  ⚠: Aus dem Google-Profil gerendert, an genau einer Stelle, verlinkt aufs Profil.
     KEIN selbstveröffentlichtes AggregateRating im Markup — Google erklärt selbstbewertete
     Rezensionen ausdrücklich für nicht sternchen-fähig.
     Darunter zwei bis drei echte Zitate mit Vorname und Bezirk. Türkisches Original daneben
     stehen lassen: es ist selbst ein Echtheitssignal. Der Betrieb muss sie einholen. Nichts erfinden.

trust.language:
  tier: stimme
  register: warm
  de: "Deutsch spricht bei uns ein Mensch, kein Übersetzer im Handy. Rufen Sie an oder schreiben Sie per WhatsApp — die Antwort kommt auf Deutsch."
  ⛔: Wer genau spricht Deutsch? Läuft die Beratung nur über die Agentur, muss es präzise heißen
     "Beratung auf Deutsch über WhatsApp" — nicht pauschal "Wir sprechen Deutsch".
     Die deutsche Kernangst ist die Übersetzungs-App. Ein falsches Versprechen bestätigt sie.
  → ru: "Говорим по-русски", direkt an die Nummer gekoppelt. Zweitstärkstes Signal nach dem
        Händlerstatus, noch vor Garantie und Preis.
  → tr: entfällt. Türkisch ist die Standardsprache.

trust.invoice:
  tier: stimme
  register: sachlich
  de: "Sie bekommen eine offizielle e-Arşiv-Rechnung auf Ihren Namen und eine vollständig ausgefüllte Garantieurkunde — mit Seriennummer, Montagedatum und unserem Stempel. Beides schicken wir per WhatsApp. Es gibt keinen Preis ohne Rechnung."
  ⚠: Klingt banal, ist es nicht. In deutschen Alanya-Foren ist die korrekt ausgefüllte
     Garantieurkunde eine wiederkehrende Sorge.
  → ru: Ergänzt den Vertrag: «Работаем по договору — объём работ, цена и срок гарантии.»

trust.emergency:
  tier: chrome
  de: "Jeden Tag erreichbar — in der Saison Rückruf am selben Tag."
  ⛔: Reale Zeiten und Notdienst erheben. "7/24" ist das türkische Markt-Idiom und wirkt stärker
     als "7 Tage" — aber nur schreiben, wenn es stimmt. Sonst "Her gün yanınızdayız."
```

---

## 3 · Garantie — neuer eigener Block

Der schwerwiegendste Befund: Der Master nannte nur die Garantie auf das **Gerät**. Die Garantie auf die eigene **Arbeit** steht an dritter Stelle der russischen Vertrauensreihenfolge und ist zugleich die Antwort auf die deutsche Wandschaden-Angst.

```yaml
garantie.arbeit:
  tier: stimme
  register: sachlich
  de: "Garantie auf unsere Montage: 1 Jahr. Tropft nach unserer Installation etwas oder löst sich eine Halterung, kommen wir und machen es kostenlos neu."
  ⛔: Ein Jahr Arbeitsgarantie mit dem Betrieb bestätigen. Der russische Wettbewerber gibt genau das.

garantie.geraet:
  tier: fach
  invariant: true
  de: "Auf die Gree-Technik: 3 Jahre Herstellergarantie auf alle Teile. Maximale Reparaturdauer 20 Werktage."

garantie.matrix:
  tier: fach
  invariant: true
  ⚠: Eine einzige Matrix aus dem CMS, mit sichtbarem Stand-Datum, überall referenziert.
     Nie zweimal getippt.
  werte:
    standard: "3 Jahre, alle Teile"
    wandgeraet_aktion: "10 Jahre bei Montage bis {datum}, {ausgenommenes_modell} ausgenommen"
    ishine_multi: "6 Jahre bei Montage bis 31.12.2026"
    reparaturdauer: "20 Werktage"
```

---

## 4 · Leistungen

Sechs Blöcke, je eine eigene Seite.

```yaml
service.montage:
  tier: fach
  register: sachlich
  titel: "Montage"
  de: "Wir liefern, montieren und nehmen Ihre Anlage in Betrieb: Bohrung, Leitungen, Kondensatablauf, Vakuumieren, Probelauf. Vor dem Bohren suchen wir nach Leitungen und decken ab. Beschädigen wir dabei Fliese, Rohr oder Putz, bringen wir es auf unsere Kosten in Ordnung — das steht so in Ihrem Angebot. Wir hinterlassen saubere Arbeit."
  ⚠: Der alte Satz endete mit "…und eine saubere Wand, wenn wir gehen." Das ist deutsche Ironie.
     Auf Türkisch liest sich das Augenzwinkern als Unverbindlichkeit. Der Kunde soll die Zusage
     hören, nicht den Witz. Wandschäden sind die häufigste Beschwerde auf sikayetvar.com.

service.wartung:
  tier: fach
  titel: "Wartung"
  de: "Regelmäßige Wartung hält die Anlage effizient und langlebig. Wir reinigen Filter und Wärmetauscher, prüfen den Kältemittelstand und messen die Leistung."
  → tr: KEIN "kann sinnvoll sein". Türkisch verlangt `şart` — notwendig.
        "Klimanızın uzun ömürlü ve verimli çalışması için düzenli bakım şart."

service.reinigung:
  tier: fach
  titel: "Reinigung"
  de: "Innengerät, Filter, Lamellen, Kondensatwanne. Nach dem Winter und vor der Saison."
  → ru: Hier gehört der Preis in die Überschrift. Der Wettbewerber macht genau das.

service.kaeltemittel:
  tier: fach
  titel: "Kältemittel nachfüllen"
  de: "Kühlt die Anlage schwächer als früher, fehlt meist Kältemittel. Wir suchen zuerst die Leckage, dann füllen wir auf."
  ⚠: Nie "Kühlmittel". Ein Kühlmittel transportiert Wärme; ein Kältemittel erzeugt Kälte.
  → tr: Überschrift `Gaz Dolumu`. `Soğutucu akışkan` nur im Datenblatt.
  → ru: Überschrift «Заправка фреоном». `Хладагент R32` nur im Datenblatt.

service.reparatur:
  tier: fach
  titel: "Reparatur"
  de: "Erst die Diagnose, dann der Kostenvoranschlag, dann die Reparatur. Originalteile von Gree. Die Anfahrt zur Diagnose ist in Alanya kostenlos; berechnet werden erst Arbeit und Teile, nach Ihrer Freigabe."
  ⛔: Kostenlose Anfahrt mit dem Betrieb bestätigen.

service.waermepumpe:
  tier: fach
  invariant: true
  titel: "Wärmepumpen"
  de: "Gree Versati für Heizung, Kühlung und Warmwasser. Split von {kw_split_min} bis {kw_split_max} kW, Monoblock bis {kw_mono_max} kW, Vorlauf bis {vorlauf} °C."
```

---

## 5 · Produkte

```yaml
produkt.intro:
  tier: stimme
  register: sachlich
  de: "Wir führen das aktuelle Gree-Programm. Welches Gerät zu Ihrem Raum passt, sagen wir Ihnen klar vor dem Kauf — keine Überraschung hinterher."
  ⚠: Der alte Satz sagte "…nicht erst nach dem Kauf". Das ist ein Seitenhieb auf den Wettbewerb
     und klingt auf Türkisch defensiv oder wie eine Unterstellung gegen den Kunden.

produkt.wand:
  tier: fach
  invariant: true
  titel: "Wandgeräte"
  linien: [Aphro, Pular, Fairy, Airy]
  de: "Aphro für den Einstieg, Pular mit WLAN, Fairy mit Cold-Plasma-Luftreinigung, Airy für kleine Räume. Alle mit Inverter und Kältemittel R32."
  ⚠: Legacy-Namen Amber, Bora, Lomo, G-Tech, Soyal, Muse, Clivia stehen nicht mehr im türkischen
     Katalog. Nicht bewerben.

produkt.standtruhe:
  tier: fach
  invariant: true
  titel: "Standgeräte"
  de: "I-Shine mit 24.000 BTU für große Wohnräume. Standardgeräte mit 24.000 und 48.000 BTU. Sechs Jahre Garantie bei Montage bis 31.12.2026."
  → tr: Rubrik heißt `Salon Tipi Klima`. Niemals `yer tipi`. Es ist ein Standgerät, keine Deckenkassette.

produkt.multi:
  tier: fach
  invariant: true
  titel: "Multisplit"
  de: "Gree Free Match: bis zu fünf Innengeräte an einer Außeneinheit. Wand, Kassette, Kanal oder Konsole."

produkt.gewerbe:
  tier: fach
  invariant: true
  titel: "Gewerbe"
  de: "Kassettengeräte von 18.000 bis 48.000 BTU, Kanalgeräte bis 60.000 BTU. VRF-Systeme GMV5 und GMV6."
  ⚠: VRF nur auf den Gewerbeseiten. Der Privatkunde kennt das Wort nicht und tippt es nie.
  ⛔: Kältemittel je Reihe erst nach Bestätigung durch TLC ausweisen. Belegt ist nur: Wandgerät = R32.

produkt.taksit:
  tier: stimme
  register: warm
  de: "Ratenzahlung möglich — die ganze Wohnung auf einmal, Sie zahlen in Raten."
  ⛔: Konditionen mit dem Betrieb bestätigen. `vade farksız` (zinsfrei) nur schreiben, wenn es stimmt.
  → ru: «рассрочка без переплаты» — starker Verkaufshebel.
```

---

## 6 · Klima-Berater

```yaml
rechner.position:
  ⚠: Nach oben ziehen, vor oder in die Produkte. Er ist ein Lead-Werkzeug, keine Fußnote.

rechner.titel: { tier: stimme, register: warm, de: "Welche Größe braucht Ihr Raum?" }

rechner.hinweis:
  tier: fach
  de: "Das ist ein Näherungswert. Die genaue Auslegung machen wir vor Ort bei der kostenlosen Besichtigung."
  ⚠: Eine Relativierung, nicht zwei. Der alte Text sagte "ein Überschlag, kein Auslegungsnachweis"
     — ein doppelter deutscher Ingenieurs-Disclaimer, der auf Türkisch das eigene Werkzeug entwertet.
     Sofort in die kostenlose Besichtigung drehen.

rechner.frage.flaeche:  { tier: chrome, de: "Wie groß ist der Raum?" }
rechner.frage.personen: { tier: chrome, de: "Wie viele Personen halten sich dort auf?" }
rechner.frage.sonne:    { tier: chrome, de: "Liegt der Raum nach Süden oder unter dem Dach?" }

rechner.ergebnis:
  tier: fach
  invariant: true
  de: "Empfehlung: {btu} BTU. Für Alanya rechnen wir eine Klasse höher — Küstenklima, hohe Sonne. Welches Gree-Modell dazu passt und was es kostet, sagen wir Ihnen in der kostenlosen Besichtigung."
  formel: "BTU/h = Zonenkoeffizient × m² + (Personen × 600), Klimazone Akdeniz"

rechner.cta:
  tier: chrome
  register: dringlich
  de: "Ergebnis per WhatsApp senden"
  ⚠: Deeplink mit vorbefülltem Text: BTU, Raumgröße, empfohlene Linie.
     Der Rechner endet nicht in einer Zahl, sondern in einem Gespräch.
```

---

## 7 · Fernservice — neuer Block, nur DE und EN

Die Antwort auf die Frage, die jeder deutsche Wohnungsbesitzer in Alanya stellt und die kein Wettbewerber beantwortet.

```yaml
fernservice.titel:
  tier: stimme
  register: warm
  de: "Sie sind in Deutschland, Ihre Anlage in Alanya?"

fernservice.text:
  tier: stimme
  register: warm
  de: "Fällt Ihre Klimaanlage im August aus, während Sie zu Hause sind, genügt ein Anruf oder eine WhatsApp. Wir stimmen den Schlüssel mit Ihrem Mieter, Nachbarn oder der Hausverwaltung ab, fahren zur Wohnung und schicken Ihnen Fotos, Diagnose und Kostenvoranschlag auf Deutsch. Sie geben grünes Licht und zahlen per Überweisung oder Karte. Sie müssen dafür nicht im Land sein."
  ⛔: Reaktionszeit mit dem Betrieb bestätigen, bevor eine Zahl genannt wird.
  → tr: entfällt. → ru: sinngemäß übernehmen, russische Hausverwaltungen sind derselbe Fall.
```

---

## 8 · Abdeckung

```yaml
abdeckung.text:
  tier: fach
  de: "Wir fahren in ganz Alanya: Mahmutlar, Oba, Kestel, Tosmur, Kargıcak, Avsallar und Zentrum."
  ⚠: Eigene Bezirksseiten für die lokale Suche — aber nur mit echtem, eigenem Inhalt je Bezirk.
     Googles Spam-Richtlinien nennen wörtlich "Seiten, die auf bestimmte Regionen oder Städte
     ausgerichtet sind und Nutzer auf eine einzige Seite leiten" als Verstoß.
     Kein Copy-Paste mit ausgetauschtem Ortsnamen. Die Altseite hat davon 140 Stück.
  → ru: Bezirke in kyrillischer Schreibweise: Махмутлар, Оба, Кестель, Тосмур, Каргыджак, Авсаллар.
```

---

## 9 · Notdienst

```yaml
notdienst.leiste:
  tier: chrome
  register: dringlich
  de: "Anlage defekt? Sofort anrufen: {mobil_whatsapp}"
  ⚠: Sticky auf Mobil, im Daumenbereich. Der Pfad "Anlage kaputt, 38 Grad, jetzt" fehlte komplett.
  → tr: "Arıza / Acil servis" · → ru: «Срочный ремонт»
```

---

## 10 · Über uns

```yaml
ueber.titel:
  tier: stimme
  register: warm
  de: "Mitten in Alanya"
  ⚠: Die Adresse stand vorher als Überschrift und noch einmal im Kontaktblock. Invariante Werte
     werden einmal gepflegt und überall referenziert.

ueber.text:
  tier: stimme
  register: warm
  de: "Sie finden uns im Zentrum von Alanya. Kommen Sie vorbei, sehen Sie sich die Geräte an, sprechen Sie mit dem Monteur, der später bei Ihnen bohrt."
  ⚠: Die physische Adresse ist in der Türkei ein Seriositätsanker. Sie steht ausgeschrieben,
     nicht nur in der Karte.
  → tr: Selbstbewusst. Kein "kleiner Betrieb". Erfahrung und Autorisierung stehen voran.

ueber.team:
  tier: stimme
  register: warm
  de: "Unsere Monteure arbeiten eingespielt zusammen. Kommen Sie vorbei und sprechen Sie mit dem Mann, der später bei Ihnen bohrt."
  ⛔: "Sie tragen unseren Namen auf dem Hemd" erst, wenn es Teamfotos in gebrandeter Kleidung gibt.
     Echte Fotos mit Namen. 78 % der Handwerkerseiten haben kein Inhaberfoto — der billigste Unterschied.
```

---

## 11 · Kontakt

```yaml
kontakt.titel: { tier: chrome, de: "Schreiben Sie uns" }

kontakt.kanaele:
  tier: chrome
  de: ["WhatsApp", "Anruf", "Rückruf auf Deutsch"]
  → tr: ["Ara", "WhatsApp"] — Anruf gleichrangig, oft bevorzugt.
  → ru: ["WhatsApp", "Telegram"] — Telegram-Handle sichtbar. Zugezogene bevorzugen Chat.

kontakt.mail:
  tier: chrome
  invariant: true
  wert_alt: "alanyaglobalteknik@gmail.com"
  ⚠: Auf der Altseite steht dort ein ungültiger String mit falsch geschriebener Domain.
  ⛔ GESPERRT: Die echte Adresse ist ein Gmail-Konto. Nach Kurul-Beschluss 2019/157 ist die
     Nutzung von Gmail selbst eine Auslandsübermittlung nach KVKK Artikel 9 — Post landet in
     Rechenzentren weltweit. Wer den ganzen Datenpfad in der Türkei halten will, kann diese
     Adresse nicht auf der Seite führen.
     Vor dem Livegang: Postfach auf die eigene Domain, in türkischem Hosting.
     Zielform: "info@alanyagreeyetkilibayi.com.tr"

kontakt.adresse:
  tier: chrome
  invariant: true
  wert: "Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya"
  geo: [36.5509274, 32.0081833]
  ⛔: Geokoordinaten gegen den realen Ladeneintrag prüfen.

kontakt.formular:
  tier: chrome
  ⚠: Niemals die primäre Handlung. In der Türkei ruft man an oder schreibt über WhatsApp.
     Ein Formular als einziger Weg ist ein Misstrauensauslöser.
```

---

## 12 · Der KI-Assistent

Die Wissensbasis bleibt deutsch. Claude antwortet in der Sprache des Besuchers. Nur diese Oberflächentexte werden übersetzt.

```yaml
chat.rolle:
  ⚠: Der Bot dient, der Mensch führt. Der KI-Chat darf nicht das Gesicht des deutschsprachigen
     Service werden — das bestätigt genau die deutsche Kernangst ("Übersetzungs-App statt Mensch").

chat.launcher: { tier: chrome, maxLen: 24, de: "Fragen? Schreiben Sie." }

chat.disclosure:
  tier: chrome
  register: sachlich
  de: "Sie schreiben mit einem KI-Assistenten. Für Angebot, Termin oder eine Garantiefrage verbinde ich Sie mit einem Menschen — deutschsprachig, jederzeit."
  ⚠: RECHTLICHE KORREKTUR. Artikel 50 der EU-KI-Verordnung ist hier NICHT anwendbar, solange
     der Besucher sich physisch in der Türkei aufhält und der türkische Betrieb das System betreibt.
     Die Offenlegung bleibt trotzdem stehen — als freiwilliges Vertrauenssignal, nicht als Pflicht.
     Details und die Ausnahme siehe docs/03-recht.md.

chat.begruessung:
  tier: stimme
  register: warm
  de: "Guten Tag. Welchen Raum möchten Sie kühlen?"

chat.uebergabe:
  tier: chrome
  register: dringlich
  de: "Soll ich das an WhatsApp übergeben?"

chat.systemprompt:
  tier: fach
  werkzeuge:
    - kuehllast(flaeche, personen, sonne) → BTU
    - geraeteempfehlung(btu) → Gree-Linie
    - preisspanne(leistung) → aus strukturierten Daten, nie aus Prosa
    - garantie_matrix() → aus dem CMS, mit Stand-Datum
    - whatsapp_uebergabe(kontext)
    - an_menschen_uebergeben(grund)
  regeln:
    - Preise, kW, BTU, Modellnummern und Garantiefristen kommen aus Werkzeugen. Prosa halluziniert.
    - Kundenwort im Gespräch, Fachwort im Datenblatt. Türkisch `klima gazı`, nicht `soğutucu akışkan`.
      Russisch «фреон», nicht «хладагент».
    - Niemals «кондей». Niemals "Kühlmittel". Niemals "Instandhaltung".
    - Keine Garantiezusage ohne Datum. Fristen ändern sich.
    - Niemals behaupten, ein Mensch zu sein.
```

---

## 13 · Blockvarianten

Der einzige Ort, an dem die vier Sprachen strukturell auseinanderlaufen. Zwei unabhängige Kritiker haben denselben Baustein als tödlich markiert — aus entgegengesetzten Gründen.

```yaml
block.preis:
  position: nach den Leistungen, vor den Referenzen
  tr:
    component: KesifCta
    inhalt: "Ücretsiz keşif · faturalı hizmet · sichtbare Telefonnummer. Kein Preis."
    grund: "Türkische Wettbewerber nennen bei Montage und Wartung keinen Preis. Ein vorschnell genannter Preis wirkt unseriös."
  ru:
    component: PreisAbListe
    inhalt: "Reinigung ab {preis_reinigung} ₺. Montage schlüsselfertig inkl. Material ab {preis_montage} ₺. Anfahrt zum Aufmaß kostenlos."
    grund: "Ein fehlender Preis liest sich als Betrugssignal. Der Wettbewerber master-alanya.com schreibt ihn in die H1."
    ⛔: Echte Zahlen vom Betrieb. Die 1.400 ₺ des Wettbewerbers sind Marktanker, keine Vorlage.
  de:
    component: FestpreisListe
    inhalt: |
      Im Festpreis enthalten: Lieferung, Innen- und Außengerät, Wandhalterung, eine Kernbohrung,
      bis 3 m Kältemittelleitung, Kondensatablauf, Vakuumieren, Befüllen, Probelauf und Mitnahme
      des Altgeräts. Braucht Ihre Wohnung mehr — längere Leitung, zweite Bohrung, Gerüst —, steht
      der Aufpreis im Angebot, bevor wir bohren. Keine Position taucht erst auf der Rechnung auf.
    grund: "Deutsche Alanya-Foren drehen sich um genau zwei Fragen: Ist Montage im Preis? Wird die Garantieurkunde korrekt ausgefüllt?"
    ⛔: Leistungsumfang mit dem Betrieb abgleichen.
  en:
    component: FestpreisListe
  ⚠: Der russische Preis darf NIE in die türkische Variante bluten.

block.sprache:
  position: Vertrauensleiste
  ru: { component: SprachBadge, inhalt: "Говорим по-русски" }
  de: { component: SprachBadge, inhalt: "Deutschsprachige Beratung" }
  en: { component: SprachBadge, inhalt: "We speak English" }
  tr: { component: null, grund: "Türkisch ist die Standardsprache. Ein Badge wäre sinnlos." }

block.fernservice:
  position: vor dem Kontakt
  de: { component: Fernservice }
  en: { component: Fernservice }
  tr: { component: null }
  ru: { component: Fernservice }
```

---

## 14 · Wo die Kritiker sich widersprachen

| Konflikt | Auflösung |
|---|---|
| Preis zeigen (RU) gegen Preis verschweigen (TR) | **Blockvariante.** Strukturelle Weiche, kein Registerproblem. |
| Superlativ (TR) gegen nüchterne Präzision (RU, DE) | **Register.** Dieselbe Sachaussage, je Sprache anders laut gedreht. |
| Poetischer Claim (Master) gegen handfesten Claim (TR + RU) | **Im Master gelöst.** Die tragende Zeile wird konkret, die Poesie sinkt zur Unterzeile. |
| Nur WhatsApp gegen Anruf (TR) gegen Telegram (RU) | **Locale-Konfiguration.** Die sichtbare Nummer bleibt überall Vertrauenssignal. |

**Kurzregel: Preis und Kanal sind Blockvariante. Ton, Lautstärke und Superlativ sind Register.**

Was der Master **nicht** übernimmt, obwohl ein Kritiker es fordert:

1. Der türkische Erfahrungs-Anker wird **nicht auf Zuruf** gesetzt. „Seit 1998" ist unbelegt.
2. Die türkische Superlativ-Norm wird **nicht der Default-Ton** des Masters. Der deutsche Käufer ist superlativ-allergisch; der russische misstraut aufgeblasenen Behauptungen. Der Superlativ ist eine türkische Registerentscheidung.
3. Der KI-Chat wird **nicht der erste Kontakt** für deutschsprachige Kunden.

---

## 15 · Vier Fragen an den Kunden

Ohne diese vier Antworten ist der Master nicht freigabefähig. Alles andere kann ich schreiben.

1. **Sind Sie autorisierter Gree-Vertragsservice** (`yetkili servis`), nicht nur Händler? Schriftlich von TLC Klima. Ohne diesen Beleg fällt das Zehnjahres-Garantie-Badge weg — das stärkste Verkaufsargument der Seite, mit einer Frist bis zum 31. Juli.
2. **Seit welchem Jahr arbeiten Sie in Alanya?** Belegbar. Der Erfahrungs-Anker ist im türkischen Markt das stärkste Vertrauenselement.
3. **Was kosten Montage und Reinigung mindestens?** Der russische Markt geht ohne diese Zahl nicht live.
4. **Wer spricht Deutsch — ein Mensch bei Ihnen, oder läuft es über uns?** Die Antwort ändert einen Satz und die gesamte Glaubwürdigkeit.

## 16 · Abnahme

- [ ] Die vier Fragen sind schriftlich beantwortet
- [ ] Kein `⛔` mehr offen
- [ ] Kein invarianter Wert steht in der Prosa
- [ ] Garantiefristen am Livetag gegen `gree.com.tr/sayfa/garanti-sartlari` geprüft
- [ ] Firmenname überall identisch: Footer, Schema, Meta, Google, Yandex
- [ ] Pseudo-Sprache läuft ohne Überlauf durch alle Ansichten
- [ ] Kein `toUpperCase()` im Quelltext
