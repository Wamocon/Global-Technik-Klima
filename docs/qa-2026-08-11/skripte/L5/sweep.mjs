// L5 — Forbidden-content sweep over the built output + client bundles.
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'D:/01 Antigrafity Projekte/25 Global-Technik-Klima'
const DIST = join(ROOT, 'dist')

function walk(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}

const all = walk(DIST)
const textFiles = all.filter((p) => /\.(html|js|css|xml|txt|json|svg)$/i.test(p))
console.log(`dist files: ${all.length}, text files scanned: ${textFiles.length}`)
console.log('HTML pages:', all.filter((p) => p.endsWith('.html')).length)

const RULES = [
  // 1 Konya number, every formatting
  ['KONYA-PHONE', /332[\s.\-]?325[\s.\-]?25[\s.\-]?50|3323252550|\+?90[\s.\-]?332/g],
  // 2 any phone-shaped string (post-filtered)
  ['ANY-PHONE', /(?:\+?90|0)?[\s.\-(]*\d{3}[\s.\-)]*\d{3}[\s.\-]*\d{2}[\s.\-]*\d{2}/g],
  // 3 founding-year claims
  ['YEAR-1997', /1997/g],
  ['YEAR-1998', /1998/g],
  ['FOUNDINGDATE', /foundingDate/g],
  ['SINCE-CLAIM', /\b(seit|since|beri|с)\s*(19|20)\d{2}|(19|20)\d{2}\s*(’den beri|'den beri|den beri|года)/gi],
  // 4 forbidden words
  ['KUEHLMITTEL', /Kühlmittel/gi],
  ['INSTANDHALTUNG', /Instandhaltung/gi],
  ['KONDEJ', /кондей/gi],
  ['SOGUTUCU-AKISKAN', /so[ğg]utucu\s+ak[ıi]şkan/gi],
  // 5 money
  ['CURRENCY-SYM', /[₺€$]|\bTL\b|\bEUR\b|\bUSD\b|руб/g],
  // 6 schema
  ['PRICERANGE', /priceRange/g],
  ['FAQPAGE', /FAQPage|"Question"|"Answer"/g],
  // 7 third-party
  ['GOOGLE-FONTS', /fonts\.(googleapis|gstatic)\.com/g],
  ['ANALYTICS', /googletagmanager|google-analytics|gtag\(|\bga\(|facebook\.net|connect\.facebook|hotjar|matomo|plausible|yandex\.metrika|mc\.yandex|clarity\.ms|segment\.com|sentry\.io/gi],
  ['CDN', /cdn\.|unpkg\.com|jsdelivr|cdnjs|ajax\.googleapis/gi],
  // 8 secrets
  ['SECRET', /sk-ant-[A-Za-z0-9\-_]{6,}|ANTHROPIC_API_KEY|AIza[0-9A-Za-z\-_]{20,}|Bearer\s+[A-Za-z0-9._\-]{20,}/g],
  // 9 the casing trap in shipped JS
  ['TOUPPER', /toUpperCase\(/g],
  ['TOLOWER', /toLowerCase\(/g],
  ['LOCALE-LOWER', /toLocaleLowerCase\(/g],
  ['LOCALE-UPPER', /toLocaleUpperCase\(/g],
  // 10 placeholder / pseudo locale
  ['PLACEHOLDER', /⟨[^⟩]*⟩|‹[^›]*›|\bTODO\b|Lorem ipsum|\bxxx\b/g],
  ['PSEUDO', /[ȧḃċḋėḟġḣ]|\[\[|\]\]/g],
  // 11 hard-coded German leaking
  ['BEISPIEL-LITERAL', />Beispiel</g],
  // 12 external iframes / hosts
  ['GOOGLE-HOST', /https?:\/\/(www\.)?google\.com/g],
]

const OK_PHONES = ['+90 242 513 86 51', '+90 533 046 13 87', '905330461387', '902425138651', '+902425138651', '+905330461387']

const hits = {}
for (const f of textFiles) {
  const src = readFileSync(f, 'utf8')
  for (const [name, re] of RULES) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) {
      const at = m.index
      const ctx = src.slice(Math.max(0, at - 70), at + m[0].length + 70).replace(/\s+/g, ' ')
      hits[name] ??= []
      hits[name].push({ file: relative(ROOT, f).replace(/\\/g, '/'), match: m[0], ctx })
      if (re.lastIndex === at) re.lastIndex++
    }
  }
}

// post-filter ANY-PHONE: strip digits, compare against allowed
if (hits['ANY-PHONE']) {
  hits['ANY-PHONE'] = hits['ANY-PHONE'].filter((h) => {
    const d = h.match.replace(/\D/g, '')
    if (d.length < 10) return false
    const norm = d.replace(/^0+/, '').replace(/^90/, '')
    return !['2425138651', '5330461387'].includes(norm)
  })
}

for (const [name] of RULES) {
  const list = hits[name] || []
  const byFile = {}
  for (const h of list) (byFile[h.file] ??= []).push(h)
  console.log(`\n### ${name}: ${list.length} hit(s) in ${Object.keys(byFile).length} file(s)`)
  if (!list.length) continue
  let shown = 0
  for (const [file, hs] of Object.entries(byFile)) {
    const uniq = [...new Map(hs.map((h) => [h.match + '|' + h.ctx.slice(0, 40), h])).values()]
    console.log(`  ${file}  (${hs.length})`)
    for (const h of uniq.slice(0, 4)) {
      console.log(`     "${h.match}"  …${h.ctx}…`)
      if (++shown > 60) break
    }
    if (shown > 60) { console.log('     …truncated'); break }
  }
}
