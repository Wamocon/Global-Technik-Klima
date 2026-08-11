// L3 — (6) zoom / text-scaling boundary  and  (7) content-count edges per locale.
// Techniques: boundary analysis on the CSS-pixel viewport implied by 200 % / 400 % zoom
// (WCAG 1.4.4 / 1.4.10), and equivalence-count comparison of every array-driven list
// across the four locales (the count is the invariant; a differing count is a defect).
import { chromium, BASE, DIR } from './pw.mjs'

const LOCALES = [['tr', '/'], ['de', '/de/'], ['ru', '/ru/'], ['en', '/en/']]
const LISTS = {
  'services .cards .card': '.cards .card',
  'products .prods .prod': '.prods .prod',
  'why tiles .tiles .tile': '.tiles .tile',
  'warranty .wtiers li': '.wtiers li',
  'reviews .revs .rev': '.revs .rev',
  'B2B segments .segs .seg': '.segs .seg',
  'B2B systems .systems .sys': '.systems .sys',
  'B2B steps .flow .step': '.flow .step',
  'exploded parts #expLegend li': '#expLegend li',
  'chat chips #cchips button': '#cchips button',
  'footer legal .foot .fl a': '.foot .fl a',
  'form service options': '#reqForm select[name="service"] option',
  'mainnav links .mainnav a': '.mainnav a',
  'mobnav links #mobnav a': '#mobnav a',
  'lang switch .lang a': '.lang a',
}

const browser = await chromium.launch()

// ───────────────────────── 7. CONTENT COUNTS ────────────────────────────────
console.log('=== 7. CONTENT-COUNT EDGES per locale ===')
const counts = {}
const jsonld = {}
for (const [code, url] of LOCALES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  counts[code] = await page.evaluate((sels) => {
    const o = {}
    for (const [k, s] of Object.entries(sels)) o[k] = document.querySelectorAll(s).length
    return o
  }, LISTS)
  jsonld[code] = await page.evaluate(() => {
    const out = []
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.textContent)
        const arr = Array.isArray(j) ? j : (j['@graph'] || [j])
        for (const n of arr) {
          const cat = n.hasOfferCatalog || n.makesOffer
          const items = cat?.itemListElement || (Array.isArray(cat) ? cat : null)
          out.push({ type: n['@type'], offerCount: items ? items.length : null, keys: Object.keys(n).length })
        }
      } catch (e) { out.push({ parseError: e.message }) }
    }
    return out
  })
  await ctx.close()
}
const keys = Object.keys(LISTS)
console.log('list'.padEnd(34) + ' | tr | de | ru | en | verdict')
let countFails = 0
for (const k of keys) {
  const v = LOCALES.map(([c]) => counts[c][k])
  const same = new Set(v).size === 1
  if (!same) countFails++
  console.log(`${k.padEnd(34)} | ${v.map((x) => String(x).padStart(2)).join(' | ')} | ${same ? 'consistent' : '*** MISMATCH ***'}`)
}
console.log(`\nlists with a differing count across locales: ${countFails}`)
console.log('\nJSON-LD nodes with an offer catalogue:')
for (const [c] of LOCALES) console.log(`  ${c}: ${JSON.stringify(jsonld[c])}`)

// ───────────────────────── 6. ZOOM / TEXT SCALING ───────────────────────────
console.log('\n=== 6. ZOOM / TEXT-SCALING BOUNDARIES ===')
const zoomCases = [
  { label: '100% @1280 (control)', w: 1280, h: 800, dsf: 1, root: null },
  { label: '200% @1280 -> 640 CSS px (WCAG 1.4.4)', w: 640, h: 400, dsf: 2, root: null },
  { label: '400% @1280 -> 320 CSS px (WCAG 1.4.10 reflow)', w: 320, h: 200, dsf: 4, root: null },
  { label: 'root font-size 24px @1280', w: 1280, h: 800, dsf: 1, root: '24px' },
  { label: 'root font-size 24px @390', w: 390, h: 844, dsf: 1, root: '24px' },
]
for (const z of zoomCases) {
  const ctx = await browser.newContext({ viewport: { width: z.w, height: z.h }, deviceScaleFactor: z.dsf })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  if (z.root) await page.evaluate((f) => { document.documentElement.style.fontSize = f }, z.root)
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
    window.scrollTo(0, 0); await new Promise((r) => requestAnimationFrame(r))
  })
  const r = await page.evaluate(() => {
    const iw = window.innerWidth
    const off = []
    for (const e of document.querySelectorAll('body *')) {
      const b = e.getBoundingClientRect()
      if (b.width && b.height && b.right > iw + 1) off.push({ s: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''), over: Math.round(b.right - iw) })
    }
    off.sort((a, b) => b.over - a.over)
    const clipped = []
    // key interactive targets must be fully inside the viewport
    for (const sel of ['#burger', '.themetog', '.lang', '#chatfab', '.mobar', '.wafab', '#ca', '#cp', '#ccta', '#reqForm button[type="submit"]', '#cin']) {
      const e = document.querySelector(sel); if (!e) continue
      const cs = getComputedStyle(e); if (cs.display === 'none') continue
      const b = e.getBoundingClientRect()
      if (b.right > iw + 1 || b.left < -1) clipped.push({ sel, left: Math.round(b.left), right: Math.round(b.right), iw })
    }
    return { docSW: document.documentElement.scrollWidth, iw, offenders: off.slice(0, 5), clipped }
  })
  console.log(`\n  ${z.label}`)
  console.log(`    docScrollWidth=${r.docSW} innerWidth=${r.iw} -> ${r.docSW > r.iw ? 'HORIZONTAL OVERFLOW +' + (r.docSW - r.iw) + 'px' : 'no overflow'}`)
  console.log(`    right-edge offenders: ${r.offenders.length ? JSON.stringify(r.offenders) : '(none)'}`)
  console.log(`    key controls out of the viewport: ${r.clipped.length ? JSON.stringify(r.clipped) : '(none)'}`)
  console.log(`    page errors: ${errs.length ? errs.join('|') : '(none)'}`)
  await page.screenshot({ path: `${DIR}/zoom-${z.label.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.png` })
  await ctx.close()
}
await browser.close()
