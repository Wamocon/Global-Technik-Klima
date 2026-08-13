// Die Leitplanken aus dem Sprachvertrag, als Build-Schranke.
// Bricht der Build, ist das der Sinn der Sache.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { source } from '../src/i18n/ui.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []

// ─── Zweiter, ausdrücklicher Durchlauf: das GEBAUTE dist/ ──────────────────
// Der reguläre Lauf überspringt dist/ mit Absicht (siehe walk() weiter unten):
// er läuft VOR `astro build` und sähe dort nur den vorigen Stand. Fremde
// Herkünfte zeigen sich aber erst am ausgelieferten HTML. Deshalb dieser eigene
// Modus, den package.json als `postbuild` nach dem Bauen startet.
//
// Geprüft wird ausschließlich, was der Browser OHNE Zutun des Besuchers holt:
//   src / srcset       Bilder, Rahmen, Skripte
//   <link href>        Stilvorlagen, Vorverbindungen, Vorladungen, Schriften
// NICHT geprüft: <a href> — das verbindet erst beim Klick — und data-*, denn
// genau dort parkt der Zustimmungspfad die Karten-URL (Home.astro:262).
// Das ist der Unterschied, um den es bei Befund C1 ging.
if (process.argv.includes('--dist')) {
  const distRoot = join(root, 'dist')
  if (!existsSync(distRoot)) {
    console.error('\ndist/ fehlt. Erst `astro build`, dann diesen Durchlauf.')
    process.exit(1)
  }

  // Die eigene Herkunft steht in astro.config.mjs und nirgends sonst.
  const cfg = readFileSync(join(root, 'astro.config.mjs'), 'utf8')
  const treffer = cfg.match(/site:\s*['"]([^'"]+)['"]/)
  if (!treffer) {
    console.error('\nastro.config.mjs: Feld `site` nicht gefunden — ohne eigene Herkunft ist kein Vergleich möglich.')
    process.exit(1)
  }
  const eigen = new URL(treffer[1]).host

  const htmlDateien = []
  ;(function sammle(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) sammle(p)
      else if (extname(p) === '.html') htmlDateien.push(p)
    }
  })(distRoot)

  // Der Rückblick `(?<![-\w])` ist der Kern dieser Muster, nicht Feinschliff:
  // `\bsrc=` trifft auch `data-src=`, weil der Bindestrich als Wortgrenze zählt.
  // Genau dort parkt der Zustimmungspfad die Karten-URL — ohne den Rückblick
  // meldet diese Prüfung den korrekt gebauten Zustand als Verstoß und wird
  // nach dem dritten Fehlalarm ignoriert.
  const MUSTER = [
    [/(?<![-\w])src\s*=\s*["']([^"']+)["']/gi, 'src'],
    [/(?<![-\w])srcset\s*=\s*["']([^"']+)["']/gi, 'srcset'],
    [/<link\b[^>]*?(?<![-\w])href\s*=\s*["']([^"']+)["']/gi, 'link href'],
  ]

  const fremd = []
  for (const f of htmlDateien) {
    const html = readFileSync(f, 'utf8')
    for (const [re, wo] of MUSTER) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(html))) {
        // srcset trägt mehrere Kandidaten, je „URL Breite".
        for (const roh of m[1].split(',')) {
          const url = roh.trim().split(/\s+/)[0]
          if (!/^(https?:)?\/\//i.test(url)) continue // relativ = eigen, in Ordnung
          let host
          try {
            host = new URL(url.startsWith('//') ? 'https:' + url : url).host
          } catch {
            continue // kein auswertbares Ziel, nichts zu melden
          }
          if (host !== eigen) fremd.push(`${relative(root, f)} — ${wo}="${url.slice(0, 90)}"`)
        }
      }
    }
  }

  if (fremd.length) {
    console.error(`\n${fremd.length} fremde Herkunft/Herkünfte im ausgelieferten HTML:`)
    // Gleiche Fundstelle nicht 17× drucken — es sind 17 Seiten mit demselben Kopf.
    const gezaehlt = new Map()
    for (const z of fremd) {
      const schluessel = z.replace(/^[^—]+— /, '')
      gezaehlt.set(schluessel, (gezaehlt.get(schluessel) || 0) + 1)
    }
    for (const [z, n] of gezaehlt) console.error(`  ✗ ${z}${n > 1 ? `  (${n}×)` : ''}`)
    console.error(
      '\nDiese Ziele lädt der Browser ungefragt. Jedes davon ist eine Übermittlung ' +
        'ins Ausland (KVKK Art. 9), sofern der Empfänger dort sitzt.'
    )
    process.exit(1)
  }
  console.log(`\nAusgeliefertes HTML sauber. ${htmlDateien.length} Seiten geprüft, keine fremde Herkunft.`)
  process.exit(0)
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (['.astro', '.ts', '.js', '.mjs', '.css'].includes(extname(p))) acc.push(p)
  }
  return acc
}

const files = walk(join(root, 'src'))
  .concat(walk(join(root, 'scripts')))
  // Diese Datei definiert die Regel und enthält sie deshalb als Text.
  .filter((f) => !f.endsWith('guard.mjs'))

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line)

