// L3 — BOUNDARY VALUE ANALYSIS on the BTU calculator.
// Technique: 3-value BVA on both input fields + equivalence-partition boundary of the
// snap() output partitions (midpoints between consecutive device steps).
import { chromium, BASE } from './pw.mjs'

const LOCALES = [
  { code: 'tr', url: '/', lang: 'tr' },
  { code: 'de', url: '/de/', lang: 'de' },
  { code: 'ru', url: '/ru/', lang: 'ru' },
  { code: 'en', url: '/en/', lang: 'en' },
]

// Mirror of the production formula (src/components/Home.astro:551-562)
const STEP = [9000, 12000, 18000, 24000, 36000, 48000]
const snapDown = (v) => STEP.reduce((p, s) => (Math.abs(s - v) < Math.abs(p - v) ? s : p))
const snapUpTie = (v) => STEP.reduce((p, s) => (Math.abs(s - v) <= Math.abs(p - v) ? s : p))
const model = (areaRaw, pplRaw, sun) => {
  const a = Math.max(6, Math.min(200, Number(areaRaw) || 25))
  const p = Math.max(1, Math.min(12, Number(pplRaw) || 2))
  let btu = a * 550 + Math.max(0, p - 2) * 600
  if (sun) btu *= 1.15
  return { a, p, raw: btu, val: snapDown(btu), altTieUp: snapUpTie(btu) }
}

// ---- test tables -----------------------------------------------------------
const CASES = []
const push = (block, area, ppl, sun, note = '') => CASES.push({ block, area, ppl, sun, note })

// Block 1: 3-value BVA on #ca (min=6, max=200), people at nominal 2, sun off
;['5', '6', '7', '199', '200', '201'].forEach((a) => push('BVA-area', a, '2', 0))
// negative-edge of the same field
;['0', '-1', '', '1e3', '6.5', '5.9999'].forEach((a) => push('BVA-area-neg', a, '2', 0))

// Block 2: 3-value BVA on #cp (min=1, max=12), area at nominal 25, sun off
;['0', '1', '2', '11', '12', '13'].forEach((p) => push('BVA-people', '25', p, 0))
;['-1', ''].forEach((p) => push('BVA-people-neg', '25', p, 0))

// Block 3: snap() output-partition boundaries — exact midpoints, 3-value each
const MIDS = [
  { mid: 10500, area: 18, ppl: 3, lo: 9000, hi: 12000 },
  { mid: 15000, area: 24, ppl: 5, lo: 12000, hi: 18000 },
  { mid: 21000, area: 36, ppl: 4, lo: 18000, hi: 24000 },
  { mid: 30000, area: 48, ppl: 8, lo: 24000, hi: 36000 },
  { mid: 42000, area: 72, ppl: 6, lo: 36000, hi: 48000 },
]
MIDS.forEach((m) => {
  push('SNAP-mid', String(m.area - 1), String(m.ppl), 0, `below mid ${m.mid}`)
  push('SNAP-mid', String(m.area), String(m.ppl), 0, `EXACT mid ${m.mid} (tie ${m.lo}/${m.hi})`)
  push('SNAP-mid', String(m.area + 1), String(m.ppl), 0, `above mid ${m.mid}`)
})

// Block 4: domain extremes / saturation
push('EXTREME', '6', '1', 0, 'absolute minimum')
push('EXTREME', '6', '1', 1, 'minimum + sun')
push('EXTREME', '200', '12', 0, 'maximum, no sun')
push('EXTREME', '200', '12', 1, 'absolute maximum')
push('EXTREME', '500', '12', 1, 'over max -> silently clamped')
push('EXTREME', '87', '2', 0, 'first area that reaches 48000 step?')

// ---------------------------------------------------------------------------
const results = []
const consoleErrs = []

