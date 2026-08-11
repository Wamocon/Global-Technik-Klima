// L2 — INVALID ROUTES (negative URL equivalence classes)
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')
const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L2'

const PATHS = [
  ['valid control /', '/'],
  ['valid control /de/', '/de/'],
  ['unknown locale', '/xx/'],
  ['unknown page in locale', '/de/nope'],
  ['legal + extra segment', '/kvkk/extra'],
  ['case variant', '/KVKK'],
  ['locale without trailing slash', '/de'],
  ['double slash', '//'],
  ['triple slash', '///'],
  ['query + fragment on unknown', '/nope?a=b&x=%3Cscript%3E#frag'],
  ['query on valid root', '/?utm_source=test#randevu'],
  ['very long path', '/' + 'a'.repeat(2000)],
  ['deep nesting', '/a/b/c/d/e/f/g/h'],
  ['dot segments', '/de/../kvkk'],
  ['encoded traversal', '/%2e%2e%2f%2e%2e%2fetc/passwd'],
  ['null byte', '/de/%00'],
  ['trailing dot', '/kvkk.'],
  ['index.html', '/index.html'],
  ['404.html direct', '/404.html'],
  ['extra locale prefix', '/de/de/'],
  ['locale of legal doc', '/de/kvkk'],
  ['locale of legal doc slash', '/de/kvkk/'],
  ['api endpoint (GET)', '/api/chat'],
  ['angebot (found in dist)', '/angebot'],
  ['angebot with locale', '/de/angebot'],
  ['emoji path', '/%F0%9F%92%A9'],
  ['space in path', '/de%20'],
  ['upper locale', '/DE/'],
  ['sitemap typo', '/sitemap.xml'],
  ['robots case', '/Robots.txt'],
]

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  console.log('label | path | status | title | h1/len | 4 locale links present | canonical | noindex')
  const rows = []
  for (const [label, p] of PATHS) {
    let status = 'ERR', info = {}
    try {
      const r = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 20000 })
      status = r ? r.status() : 'no-response'
      info = await page.evaluate(() => {
        const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
        const norm = (h) => (h || '').replace(/^https?:\/\/[^/]+/, '') || '/'
        const set = new Set(hrefs.map(norm))
        const has = (x) => [...set].some((h) => h === x || h === x + '/' || h.startsWith(x + '#') || h.startsWith(x + '/#'))
        return {
          title: document.title.slice(0, 60),
          h1: (document.querySelector('h1') || {}).textContent?.trim().slice(0, 50) || '(none)',
          textLen: document.body.innerText.trim().length,
          loc: { tr: has('/'), de: has('/de'), ru: has('/ru'), en: has('/en') },
          canonical: (document.querySelector('link[rel=canonical]') || {}).href || '(none)',
          robots: (document.querySelector('meta[name=robots]') || {}).content || '(none)',
          finalUrl: location.pathname + location.search,
        }
      })
    } catch (e) { info = { err: e.message.split('\n')[0] } }
    const all4 = info.loc ? Object.values(info.loc).every(Boolean) : false
    rows.push({ label, p, status, all4, ...info })
    console.log(`${label} | ${p.length > 40 ? p.slice(0, 40) + `…(${p.length})` : p} | ${status} | ${JSON.stringify(info.title)} | h1=${JSON.stringify(info.h1)} len=${info.textLen} | 4-loc=${all4} ${JSON.stringify(info.loc)} | canon=${info.canonical} | robots=${info.robots} | final=${info.finalUrl || ''}${info.err ? ' | ERR=' + info.err : ''}`)
  }
  // POST to the api endpoint (the chat's real call)
  const post = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'x', locale: 'tr' }) })
      return { status: r.status, ct: r.headers.get('content-type'), body: (await r.text()).slice(0, 120) }
    } catch (e) { return { err: String(e) } }
  })
  console.log('\nPOST /api/chat →', JSON.stringify(post))

  // 404 page screenshot + language reachability proof
  await page.goto(BASE + '/xx/', { waitUntil: 'domcontentloaded' })
  await page.screenshot({ path: DIR + '/route_404.png', fullPage: false })
  const nav = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))
  console.log('\n404 page links:', JSON.stringify([...new Set(nav)]))

  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
