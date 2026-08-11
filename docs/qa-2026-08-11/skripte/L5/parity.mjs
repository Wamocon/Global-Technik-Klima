// L5 — metamorphic translation-completeness across the 4 locales, over the BUILT html.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'D:/01 Antigrafity Projekte/25 Global-Technik-Klima/dist'
const L = { tr: 'index.html', ru: 'ru/index.html', de: 'de/index.html', en: 'en/index.html' }
const LEG = ['kvkk', 'gizlilik', 'cerez']

const load = (p) => readFileSync(join(DIST, p), 'utf8')
const home = Object.fromEntries(Object.entries(L).map(([k, v]) => [k, load(v)]))

const count = (src, re) => (src.match(re) || []).length
const SEL = {
  'services cards': /<article class="card"/g,
  'product tiles': /<article class="prod"/g,
  'why tiles': /<article class="tile"/g,
  'warranty tiers': /<li><span class="wy"/g,
  'reviews': /<figure class="rev"/g,
  'B2B segments': /<li class="seg"/g,
  'B2B systems': /<article class="sys"/g,
  'B2B steps': /<li class="step"/g,
  'campaign cards': /<article class="camp-card"/g,
  'chat chips': /<button type="button" data-q=/g,
  'footer legal links': /class="fl"[\s\S]*?<\/p>/g,
  'form service <option>': /<select name="service">[\s\S]*?<\/select>/g,
  'trust chips': /class="chip"/g,
  'exploded legend items': /<li data-part=/g,
  'assure bullets': /<li><span aria-hidden="true">✓<\/span>/g,
  'ab-stat blocks': /<div class="ab-stat"/g,
}

console.log('=== SECTION / ARRAY COUNTS PER LOCALE ===')
const rows = []
for (const [label, re] of Object.entries(SEL)) {
  const r = { label }
  for (const l of Object.keys(L)) {
    if (label === 'footer legal links') {
      const m = home[l].match(re)
      r[l] = m ? (m[0].match(/<a href=/g) || []).length : 0
    } else if (label === 'form service <option>') {
      const m = home[l].match(re)
      r[l] = m ? (m[0].match(/<option/g) || []).length : 0
    } else r[l] = count(home[l], re)
  }
  rows.push(r)
}
for (const r of rows) {
  const vals = [r.tr, r.ru, r.de, r.en]
  const same = new Set(vals).size === 1
  console.log(`${same ? '  ok ' : '  ≠≠ '} ${r.label.padEnd(24)} tr=${r.tr} ru=${r.ru} de=${r.de} en=${r.en}`)
}

// ---- legal pages: block + paragraph counts
console.log('\n=== LEGAL PAGES: sections / paragraphs / placeholders ===')
for (const doc of LEG) {
  const line = []
  for (const l of Object.keys(L)) {
    const p = l === 'tr' ? `${doc}/index.html` : `${l}/${doc}/index.html`
    const src = load(p)
    const blocks = count(src, /<section class="lb"/g)
    const paras = count(src, /<section class="lb"[\s\S]*?<\/section>/g) // placeholder
    const allP = (src.match(/<section class="lb"[\s\S]*?<\/section>/g) || []).join('').match(/<p /g) || []
    const ph = count(src, /⟨vom Betrieb zu ergänzen⟩/g)
    line.push(`${l}: ${blocks} blocks / ${allP.length} p / ${ph} DE-placeholder`)
  }
  console.log(`  ${doc.padEnd(9)} ${line.join(' | ')}`)
}

// ---- cross-locale string leaks
console.log('\n=== CROSS-LOCALE STRING LEAKS (visible text) ===')
const visible = (src) =>
  src
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')

const LEAKS = {
  'German "Beispiel"': /Beispiel/g,
  'German placeholder ⟨…⟩': /⟨vom Betrieb zu ergänzen⟩/g,
  'Turkish "Örn."': /Örn\./g,
  'Turkish "Süreç"': /Süreç/g,
  'Turkish "kişi"': /kişi/g,
  'tr-format thousands (n.nnn)': /\b\d{1,3}\.\d{3}\b/g,
  'comma decimal rating 5,0': /5,0/g,
  'dot decimal rating 5.0': /5\.0/g,
}
for (const l of Object.keys(L)) {
  const vis = visible(home[l])
  const out = []
  for (const [label, re] of Object.entries(LEAKS)) {
    re.lastIndex = 0
    const m = vis.match(re)
    if (m) out.push(`${label}×${m.length}`)
  }
  console.log(`  /${l === 'tr' ? '' : l + '/'}  →  ${out.join('  ·  ') || '(none)'}`)
}

// aria-labels / placeholders / titles that are NOT localised
console.log('\n=== NON-LOCALISED ATTRIBUTES (aria-label / placeholder / title) ===')
for (const l of Object.keys(L)) {
  const at = [...home[l].matchAll(/(aria-label|placeholder|title)="([^"]{2,})"/g)].map((m) => `${m[1]}="${m[2]}"`)
  console.log(`  --- /${l === 'tr' ? '' : l + '/'} (${at.length}) ---`)
  const uniq = [...new Set(at)]
  for (const a of uniq) console.log('      ' + a)
}