const browser = await chromium.launch()
for (const loc of LOCALES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(`[${loc.code}] ${m.text()}`) })
  page.on('pageerror', (e) => consoleErrs.push(`[${loc.code}] PAGEERROR ${e.message}`))
  await page.goto(BASE + loc.url, { waitUntil: 'networkidle' })

  const htmlLang = await page.getAttribute('html', 'lang')
  // SSR value of #cbtu before any interaction, and the SSR rating value
  const ssr = await page.evaluate(() => ({
    cbtu: document.querySelector('#cbtu')?.textContent,
    rating: document.querySelector('.ab-stat b[data-count="5"]')?.textContent,
    reviewN: document.querySelector('.ab-n')?.textContent,
  }))

  // wait for calc() to have run (it rewrites #ccta href to include ?text=)
  await page.waitForFunction(() => (document.querySelector('#ccta')?.getAttribute('href') || '').includes('?text='))

  const ca = page.locator('#ca'), cp = page.locator('#cp')
  let sunState = 0
  for (const c of CASES) {
    if (c.sun !== sunState) {
      await page.locator(`[data-sun="${c.sun}"]`).click()
      sunState = c.sun
    }
    await ca.fill(String(c.area))
    await cp.fill(String(c.ppl))
    // deterministic wait: the href must reflect the new (a,p) pair
    const exp = model(c.area, c.ppl, c.sun)
    await page.waitForFunction(
      ([a, p]) => {
        const h = decodeURIComponent(document.querySelector('#ccta')?.getAttribute('href') || '')
        return h.includes(`· ${a} m² ·`) && h.includes(`· ${p} kişi`)
      },
      [exp.a, exp.p],
      { timeout: 4000 },
    ).catch(() => {})
    const obs = await page.evaluate(() => ({
      out: document.querySelector('#cbtu').textContent,
      href: document.querySelector('#ccta').getAttribute('href'),
      fieldArea: document.querySelector('#ca').value,
      fieldPpl: document.querySelector('#cp').value,
    }))
    const text = decodeURIComponent((obs.href.split('?text=')[1] || ''))
    results.push({
      locale: loc.code, lang: htmlLang, block: c.block, note: c.note,
      in: { area: c.area, ppl: c.ppl, sun: c.sun },
      expA: exp.a, expP: exp.p, raw: Math.round(exp.raw * 100) / 100,
      expVal: exp.val, tieUpWouldBe: exp.altTieUp,
      obsOut: obs.out,
      obsIntlForLang: exp.val.toLocaleString(htmlLang),
      obsIntlTr: exp.val.toLocaleString('tr-TR'),
      deeplinkText: text,
      fieldArea: obs.fieldArea, fieldPpl: obs.fieldPpl,
      ssrCbtu: ssr.cbtu, ssrRating: ssr.rating, ssrReviewN: ssr.reviewN,
    })
  }
  await ctx.close()
}
await browser.close()

// ---- report ---------------------------------------------------------------
const fmt = (r) => `${r.locale}|${r.block}|a=${JSON.stringify(r.in.area)} p=${JSON.stringify(r.in.ppl)} sun=${r.in.sun}` +
  ` -> clamped(${r.expA},${r.expP}) raw=${r.raw} expSnap=${r.expVal} obs="${r.obsOut}"` +
  ` intl(${r.lang})="${r.obsIntlForLang}" tie-up-would-be=${r.tieUpWouldBe}` +
  ` | field shows a="${r.fieldArea}" p="${r.fieldPpl}"` +
  ` | link="${r.deeplinkText}"` + (r.note ? `  [${r.note}]` : '')

console.log('=== RAW RESULTS ===')
results.forEach((r) => console.log(fmt(r)))

console.log('\n=== SSR (pre-JS) VALUES PER LOCALE ===')
const seen = new Set()
results.forEach((r) => { if (!seen.has(r.locale)) { seen.add(r.locale); console.log(`${r.locale} (lang=${r.lang}): #cbtu SSR="${r.ssrCbtu}"  rating SSR="${r.ssrRating}"  reviewN SSR="${r.ssrReviewN}"`) } })

console.log('\n=== MISMATCH: rendered output vs locale-correct Intl ===')
const localeMismatch = results.filter((r) => r.obsOut !== r.obsIntlForLang)
const uniq = new Map()
localeMismatch.forEach((r) => uniq.set(`${r.locale}|${r.expVal}`, r))
;[...uniq.values()].forEach((r) => console.log(`  ${r.locale}: value ${r.expVal} rendered as "${r.obsOut}" — locale-correct would be "${r.obsIntlForLang}"`))
console.log(`  total mismatching cases: ${localeMismatch.length}/${results.length}`)

console.log('\n=== TIE-BREAK DIRECTION AT EXACT MIDPOINTS ===')
results.filter((r) => r.note.startsWith('EXACT')).forEach((r) =>
  console.log(`  ${r.locale}: a=${r.in.area} p=${r.in.ppl} raw=${r.raw} -> shown ${r.expVal} (down); nearest-up would be ${r.tieUpWouldBe}; observed text "${r.obsOut}"`))

console.log('\n=== SATURATION ===')
results.filter((r) => r.block === 'EXTREME').forEach((r) =>
  console.log(`  ${r.locale}: in(${r.in.area},${r.in.ppl},sun=${r.in.sun}) raw=${r.raw} -> ${r.expVal}  shortfall=${(r.raw - r.expVal).toFixed(0)} BTU (${((1 - r.expVal / r.raw) * 100).toFixed(1)}%)`))

console.log('\n=== CONSOLE ERRORS ===')
console.log(consoleErrs.length ? consoleErrs.join('\n') : '(none)')