// ─── 1. Die türkische Punkt-i-Falle ────────────────────────────────────────
// Kleinschreibung von İSTANBUL liefert i plus Kombinationspunkt — einen kaputten String.
// Und der naive Kleinvergleich von ISI trifft ısı nicht.
const BAN = /\.to(Upper|Lower)Case\(\)/
for (const f of files) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (isComment(line)) return // Warnhinweise dürfen die Falle benennen.
      if (BAN.test(line)) {
        errors.push(
          `${relative(root, f)}:${i + 1} — Groß-/Kleinschreibung in JavaScript ist verboten. ` +
            `Nutze CSS text-transform bei gesetztem lang, oder toLocaleUpperCase('tr-TR').`
        )
      }
    })
}

// ─── 2. Keine Auslandsübermittlung durch Schriften ─────────────────────────
// Google Fonts wäre nach KVKK Art. 9 eine Übermittlung. Die Schriften liegen lokal.
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  if (/fonts\.(googleapis|gstatic)\.com/.test(src)) {
    errors.push(`${relative(root, f)} — Google Fonts eingebunden. Schriften sind selbst zu hosten.`)
  }
}

// ─── 3. Verbotene Wörter aus dem Glossar ───────────────────────────────────
// Glossar Abschnitt 1, die Kundensprache-Regel: der Kunde und der Techniker
// benutzen verschiedene Wörter. Verkaufstext nimmt das Kundenwort.
//
// Je Sprache verboten. Vorher lief diese Prüfung nur über `entry.de` in ui.ts —
// also über die Redaktionsquelle, in der ohnehin nur Deutsch steht. Die tatsächlich
// ausgelieferte Prosa in src/content/ hat sie nie gesehen. Genau dort stand dann
// auch "soğutucu akışkan": eine Regel, die das Glossar aufstellt, der Wächter
// benennt, und die trotzdem im Produkt landete.
const FORBIDDEN = {
  de: [
    ['Kühlmittel', 'Sachlich falsch. Ein Kühlmittel transportiert Wärme; ein Kältemittel erzeugt Kälte.'],
    ['Instandhaltung', 'Facility-Management-Sprache. Für Endkunden heißt es "Wartung".'],
  ],
  ru: [['кондей', 'Umgangssprache, liest sich billig. Niemals sichtbar.']],
  tr: [['soğutucu akışkan', 'Fachwort. Im Verkaufstext heißt es "klima gazı".']],
  en: [],
}

// Die Redaktionsquelle trägt nur Deutsch.
for (const [key, entry] of Object.entries(source)) {
  for (const [word, why] of FORBIDDEN.de) {
    if (entry.de.includes(word)) errors.push(`ui.ts "${key}" enthält "${word}" — ${why}`)
  }
}

// Und jetzt die Prosa, die der Besucher wirklich liest.
const { content, exploded, beforeAfter, mission, biz } = await import('../src/content/home.ts')

// ─── 3a. Die Karte darf nicht ohne Zustimmung laden ────────────────────────
// Befund C1 des Ultra-Prüflaufs vom 11.08.2026. `mapMode: 'embed'` lädt ein
// Google-iframe beim Scrollen — eine Übermittlung ins Ausland nach KVKK Art. 9.
// legal.ts verspricht an acht Stellen in vier Sprachen das Gegenteil. Der
// Widerspruch stand monatelang im Produkt, weil ihn niemand erzwungen hat.
// Wer die Karte in einer Demo sofort zeigen will, muss die Rechtstexte
// mitschreiben — deshalb bricht das hier, statt nur zu warnen.
if (biz.mapMode === 'embed') {
  errors.push(
    `home.ts — mapMode steht auf 'embed'. Die Karte lädt dann ohne Zustimmung, ` +
      `während legal.ts in vier Sprachen verspricht, sie lade erst auf Klick. ` +
      `Entweder 'consent' setzen, oder die acht Stellen in legal.ts umschreiben.`
  )
}

