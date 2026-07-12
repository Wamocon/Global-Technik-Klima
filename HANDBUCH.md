# Handbuch — Global Teknik Klima, Upgrade-Demo

Das Bedienhandbuch für den Menschen. Es erklärt, **wie man die Seite startet, ändert, prüft und veröffentlicht**.

> **Abgrenzung.** Es gibt zwei Handbücher, und sie haben verschiedene Leser.
>
> | Dokument | Für wen | Beantwortet |
> |---|---|---|
> | **`HANDBUCH.md`** (dieses) | Mensch — WAMOCON, später der Betrieb | *Wie* bediene ich die Seite? |
> | **`instruction.md`** | die nächste KI-Sitzung / der nächste Entwickler | *Was* ist das Projekt, *welche Regeln* gelten, *was* kommt als Nächstes? |
> | **`docs/04-anforderungen.md`** | beide | *Was* muss die Seite können — und was fehlt noch? |

Stand: 12. Juli 2026 · Branch `feat/deutscher-master` · Commit `d1f6cb8`

---

## 1. In fünf Minuten startklar

```bash
npm install
npm run dev      # http://localhost:4321
```

Vier Adressen, eine Seite:

| Sprache | Adresse |
|---|---|
| Türkisch (Standard) | `/` |
| Deutsch | `/de/` |
| Russisch | `/ru/` |
| Englisch | `/en/` |

Türkisch liegt **an der Wurzel, ohne Präfix**. Das ist Absicht: es erhält die bestehenden URLs der `.com.tr` und das lokale Google-Signal. Nicht ändern, ohne `docs/01-sprachvertrag.md` gelesen zu haben.

| Befehl | Was er tut |
|---|---|
| `npm run dev` | Entwicklungsserver mit Live-Neuladen |
| `npm run build` | baut nach `dist/` — **hier greifen die Leitplanken** |
| `npm run guard` | nur die Leitplanken prüfen, ohne zu bauen |
| `npm run pseudo` | erzeugt die Nullsprache (siehe §7) |

**Wenn der Entwicklungsserver merkwürdige, alte Inhalte zeigt:** siehe §11, Falle 4. Das ist uns zweimal passiert und hat jedes Mal eine Stunde gekostet.

---

## 2. Was die Seite kann — Kapitel für Kapitel

Von oben nach unten, so wie der Besucher sie erlebt.

| # | Kapitel | Was passiert | Datei |
|---|---|---|---|
| 1 | **Hero** | Echtes Ladenfoto aus seinem Google-Profil (1600 × 1200). Darüber ein Canvas: goldenes Hitzeflimmern beruhigt sich zu petrolfarbener Kühle — der Produktnutzen als Bild, nicht als Satz. Darunter die **Sternebewertung groß**: `5,0` · ★★★★★ · 65 Google-Bewertungen, verlinkt auf seinen Karteneintrag. | `src/components/FrostHero.astro` |
| 2 | **Leistungen** | Sechs Karten (Montage, Wartung, Reinigung, Gasfüllung, Reparatur, Wärmepumpe). | `Home.astro` |
| 3 | **Produkte** | Sieben Gree-Linien mit seinen echten Produktbildern. | `Home.astro` |
| 4 | **Technik** | **3D-Explosionszeichnung.** Beim Scrollen zerlegt sich ein Wandgerät in fünf Bauteile auf einer gestrichelten Goldachse; die Legende rechts leuchtet Teil für Teil mit. Der Kunde sieht, *was* gewartet und getauscht wird, bevor er nach dem Preis fragt. | `ExplodedUnit.astro` |
| 5 | **Referenzen** | **Vorher-Nachher-Regler.** Ziehbar, links Hitze, rechts Kühle. Füllt das Kapitel, das auf seiner jetzigen Seite leer steht. ⛔ Zeigt bis auf Weiteres eine **gekennzeichnete Illustration** — siehe §10. | `BeforeAfter.astro` |
| 6 | **BTU-Rechner** | Fläche + Personen + Sonnenlage → passende BTU-Zahl, gerundet auf die real verkauften Stufen (9 000 / 12 000 / 18 000 / 24 000 / 36 000 / 48 000). Der Knopf öffnet WhatsApp **mit der ausgerechneten Zahl schon im Text**. Rechnet im Browser, sendet nichts. | `Home.astro`, unten im `<script>` |
| 7 | **Warum wir** | Vier Kacheln + Garantie-Block. |  |
| 8 | **Bewertungen** | Echte türkische Google-Zitate. Fremdsprachige sind als „Beispiel" markiert, solange es keine echten gibt. |  |
| 9 | **Über uns** | Mission + drei Kennzahlen (Bewertung, 7/24, Gree). |  |
| 10 | **Kontakt** | Telefon, WhatsApp, Adresse, Öffnungszeiten + **seine echte Google-Karte**. |  |
| 11 | **Fuß** | Händler-Zeile, Rechtstexte, Facebook + Instagram. |  |
| — | **KI-Assistent** | Schwebender Knopf unten rechts, öffnet den Chat. Siehe §5. | `Assistant.astro` |
| — | **WhatsApp** | Drei Einstiege. Siehe §6. |  |

