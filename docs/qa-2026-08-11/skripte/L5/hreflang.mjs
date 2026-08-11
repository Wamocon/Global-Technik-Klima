// L5 — hreflang / canonical / og reciprocity over every built page + sitemap agreement.
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'D:/01 Antigrafity Projekte/25 Global-Technik-Klima'
const DIST = join(ROOT, 'dist')
const ORIGIN = 'https://alanyagreeyetkilibayi.com.tr'

function walk(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (p.endsWith('.html')) acc.push(p)
  }
  return acc
}

const pages = walk(DIST)
  .filter((p) => !p.includes('angebot'))
  .map((p) => {
    const rel = relative(DIST, p).replace(/\\/g, '/')
    const urlPath = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '')
    return { file: rel, urlPath: urlPath.replace(/\/$/, '') || '/', src: readFileSync(p, 'utf8') }
  })

const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1]
const problems = []
const table = []

for (const p of pages) {
  const htmlLang = (p.src.match(/<html[^>]*lang="([^"]*)"/) || [])[1]
  const canonical = attr(p.src.match(/<link rel="canonical"[^>]*>/)?.[0] || '', 'href')
  const ogUrl = attr(p.src.match(/<meta property="og:url"[^>]*>/)?.[0] || '', 'content')
  const ogLocale = attr(p.src.match(/<meta property="og:locale"[^>]*>/)?.[0] || '', 'content')
  const ogAlts = [...p.src.matchAll(/<meta property="og:locale:alternate" content="([^"]*)"/g)].map((m) => m[1])
  const alts = [...p.src.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"\s*\/?>/g)].map((m) => ({
    hreflang: m[1], href: m[2],
  }))
  table.push({ file: p.file, urlPath: p.urlPath, htmlLang, canonical, ogUrl, ogLocale, ogAlts: ogAlts.join(','), n: alts.length,
    hreflangs: alts.map((a) => a.hreflang).join(' '), hrefs: alts.map((a) => a.href).join(' ') })

  const is404 = p.file === '404.html'
  // 1) five alternates
  if (alts.length !== 5) problems.push(`${p.file}: ${alts.length} hreflang links, expected 5 (4 + x-default)`)
  const langs = alts.map((a) => a.hreflang)
  for (const want of ['tr', 'ru', 'de', 'en', 'x-default'])
    if (!langs.includes(want)) problems.push(`${p.file}: hreflang "${want}" missing (has ${langs.join(',')})`)
  // 2) absolute
  for (const a of alts) if (!/^https?:\/\//.test(a.href)) problems.push(`${p.file}: hreflang ${a.hreflang} not absolute: ${a.href}`)
  // 3) x-default -> turkish root of THIS document
  const xd = alts.find((a) => a.hreflang === 'x-default')
  const trA = alts.find((a) => a.hreflang === 'tr')
  if (xd && trA && xd.href !== trA.href) problems.push(`${p.file}: x-default ${xd.href} != tr ${trA.href}`)
  // 4) same document, not homepage
  const doc = p.urlPath.replace(/^\/(de|ru|en)/, '') || '/'
  for (const a of alts) {
    if (a.hreflang === 'x-default') continue
    const want = ORIGIN + (a.hreflang === 'tr' ? doc : `/${a.hreflang}${doc === '/' ? '' : doc}`)
    if (a.href !== want) problems.push(`${p.file}: hreflang ${a.hreflang} = ${a.href}, expected ${want} (same document)`)
  }
  // 5) canonical self-referential
  const wantCanon = ORIGIN + (p.urlPath === '/' ? '/' : p.urlPath)
  if (!is404 && canonical !== wantCanon) problems.push(`${p.file}: canonical ${canonical} != own URL ${wantCanon}`)
  if (ogUrl !== canonical) problems.push(`${p.file}: og:url ${ogUrl} != canonical ${canonical}`)
  // 6) html lang
  const wantLang = p.urlPath.startsWith('/de') ? 'de' : p.urlPath.startsWith('/ru') ? 'ru' : p.urlPath.startsWith('/en') ? 'en' : 'tr'
  if (htmlLang !== wantLang) problems.push(`${p.file}: <html lang="${htmlLang}">, expected "${wantLang}"`)
  // 7) og:locale + alternates
  const OGL = { tr: 'tr_TR', de: 'de_DE', ru: 'ru_RU', en: 'en_US' }
  if (ogLocale !== OGL[wantLang]) problems.push(`${p.file}: og:locale ${ogLocale}, expected ${OGL[wantLang]}`)
  const wantAlts = Object.entries(OGL).filter(([k]) => k !== wantLang).map(([, v]) => v).sort().join(',')
  if (ogAlts.slice().sort().join(',') !== wantAlts) problems.push(`${p.file}: og:locale:alternate [${ogAlts}] expected [${wantAlts}]`)
}