/** Jeden String in einem verschachtelten Objekt einsammeln, mit Pfad. */
function strings(node, path = '', acc = []) {
  if (typeof node === 'string') acc.push([path, node])
  else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${path}[${i}]`, acc))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) strings(v, path ? `${path}.${k}` : k, acc)
  }
  return acc
}

for (const [bundleName, bundle] of Object.entries({ content, exploded, beforeAfter, mission })) {
  for (const [loc, tree] of Object.entries(bundle)) {
    const bans = FORBIDDEN[loc] || []
    if (!bans.length) continue
    for (const [path, text] of strings(tree)) {
      // Bildpfade und Modellnamen sind keine Prosa.
      if (path.endsWith('.img')) continue
      for (const [word, why] of bans) {
        if (text.toLocaleLowerCase(loc === 'tr' ? 'tr-TR' : loc).includes(word.toLocaleLowerCase(loc === 'tr' ? 'tr-TR' : loc))) {
          errors.push(`home.ts ${bundleName}.${loc}.${path} enthält "${word}" — ${why}`)
        }
      }
    }
  }
}

// ─── 4. Jeder Baustein braucht eine Schicht ────────────────────────────────
for (const [key, entry] of Object.entries(source)) {
  if (!entry.tier) errors.push(`ui.ts "${key}" hat kein tier.`)
  if (entry.tier === 'stimme' && !entry.register) {
    warnings.push(`ui.ts "${key}" ist tier:stimme ohne register — die Transkreation weiß nicht, welche Wirkung sie nachbauen soll.`)
  }
}

// ─── 5. Die deutsche Quelle muss ihre eigene Längengrenze halten ───────────
// Platzhalter zählen nicht mit ihrer Schreibweise, sondern mit ihrem Ergebnis.
const rendered = (s) => s.replace(/\{\w+\}/g, '###').length
for (const [key, entry] of Object.entries(source)) {
  if (entry.maxLen && rendered(entry.de) > entry.maxLen) {
    errors.push(
      `ui.ts "${key}": deutsche Quelle ist ${rendered(entry.de)} Zeichen, maxLen ist ${entry.maxLen}. ` +
        `Entweder kürzt der Text, oder das Layout bekommt mehr Budget — aber nicht beides schweigend.`
    )
  }
}

// ─── 6. Gesperrte Bausteine ERZWINGEN, nicht nur drucken ───────────────────
// Befund K1 des Ultra-Prüflaufs vom 11.08.2026. `trust.language` war seit
// Monaten gesperrt, der Guard druckte die Sperre bei jedem Lauf — und
// home.ts lieferte trotzdem „Wir sprechen Deutsch" aus, in drei Sprachen.
// Eine Sperre, die nur druckt, ist keine Sperre. Es ist derselbe Fehlermodus,
// den der Kommentar in Abschnitt 3 für „soğutucu akışkan" beschreibt.
//
// Eine Sperre meint die ZUSAGE, nicht eine Zeichenkette: „Wir sprechen
// Deutsch" und „Deutschsprachiger Service" sind dieselbe unbelegte Behauptung
// in zwei Fassungen. Deshalb Muster je Sprache und nicht Textvergleich.
const blocked = Object.entries(source).filter(([, e]) => e.blocked)

const GESPERRTE_ZUSAGEN = {
  'trust.language': {
    // tr entfällt: Türkisch ist die Standardsprache (master.md:170).
    de: [/wir sprechen deutsch/i, /deutschsprachige[rs]? service/i, /garantie auf deutsch/i],
    ru: [/говорим по-русски/i, /русскоязычный сервис/i],
    en: [/we speak english/i, /english-speaking service/i],
  },
  'garantie.arbeit': {
    tr: [/işçilik garantisi/i, /montaj garantisi/i],
    de: [/arbeitsgarantie/i, /garantie auf (unsere )?montage/i],
    ru: [/гарантия на работ/i, /гарантия на (наш\w* )?монтаж/i],
    en: [/workmanship warranty/i, /warranty on (our )?installation/i],
  },
}

// Selbstkontrolle: eine neue Sperre in ui.ts ohne Muster hier wäre eine Sperre,
// die wieder nur druckt. Genau das soll nicht noch einmal passieren.
for (const [key] of blocked) {
  if (!GESPERRTE_ZUSAGEN[key]) {
    errors.push(
      `ui.ts "${key}" ist gesperrt, aber guard.mjs kennt dafür kein Muster. ` +
        `Ohne Muster wird die Sperre nur gedruckt und nicht durchgesetzt — ` +
        `trage die verbotenen Formulierungen in GESPERRTE_ZUSAGEN ein.`
    )
  }
}

// Und jetzt gegen die Prosa, die der Besucher wirklich liest.
for (const [key, jeSprache] of Object.entries(GESPERRTE_ZUSAGEN)) {
  const grund = source[key] && source[key].blocked
  if (!grund) continue // Sperre aufgehoben — dann darf der Text zurückkommen.
  for (const [bundleName, bundle] of Object.entries({ content, exploded, beforeAfter, mission })) {
    for (const [loc, tree] of Object.entries(bundle)) {
      for (const muster of jeSprache[loc] || []) {
        for (const [path, text] of strings(tree)) {
          if (path.endsWith('.img')) continue
          if (muster.test(text)) {
            errors.push(
              `home.ts ${bundleName}.${loc}.${path} liefert die gesperrte Zusage "${key}" aus ` +
                `(Treffer: ${muster}). Grund der Sperre: ${grund}`
            )
          }
        }
      }
    }
  }
}

// ─── Ausgabe ───────────────────────────────────────────────────────────────
if (warnings.length) {
  console.log('\nHinweise:')
  warnings.forEach((w) => console.log('  · ' + w))
}
if (blocked.length) {
  console.log(`\nGesperrt bis zum Beleg durch den Kunden (${blocked.length}):`)
  blocked.forEach(([k, e]) => console.log(`  ⛔ ${k} — ${e.blocked}`))
}
if (errors.length) {
  console.error(`\n${errors.length} Verstoß/Verstöße:`)
  errors.forEach((e) => console.error('  ✗ ' + e))
  process.exit(1)
}
console.log(`\nLeitplanken halten. ${files.length} Dateien geprüft, ${Object.keys(source).length} Bausteine.`)
