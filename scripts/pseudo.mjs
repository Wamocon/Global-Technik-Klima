// Phase 0 — Nullsprache.
//
// Erzeugt aus dem deutschen Master eine Pseudo-Sprache und schreibt sie nach
// src/i18n/xx.json. Sie streckt jeden String und streut genau die Zeichen ein,
// an denen dieses Projekt scheitern kann: türkische Diakritika und Kyrillisch.
//
// Zweck: Layout, Schriftabdeckung und hartkodierte Texte prüfen, BEVOR ein Wort
// übersetzt oder bezahlt wird.
//
// Chrome DevTools kann das nicht. Die dortige "Pseudo-Locale" ist ein Android-Feature.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { source } from '../src/i18n/ui.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Akzentuierte Entsprechungen — lesbar genug, um Abschneiden zu erkennen.
const MAP = {
  a: 'ǻ', b: 'ƀ', c: 'ç', d: 'ḓ', e: 'ḗ', f: 'ƒ', g: 'ǧ', h: 'ħ', i: 'ī', j: 'ǰ',
  k: 'ķ', l: 'ŀ', m: 'ḿ', n: 'ń', o: 'ǿ', p: 'ƥ', q: 'ɋ', r: 'ř', s: 'ş', t: 'ŧ',
  u: 'ŭ', v: 'ṽ', w: 'ẇ', x: 'ẋ', y: 'ÿ', z: 'ẑ',
  A: 'Ǻ', B: 'Ɓ', C: 'Ç', D: 'Ḓ', E: 'Ḗ', F: 'Ƒ', G: 'Ǧ', H: 'Ħ', I: 'İ', J: 'Ĵ',
  K: 'Ķ', L: 'Ŀ', M: 'Ḿ', N: 'Ń', O: 'Ǿ', P: 'Ƥ', Q: 'Ɋ', R: 'Ř', S: 'Ş', T: 'Ŧ',
  U: 'Ŭ', V: 'Ṽ', W: 'Ẇ', X: 'Ẋ', Y: 'Ÿ', Z: 'Ẑ',
}

// Diese Zeichen MÜSSEN in jeder Schriftfassung vorhanden sein.
// Türkisch: ı İ ş ğ ç ö ü — Russisch: ЁЖЩЪЫЬЭЮЯ
const STRESS = 'ıİşğçöü·ЖЩЪЫЬЭ'

// Ausdehnung. Die W3C-/IBM-Tabelle knüpft an die Länge des AUSGANGSSTRINGS an,
// nicht an die Zielsprache: kurze Labels wachsen auf 200–300 %, lange Sätze auf 130 %.
// Deshalb ist die Streckung längenabhängig, nicht pauschal.
function expansion(len) {
  if (len <= 10) return 1.9
  if (len <= 20) return 1.7
  if (len <= 30) return 1.55
  if (len <= 50) return 1.45
  return 1.3
}

function pseudo(str) {
  // Platzhalter {name} bleiben unangetastet.
  const parts = str.split(/(\{\w+\})/g)
  const body = parts
    .map((p) => (/^\{\w+\}$/.test(p) ? p : [...p].map((ch) => MAP[ch] ?? ch).join('')))
    .join('')

  const visible = str.replace(/\{\w+\}/g, '').length
  const target = Math.round(visible * expansion(visible))
  const need = Math.max(0, target - visible)

  let pad = ''
  for (let i = 0; i < need; i++) pad += STRESS[i % STRESS.length]

  return `[${body}${pad ? ' ' + pad : ''}]`
}

const out = {}
let widest = { key: '', over: 0 }

for (const [key, entry] of Object.entries(source)) {
  const p = pseudo(entry.de)
  out[key] = p
  if (entry.maxLen) {
    const over = p.length - entry.maxLen
    if (over > widest.over) widest = { key, over }
  }
}

const target = resolve(__dirname, '../src/i18n/xx.json')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(out, null, 2) + '\n', 'utf8')

const keys = Object.keys(out).length
console.log(`Nullsprache: ${keys} Bausteine → src/i18n/xx.json`)
if (widest.key) {
  console.log(
    `Härtester Fall: "${widest.key}" überschreitet maxLen um ${widest.over} Zeichen.` +
      ` Genau dort muss das Layout halten.`
  )
}