---

## 3. Texte ändern

**Alles Sichtbare steht in einer einzigen Datei:** `src/content/home.ts`.

Sie ist nach Sprachen aufgebaut (`tr`, `ru`, `de`, `en`) und exportiert:

| Export | Inhalt |
|---|---|
| `content` | die Startseite in vier Sprachen (Hero, Leistungen, Produkte, Rechner, Bewertungen, Kontakt, Fuß) |
| `nav` | die sechs Menüpunkte |
| `mission` | „Über uns" |
| `exploded` | Überschrift + die fünf Bauteilnamen der Explosionszeichnung |
| `beforeAfter` | Beschriftungen des Reglers |
| **`biz`** | **die harten Firmendaten** — Telefon, WhatsApp, Adresse, Koordinaten, Bewertung, Kartenlink, Facebook, Instagram |

`biz` ist die einzige Quelle für die Firmendaten. Ändert man dort die Telefonnummer, ändert sie sich überall: Kopfzeile, Kontakt, Sticky-Leiste, Chat. **Nie eine Nummer irgendwo direkt hinschreiben.**

```ts
export const biz = {
  phone:    '+90 242 513 86 51',   // Festnetz
  whatsapp: '+90 533 046 13 87',   // Mobil / WhatsApp
  address:  'Hacet Mah., Alaiye Cad. No: 17/A, Alanya / Antalya',
  geo:      [36.5509274, 32.0081833],
  ratingValue: '5,0', ratingCount: 65,
  ...
} as const
```

**Beim Ändern von Texten gilt:** was in einer Sprache dazukommt, muss in allen vieren dazukommen. TypeScript erzwingt das — fehlt ein Feld, bricht der Build. Das ist gewollt.

Der deutsche **Redaktions-Master** (`content/de/master.md`) ist die Textquelle mit Register-Angaben und Sperren. Die vier Sprachen sind keine wörtlichen Übersetzungen, sondern **Transkreationen**: Russisch braucht einen sichtbaren Preis, Türkisch braucht den Superlativ, Deutsch braucht den Festpreis. Was in welcher Sprache anders sein *muss*, steht in `docs/01-sprachvertrag.md` und `docs/02-glossar.md`.

---

## 4. Bilder tauschen

Alle Bilder liegen in `public/images/` und werden mit `/images/…` referenziert.

| Datei | Wofür |
|---|---|
| `hero-shop.webp` | Ladenfoto im Hero (aus seinem Google-Profil, 1600 × 1200) |
| `p-*.webp` | die sieben Produktbilder |
| `unit-teal.webp` | Bild neben dem BTU-Rechner |
| `ba-hot.webp` / `ba-cool.webp` | die zwei Hälften des Vorher-Nachher-Reglers |

**Regeln:** WebP, `width`/`height` im `<img>` immer mitgeben (sonst springt das Layout beim Laden), `loading="lazy"` für alles unter dem Falz — **nie** für das Hero-Bild.

**Wenn echte Montagefotos kommen:** `ba-hot.webp` und `ba-cool.webp` ersetzen, dann in `src/content/home.ts` bei `beforeAfter` das Feld `example` leeren und in `BeforeAfter.astro` das `⛔`-Kommentar entfernen. Erst dann darf das „Beispielbild"-Etikett weg.

---

## 5. Der KI-Assistent

