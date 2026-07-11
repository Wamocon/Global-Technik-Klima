# Der Sprachvertrag

Verbindliche Grundlage für alle vier Sprachfassungen von `alanyagreeyetkilibayi.com.tr`.
Stand: 9. Juli 2026 · Redaktionssprache: Deutsch · Standardsprache der Seite: Türkisch

---

## 1. Die vier Entscheidungen, getrennt gehalten

| Entscheidung | Festlegung |
|---|---|
| Redaktionssprache (worin gedacht und geschrieben wird) | **Deutsch** |
| Standardsprache der Seite (`lang`, `x-default`, Wurzel-URL) | **Türkisch** |
| Bau-Reihenfolge | Deutscher Master zuerst, vollständig, dann einmalig übersetzt |
| Launch | Niemals Deutsch allein. Türkisch und Deutsch gehen gemeinsam live. |

Grund für die deutsche Redaktionssprache: Es ist die einzige der vier Sprachen, in der das Team einen schlechten Satz von einem guten unterscheiden kann. Jede Strukturentscheidung fällt dort, wo Urteilsfähigkeit besteht.

Grund für den einmaligen Übersetzungsdurchlauf: Solange die Prosa wandert, wandert die Übersetzung mit. Deshalb wird **die Struktur eingefroren, nicht die Prosa** — und übersetzt wird erst nach der Abnahme des deutschen Masters.

## 2. URL- und Sprachrouting

```
/                       → TR  (Standardsprache, ohne Präfix, x-default)
/hizmetlerimiz          → TR  (Bestands-URL bleibt erhalten)
/de/leistungen          → DE
/ru/uslugi              → RU
/en/services            → EN
```

Astro-Konfiguration:

```js
i18n: {
  defaultLocale: 'tr',
  locales: ['tr', 'de', 'ru', 'en'],
  routing: {
    prefixDefaultLocale: false,   // Türkisch bleibt an der Wurzel
  },
}
```

Regeln:

- `hreflang` wird **von Hand** im gemeinsamen Layout erzeugt. Astro 7 hat es nicht eingebaut; `@astrojs/sitemap` schreibt es nur in die `sitemap.xml`, nicht in den `<head>`.
- **Gegenseitigkeit ist Pflicht.** Jede Seite listet sich selbst und alle Schwesterseiten. Fehlt ein Rückverweis, ignoriert Google die gesamte Gruppe.
- Nur ISO 639-1 (Sprache) und ISO 3166-1 Alpha-2 (Region). `UK`, `EU`, `UN` sind ungültig.
- `x-default` zeigt auf die türkische Wurzel.
- Achtung bei Astro 6 → 7: `redirectToDefaultLocale` steht jetzt auf `false` und setzt `prefixDefaultLocale: true` voraus. Ältere Anleitungen liegen falsch.

## 3. Die vier Inhaltsschichten

Jeder Textbaustein trägt genau eine Schicht. Die Schicht entscheidet, **wer** ihn in die anderen Sprachen bringt und **wie**.

| Schicht | Beispiel | Verfahren | Übersetzbar? |
|---|---|---|---|
| `chrome` | Buttons, Labels, Fehlermeldungen, Formularfelder | Übersetzen | ja |
| `fach` | Leistungsbeschreibungen, technische Daten, Wartungsumfang | Übersetzen mit Bindung an das Glossar | ja, aber terminologiegebunden |
| `stimme` | Hero, Claims, Vertrauenstexte, Über-uns | **Transkreieren** — Wirkung nachbauen, nicht Wörter | nein |
| `seo` | Title, Meta-Description, Slug, H1, Keyword-Cluster | **Nativ recherchieren** | **niemals** |

Die vierte Schicht ist der häufigste Projektfehler. Ein wörtlich übersetzter Suchbegriff trifft die Sprache nicht, in der Menschen suchen. Eine übersetzte Seite rankt für nichts.

## 4. Schema eines Textbausteins