// 8) reciprocity: A->B implies B->A, using the built set
const byUrl = new Map(pages.map((p) => [p.urlPath, p]))
for (const p of pages) {
  const alts = [...p.src.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)]
  for (const [, hl, href] of alts) {
    if (hl === 'x-default') continue
    const target = href.replace(ORIGIN, '') || '/'
    const tp = byUrl.get(target === '' ? '/' : target)
    if (!tp) { problems.push(`RECIPROCITY: ${p.file} -> ${href} — no such built page`); continue }
    const back = [...tp.src.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)]
      .some(([, , h]) => h === ORIGIN + (p.urlPath === '/' ? '/' : p.urlPath))
    if (!back) problems.push(`RECIPROCITY: ${p.file} -> ${target} but ${tp.file} has no link back to ${p.urlPath}`)
  }
}

// 9) sitemap agreement
const sm = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8')
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const smAlts = [...sm.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ hl: m[1], href: m[2] }))
console.log(`\n=== SITEMAP: ${locs.length} <loc>, ${smAlts.length} xhtml:link alternates`)
const smLangs = [...new Set(smAlts.map((a) => a.hl))]
console.log('sitemap hreflang values:', smLangs.join(', '))
const pageLangs = [...new Set(pages.flatMap((p) => [...p.src.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1])))]
console.log('page   hreflang values:', pageLangs.join(', '))
if (smLangs.sort().join(',') !== pageLangs.sort().join(','))
  problems.push(`SITEMAP: hreflang vocabulary differs. sitemap=[${smLangs}] pages=[${pageLangs}]`)
const smLocSet = new Set(locs)
for (const p of pages) {
  if (p.file === '404.html') { if (smLocSet.has(ORIGIN + p.urlPath) || smLocSet.has(ORIGIN + p.urlPath + '/')) problems.push('SITEMAP contains the 404 page'); continue }
  const exact = ORIGIN + (p.urlPath === '/' ? '/' : p.urlPath)
  const slash = exact.endsWith('/') ? exact : exact + '/'
  if (!smLocSet.has(exact) && !smLocSet.has(slash)) problems.push(`SITEMAP missing ${p.urlPath}`)
  else if (!smLocSet.has(exact) && smLocSet.has(slash))
    problems.push(`SITEMAP <loc> ${slash} has a trailing slash; the page's own canonical is ${exact} (no slash) — they disagree`)
}
// alternates in sitemap vs canonical form
const badSlash = smAlts.filter((a) => a.href.endsWith('/') && a.href !== ORIGIN + '/')
console.log(`sitemap alternates with trailing slash: ${badSlash.length}/${smAlts.length}`)

console.log('\n=== PER-PAGE TABLE ===')
for (const t of table) console.log(`${t.file.padEnd(26)} lang=${String(t.htmlLang).padEnd(3)} n=${t.n} [${t.hreflangs}]  canon=${t.canonical}  ogUrl=${t.ogUrl}  ogLoc=${t.ogLocale}  alt=[${t.ogAlts}]`)

console.log(`\n=== PROBLEMS (${problems.length}) ===`)
const seen = new Map()
for (const pr of problems) {
  const key = pr.replace(/^[^:]+:/, (m) => (/^(SITEMAP|RECIPROCITY)/.test(m) ? m : 'PAGE:'))
  seen.set(key, (seen.get(key) || 0) + 1)
}
problems.forEach((pr) => console.log('  ✗ ' + pr))
console.log('\n=== GROUPED ===')
for (const [k, v] of seen) console.log(`  ${v}×  ${k}`)
