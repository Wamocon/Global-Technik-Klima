// L5 — JSON-LD vs visible content, every built page.
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
const DIST = 'D:/01 Antigrafity Projekte/25 Global-Technik-Klima/dist'
function walk(d, a = []) {
  for (const n of readdirSync(d)) {
    const p = join(d, n)
    if (statSync(p).isDirectory()) walk(p, a)
    else if (p.endsWith('.html')) a.push(p)
  }
  return a
}
const vis = (s) =>
  s.replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
const attrs = (s) => [...s.matchAll(/(?:href|content|src|aria-label|title|alt|placeholder)="([^"]*)"/g)].map((m) => m[1]).join(' | ')

let anyFail = 0
const summary = []
for (const f of walk(DIST).filter((p) => !p.includes('angebot'))) {
  const rel = relative(DIST, f).split('\\').join('/')
  const src = readFileSync(f, 'utf8')
  const ld = JSON.parse(src.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
  const biz = ld['@graph'].find((n) => String(n['@type']).includes('LocalBusiness'))
  const web = ld['@graph'].find((n) => n['@type'] === 'WebSite')
  const V = vis(src)
  const A = attrs(src)
  const ALL = V + ' ' + A
  const miss = []
  const need = (label, needle, where = ALL) => { if (!where.includes(needle)) miss.push(`${label} = "${needle}"`) }
  need('telephone', biz.telephone, ALL)
  need('foundingDate (must be visible)', biz.foundingDate, V)
  need('aggregateRating.ratingValue', String(biz.aggregateRating.ratingValue).replace('.', ','), V)
  need('aggregateRating.reviewCount', String(biz.aggregateRating.reviewCount), V)
  need('openingHours.opens', biz.openingHoursSpecification[0].opens, V)
  need('openingHours.closes', biz.openingHoursSpecification[0].closes, V)
  need('address.streetAddress', biz.address.streetAddress, V)
  need('addressLocality', 'Alanya', ALL)
  for (const s of biz.hasOfferCatalog.itemListElement.map((o) => o.itemOffered)) {
    need('service.name', s.name, V)
    need('service.description', s.description.slice(0, 40), V)
  }
  for (const u of biz.sameAs) need('sameAs', u, A)
  need('hasMap', biz.hasMap, A)
  need('description (= hero.sub)', biz.description.slice(0, 40), V)
  if (!A.includes(String(biz.geo.latitude)) && !V.includes(String(biz.geo.latitude)))
    miss.push(`geo.latitude = ${biz.geo.latitude} (not on page)`)
  if (miss.length) anyFail++
  summary.push({ rel, n: miss.length, miss, inLanguage: web.inLanguage, priceRange: 'priceRange' in biz, services: biz.hasOfferCatalog.itemListElement.length })
}
for (const s of summary)
  console.log(`${s.n ? 'FAIL' : 'ok  '} ${s.rel.padEnd(24)} services=${s.services} inLanguage=${JSON.stringify(s.inLanguage)} priceRange=${s.priceRange} unverifiable=${s.n}`)
console.log('\n--- detail for the worst offender ---')
const worst = summary.slice().sort((a, b) => b.n - a.n)[0]
console.log(worst.rel + ':')
worst.miss.forEach((m) => console.log('   ✗ ' + m))
console.log(`\npages whose JSON-LD asserts content NOT visible on that page: ${anyFail}/${summary.length}`)
console.log('per-page unverifiable counts:', summary.map((s) => `${s.rel}=${s.n}`).join('  '))