Er läuft in **zwei Betriebsarten** — und zwar automatisch, ohne Umschalter.

**Mit `ANTHROPIC_API_KEY`** (in Vercel als Umgebungsvariable gesetzt): Der Chat ruft `/api/chat` auf. Dort antwortet ein echtes Sprachmodell (`api/chat.js`, Modell über `ANTHROPIC_MODEL` einstellbar, Standard `claude-haiku-4-5`) mit dem Systemprompt aus `src/content/kb.ts`. Es beantwortet **jeden Freitext in der Sprache des Besuchers**.

**Ohne Schlüssel:** `/api/chat` meldet ehrlich `fallback: true`, und der Browser schaltet auf die **eingebaute Intent-Maschine** um — dieselbe Wissensbasis, nur regelbasiert. 13 Themen (Begrüßung, Leistungen, Montage, Wartung, Gasfüllung, Störung, Produkte, Wärmepumpe, Garantie, Kontakt, Öffnungszeiten, Sprache, Ratenzahlung) plus drei Sonderfälle: **Preisfrage**, **„ich will einen Menschen"** und **Flächenangabe → BTU-Empfehlung**. Der Chat funktioniert also **immer**, auch als reine statische Seite ohne Server.

Die gesamte Wissensbasis steht in **`src/content/kb.ts`** — und zwar nur dort. Derselbe Text dient als Systemprompt für das Sprachmodell *und* als Antwortsatz für die Regelmaschine. Ein Wissen, zwei Betriebsarten, keine Abweichung.

**Was der Assistent nicht darf:** keine Preise nennen (der Betrieb veröffentlicht keine), keine Termine fest zusagen, nichts erfinden. Bei Unsicherheit übergibt er an WhatsApp. Das steht so im Systemprompt und muss so bleiben.

Über dem Chatfenster steht ein **KI-Hinweis**. Rechtlich ist er in der Türkei nicht erzwungen (siehe `docs/03-recht.md`), aber er ist ein Vertrauenssignal — er bleibt.

---

## 6. WhatsApp — drei Einstiege

WhatsApp ist **der** Kanal in diesem Markt, nicht ein Kanal.

1. **Schwebender grüner Knopf** unten rechts (nur Desktop).
2. **Sticky-Leiste** am unteren Rand (nur Mobil): Anrufen | WhatsApp — im Daumenbereich, wie auf seiner Altseite.
3. **Aus dem BTU-Rechner heraus**: der Knopf öffnet WhatsApp mit der fertigen Nachricht — *„BTU: 18.000 · 32 m² · 3 kişi"*. Der Interessent muss nichts formulieren.

Dazu übergibt der KI-Assistent an WhatsApp, sobald jemand nach einem Preis fragt oder einen Menschen möchte.

Die Nummer kommt überall aus `biz.whatsapp`.

---

## 7. Die Leitplanken — was den Build bricht, und warum

`npm run build` ruft `scripts/guard.mjs` auf. Bricht er, ist das kein Ärgernis, sondern der Sinn der Sache.

**1 · Kein `toUpperCase()` / `toLowerCase()` in JavaScript.**
Türkisch hat ein punktloses ı und ein gepunktetes İ. `'İSTANBUL'.toLowerCase()` erzeugt einen kaputten String, und `'ISI'.toLowerCase()` ist **nicht** `'ısı'`. Großschreibung nur über CSS `text-transform` bei gesetztem `lang`. Muss es doch in JavaScript sein: `toLocaleUpperCase('tr-TR')`. Sortieren nur mit `Intl.Collator('tr')`.
*Diese Regel hat mich selbst erwischt — drei Zeilen unter dem Kommentar, das davor warnt.*

**2 · Keine Google-Fonts-Einbindung.** Ein Font-Aufruf an Google ist eine Datenübermittlung ins Ausland — nach KVKK ein Problem. Die Schriften liegen lokal in `public/fonts/`. Beide Familien tragen Kyrillisch; das ist geprüft, nicht angenommen.

