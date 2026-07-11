// Die Leitplanken aus dem Sprachvertrag, als Build-Schranke.
// Bricht der Build, ist das der Sinn der Sache.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { source } from '../src/i18n/ui.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []

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
const FORBIDDEN = [
  ['Kühlmittel', 'Sachlich falsch. Ein Kühlmittel transportiert Wärme; ein Kältemittel erzeugt Kälte.'],
  ['Instandhaltung', 'Facility-Management-Sprache. Für Endkunden heißt es "Wartung".'],
  ['кондей', 'Umgangssprache, liest sich billig. Niemals sichtbar.'],
  ['soğutucu akışkan', 'Fachwort. Im Verkaufstext heißt es "klima gazı".'],
]
for (const [key, entry] of Object.entries(source)) {
  for (const [word, why] of FORBIDDEN) {
    if (entry.de.includes(word)) errors.push(`ui.ts "${key}" enthält "${word}" — ${why}`)
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

// ─── 6. Gesperrte Bausteine sichtbar machen ────────────────────────────────
const blocked = Object.entries(source).filter(([, e]) => e.blocked)

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