```yaml
key: hero.claim
tier: stimme            # chrome | fach | stimme | seo
register: warm          # warm | technisch | dringlich | sachlich
maxLen: 48              # Zeichen; gilt für die längste Sprachfassung
invariant: false        # true = darf in keiner Sprache verändert werden
glossary: [serinlik]    # gebundene Begriffe, die aus dem Glossar kommen müssen
de: "Kühle, nur eine Nachricht entfernt."
tr: ~                   # wird in Phase 3 transkreiert
ru: ~
en: ~
```

**`register` ist kein Kommentar, sondern eine Anweisung.** Deutsche Werbesprache lebt vom Understatement, türkische von Wärme und Superlativ. Ein wörtlich übertragener deutscher Satz liest sich auf Türkisch kalt und arrogant. Das Register sagt der Transkreation, welche Wirkung sie zu erzeugen hat — nicht, welche Wörter sie zu benutzen hat.

**`invariant: true`** gilt für: Preise, kW-Werte, BTU-Klassen, Gree-Modellnummern, Telefonnummern, Adresse, Kältemittelbezeichnungen (R32, R410A). Diese Werte kommen aus strukturierten Daten und werden **nie** als Prosa geschrieben — weder von Menschen noch vom KI-Assistenten.

## 5. Der KI-Assistent braucht keine Übersetzung

Die Wissensbasis bleibt **deutsch**. Claude antwortet in der Sprache des Besuchers. Die teuerste aussehende Komponente ist die einzige, die von Mehrsprachigkeit nicht betroffen ist.

Zwei Bedingungen, ohne die es nicht trägt:

1. **Das Glossar wird im Systemprompt gebunden.** Sonst heißt „Wärmepumpe" mal `ısı pompası`, mal `sıcaklık pompası` — und der Kunde merkt, dass keine Fachkraft schreibt.
2. **Invariante Fakten kommen aus Werkzeugen, nicht aus Prosa.** Preise, Leistungsdaten und Modellnummern reicht der Assistent aus strukturierten Daten durch. Prosa halluziniert. Ein Werkzeugaufruf nicht.

## 6. Technische Leitplanken (geprüft, nicht angenommen)

| Regel | Begründung |
|---|---|
| Großschreibung **nur** über CSS `text-transform` bei gesetztem `lang` | Vom CSS-Text-Standard vorgeschrieben, in allen Engines seit 2014, per Web-Platform-Test abgesichert. `lang="tr"` erzeugt korrekt `i → İ`. |
| **`toUpperCase()` / `toLowerCase()` in JavaScript sind verboten** | `'İSTANBUL'.toLowerCase()` liefert `i` plus Kombinationspunkt — einen kaputten String. `'ISI'.toLowerCase() === 'ısı'` ergibt `false`. Nur `toLocaleUpperCase('tr')`. |
| Sortieren ausschließlich mit `Intl.Collator('tr')` | Standard-`sort()`: `iyi zebra çam ölçü ısı şap`. Türkisch korrekt: `çam ısı iyi ölçü şap zebra`. |
| Türkische Slugs nach ASCII transliterieren (`ı→i`, `ş→s`, `ğ→g`, `ö→o`, `ü→u`, `ç→c`) | Einhellige türkische Praxis. Google ist technisch neutral; die Norm kommt aus der Werkzeugkette. |
| Schriften müssen `İ ı ş ğ ç ö ü` **und** Kyrillisch enthalten | Geprüft: Cormorant Garamond liefert `latin`, `latin-ext`, `cyrillic`, `cyrillic-ext`. Jost liefert `latin`, `latin-ext`, `cyrillic`. Beide tragen. |
| Layout **fluid**, nicht „gegen Deutsch" gebaut | Die Textausdehnung hängt an der Länge des Ausgangsstrings, nicht an der Zielsprache: unter zehn Zeichen 200–300 %, über siebzig Zeichen 130 %. Kurze Labels sind die Gefahr, nicht Absätze. |

Falsch und deshalb ausdrücklich verworfen:

- **„Chrome DevTools hat eine Pseudo-Sprache."** Hat es nicht. Das ist ein Android-Feature. DevTools überschreibt nur echte Locales.
- **„Kyrillische URLs werden zu Punycode."** Nein. Punycode gilt nur für Domainnamen. Pfadsegmente werden prozentkodiert.
- **„Deutsch ist der Worst Case fürs Layout."** Überzogen. Bei kurzen Strings liegt Italienisch mit Faktor 3,0 vor Deutsch mit 2,8. Deutsch hat ein spezifisches Problem — unteilbare Komposita.