**3 · Verbotene Wörter.** „Kühlmittel" (es heißt Kältemittel), „Instandhaltung" (es heißt Wartung), „кондей" (billig), „soğutucu akışkan" im Verkaufstext (der Kunde sagt „klima gazı", der Techniker sagt anders). Die vollständige Marktsprache: `docs/02-glossar.md`.

**4 · Jeder Textbaustein braucht ein `tier`** und hält seine Längenvorgabe ein.

**5 · Die `⛔`-Sperren** werden bei jedem Build aufgelistet. Sie sind kein Fehler — sie sind die Erinnerung an das, was der Betrieb noch bestätigen muss (§10).

**Die Nullsprache** (`npm run pseudo`) erzeugt eine künstliche Sprache mit absichtlich langen Wörtern und Sonderzeichen. Damit sieht man Layoutbrüche, bevor eine echte Übersetzung existiert.

---

## 8. Abnahmetest

```bash
node scratchpad/acceptance.mjs      # braucht einen laufenden Server auf :4321
```

Fährt **4 Sprachen × Desktop (1440) und Mobil (390)** ab und prüft je Kombination:

- keine JavaScript-Fehler in der Konsole
- kein horizontaler Überlauf (die Seite muss dynamisch sein — *das* hat den russischen Mobil-Bruch gefunden)
- Hero, H1, Kontakt, Fuß, Chat-Starter sichtbar
- WhatsApp erreichbar — auf Desktop der schwebende Knopf, auf Mobil die Sticky-Leiste
- Sternebewertung **prominent** (mindestens 24 px hoch; ist real 65–74 px)
- Chat: öffnet → versteht Freitext → schließt
- Karte lädt und ist mindestens 200 px hoch
- Explosionszeichnung rendert, Legende hebt hervor
- Vorher-Nachher-Regler reagiert

**Stand: 0 Fehler.** Nach jeder Änderung neu laufen lassen.

---

## 9. Veröffentlichen (Vercel)

`vercel.json` liegt fertig im Projekt.

1. Repository mit Vercel verbinden → Astro wird erkannt.
2. **Umgebungsvariable `ANTHROPIC_API_KEY`** setzen, wenn der Chat mit echtem Sprachmodell laufen soll. Ohne sie läuft die Regelmaschine — die Demo funktioniert trotzdem vollständig.
3. Deployen. Die Demo-Adresse ist das, was im Verkaufsgespräch **neben seine jetzige Seite** gelegt wird.

**Vercel ist die Demo-Bühne, nicht die Produktion.** Geht der Auftrag durch, zieht die Seite in türkisches Hosting um (§10 und `docs/03-recht.md`).

---

## 10. Vor dem echten Livegang

Das hier ist eine **Akquise-Demo**. Sie behauptet bewusst nichts, was nicht belegt ist. Vor einem echten Livegang muss der Betrieb Folgendes bestätigen — bis dahin bleiben die Stellen gesperrt (`⛔`):

| Offen | Was blockiert ist |
|---|---|
| **Gründungsjahr** | nirgends öffentlich. „Seit 1997" gehört dem Klimabudur-Netzwerk, **nicht** diesem Betrieb — niemals verwenden. |
| **Yetkili `servis` oder nur `bayi`?** | „Bayi ve Servisi" steht wörtlich auf seiner Über-uns-Seite, so ist es gespiegelt. Für ein Garantie-Abzeichen müsste der Servis-Status bestätigt sein. |
| **Mindestpreise** | blockiert den russischen Preis-Play (fehlender Preis liest sich für Russen als Betrugssignal). |
| **Spricht ein Mensch Deutsch?** | oder läuft es über die Agentur? Blockiert das deutsche Service-Versprechen. |
| **5,0 / 65 Bewertungen** | steht so in seinem Karten-Einbau, ändert sich aber. |
| **Öffnungszeiten** | Verzeichnis sagt Mo–Sa 08–20, Yandex sagt 19 Uhr. |
| **Montagefotos** | bis dahin zeigt der Regler eine gekennzeichnete Illustration. |

**Was bereits korrigiert ist:** auf seiner Altseite steht eine Konya-Nummer (`+90 332 325 25 50`, falsche Vorwahl) als anklickbarer Telefonlink. Die ist raus. Es gelten `+90 242 513 86 51` und `+90 533 046 13 87`.

**Recht:** KVKK, Türkei-Hosting, Postfach weg von Gmail, Sprachmodell auf türkischer GPU — alles in `docs/03-recht.md`. Das ist Produktionsarchitektur nach dem Ja, nicht Demo.

---

## 11. Fehlersuche — die Fallen, die uns schon reingelegt haben

Diese fünf haben je eine bis mehrere Stunden gekostet. Sie stehen hier, damit sie es kein zweites Mal tun.

**Falle 1 · Astros CSS greift nicht bei Elementen, die JavaScript erzeugt.**
Astro fügt jedem Stil einen Bauteil-Schlüssel hinzu. Ein `<div>`, das im Browser per `createElement` entsteht, hat diesen Schlüssel nicht — die Regel greift nicht. Das hat zweimal zugeschlagen: die Chat-Blasen blieben unformatiert (der WhatsApp-Übergabeknopf war unlesbar), und die Karte blieb bei 154 px hängen.
*Lösung:* für JavaScript-erzeugte Elemente `<style is:global>` unter einer festen Kennung verwenden, wie es `Assistant.astro` unter `#chatpanel` tut.

**Falle 2 · `display:flex` schlägt das `hidden`-Attribut.**
`.chatpanel{display:flex}` hat `[hidden]` überstimmt — der Chat ließ sich nicht schließen und stand beim Laden offen. *Lösung:* `.chatpanel[hidden]{display:none}` mit höherer Spezifität.

**Falle 3 · Perspektive ist nicht Mitte.**
Bei der Explosionszeichnung: eine in 3D korrekt berechnete Mitte landet **nicht** in der Bildmitte, weil das nahe Bauteil vergrößert und das ferne verkleinert wird. *Lösung:* die Kamera passt sich im **Bildraum** ein — projizieren, den sichtbaren Rahmen messen, nachziehen (`ExplodedUnit.astro`, `fitCamera`).

**Falle 4 · Der Entwicklungsserver serviert alten Code.**
Astros Dæmon hängt sich stumm wieder an einen alten Prozess auf Port 4321. Man ändert etwas, nichts passiert, man sucht den Fehler im Code — und es gibt keinen.
*Lösung:* `npx astro dev stop`, alle `astro`-Prozesse beenden, `.astro/`, `node_modules/.vite/` und `dist/` löschen. Im Zweifel mit `npx astro preview` gegen den **gebauten** Stand arbeiten; der lügt nicht.

**Falle 5 · Lange Wörter brechen das Layout, aber nur in einer Sprache.**
Der Garantie-Block war eine Flex-Zeile mit `white-space:nowrap` — auf Russisch/Mobil schoss die Seite auf 412 px bei 390 px Fenster. *Lösung:* `min-width:0` auf den Text, unter 640 px in eine Spalte umbrechen. **Deshalb prüft der Abnahmetest jede Sprache einzeln auf horizontalen Überlauf.**

---

## 12. Wo was steht

```
HANDBUCH.md                 dieses Dokument — Bedienung
instruction.md              Regeln + nächste Phasen (für Entwickler/KI)
docs/01-sprachvertrag.md    die vier Sprachentscheidungen, Schichten, Blockvarianten
docs/02-glossar.md          Marktsprache TR/RU/DE/EN, Gree-Produktwahrheit
docs/03-recht.md            KVKK, AI Act, Hosting — Produktionsarchitektur
docs/04-anforderungen.md    Anforderungen + Vollständigkeitsprüfung + offene Lücken
docs/05-video-skript-de.md  Sprechskript für Avatar/Video (deutsche Fassung)
content/de/master.md        deutscher Redaktions-Master (Textquelle, Register, Sperren)

src/content/home.ts         >> ALLE sichtbaren Texte + Firmendaten (biz)
src/content/kb.ts           >> das Wissen des KI-Assistenten (Prompt + Regelmaschine)
src/components/             Hero, Home, Assistant, ExplodedUnit, BeforeAfter
src/layouts/Base.astro      Kopfzeile, Sprachumschalter, hreflang, Meta
src/i18n/                   Sprachsystem, Leitplanken als Code
src/styles/                 tokens (Palette), fonts (lokal), global
api/chat.js                 Serverfunktion für den KI-Chat
scripts/guard.mjs           die Leitplanken
scripts/pseudo.mjs          die Nullsprache
public/images/, public/fonts/
scratchpad/acceptance.mjs   der Abnahmetest
```