## 6a. Varianten: wenn Übersetzen nicht reicht

Die Marktrecherche hat einen Fall gefunden, den kein Übersetzungsprozess lösen kann:

- **Türkische Kunden** erwarten bei Dienstleistungen **keinen Preis**. Stattdessen `ücretsiz keşif` — kostenlose Besichtigung — und die Telefonnummer. Ein vorschnell genannter Servicepreis wirkt unseriös.
- **Russische Kunden** lesen einen **fehlenden Preis als Betrugssignal**. Der Wettbewerber in Alanya schreibt ihn in die Überschrift: „Чистка кондиционеров в Аланье 1400 лир".

Dasselbe Feld, gegensätzliche Erwartung. Deshalb kennt das Content-Modell neben Textbausteinen auch **Blockvarianten**:

```yaml
block: preis
variants:
  tr:  { component: KesifCta,      note: "Kein Preis. Kostenlose Besichtigung + Telefon." }
  ru:  { component: PreisAbListe,  note: "Preise als 'от X TL', sichtbar, oben." }
  de:  { component: InklusivListe, note: "Montage und Lieferung inklusive. Garantieunterlagen." }
  en:  { component: InklusivListe }
```

Regeln:

- Eine Variante darf **den Komponententyp wechseln**, nicht die Position auf der Seite. Die Informationsarchitektur bleibt über alle Sprachen identisch — sonst zerfällt `hreflang`.
- Jede Variante braucht eine Begründung aus der Recherche im Feld `note`. Keine Variante aus Bauchgefühl.
- Varianten sind teuer. Wer mehr als fünf davon hat, hat vermutlich vier Websites gebaut, nicht eine.

## 7. Phasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 · Nullsprache** | Seite ohne Prosa bauen. Alle Schlüssel mit Pseudo-Sprache füllen: +40 % Länge, `İ ı ş ğ` und Kyrillisch eingestreut. Werkzeug: npm `pseudo-localization`. | Layout, Schriften und hartkodierte Texte sind geprüft, bevor ein Wort bezahlt wird. |
| **1 · Deutscher Master** | Volle Prosa auf Deutsch, in Stimme geschrieben — nicht als Spezifikation. Alle Effekte, KI-Chat, WhatsApp-Übergabe. | Die deutsche Endfassung. Keine Vorstufe. |
| **2 · Einfrierpunkt** | Content-Modell, Komponenten-Vertrag, Design-Tokens und Glossar werden fest. Die Prosa bleibt editierbar. | Übersetzt wird ab hier genau einmal. |
| **3 · Türkisch** | Transkreation, nicht Übersetzung. Native Keyword-Recherche ersetzt die deutschen Titel, sie überträgt sie nicht. | Der Hauptmarkt liest keine Übersetzung. |
| **4 · Russisch, dann Englisch** | Russisch zuerst: größte Gruppe, 43 % der Immobilienkäufe. Englisch als Auffangsprache. | Vier Sprachen. |
| **5 · Locale-QA** | Sechs mechanische Tore pro Sprache: Großschreibung, Glyphen, Sortierung, Slugs, `hreflang`-Gegenseitigkeit, Schema. | Abnahme. |

## 8. Abnahmekriterien für den deutschen Master (Phase 1)

- [ ] Jeder Textbaustein trägt `tier`, `register` und, wo nötig, `maxLen`.
- [ ] Kein invarianter Wert steht in der Prosa. Preise, kW, BTU, Modellnummern liegen strukturiert.
- [ ] Kein Satz enthält Ironie, Wortspiel oder deutsches Understatement in der `stimme`-Schicht ohne Vermerk, welche Wirkung stattdessen nachzubauen ist.
- [ ] Alle CTAs sind Verben in der Handlungsform, kein Substantivstil.
- [ ] Das Glossar deckt jeden Fachbegriff ab, der in `fach` vorkommt.
- [ ] Die Pseudo-Sprache aus Phase 0 läuft ohne Überlauf durch alle Ansichten.
- [ ] Kein `toUpperCase()` im gesamten Quelltext.
