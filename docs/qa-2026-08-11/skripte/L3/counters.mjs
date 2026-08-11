// L3 — number-rendering edges: animated counters (rating 5,0 / review count 65)
// and the calculator output, in all 4 locales. Technique: boundary analysis on the
// animation's value domain (t=0 boundary, t=end boundary) + locale-format oracle.
import { chromium, BASE, DIR } from './pw.mjs'

const LOCALES = [
  { code: 'tr', url: '/' }, { code: 'de', url: '/de/' },
  { code: 'ru', url: '/ru/' }, { code: 'en', url: '/en/' },
]
const browser = await chromium.launch()
const out = []
for (const loc of LOCALES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await page.goto(BASE + loc.url, { waitUntil: 'networkidle' })
  const lang = await page.getAttribute('html', 'lang')
  const expRating = '★ ' + (5).toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const expCount = (65).toLocaleString(lang)

  const ssr = await page.evaluate(() => ({
    rating: document.querySelector('[data-count="5"]')?.textContent,
    count: document.querySelector('.ab-n')?.textContent,
    cbtu: document.querySelector('#cbtu')?.textContent,
  }))

  // install samplers BEFORE the counters are triggered
  await page.evaluate(() => {
    window.__s = { rating: [], count: [] }
    const t0 = performance.now()
    const watch = (sel, key) => {
      const el = document.querySelector(sel)
      if (!el) return
      window.__s[key].push([0, el.textContent])
      new MutationObserver(() => window.__s[key].push([Math.round(performance.now() - t0), el.textContent]))
        .observe(el, { childList: true, characterData: true, subtree: true })
    }
    watch('[data-count="5"]', 'rating')
    watch('.ab-n', 'count')
  })

  await page.locator('.ab-stat').first().scrollIntoViewIfNeeded()
  // deterministic: wait until BOTH counters have reached their end value
  await page.waitForFunction(
    ([r, c]) => document.querySelector('[data-count="5"]')?.textContent === r &&
                document.querySelector('.ab-n')?.textContent === c,
    [expRating, expCount], { timeout: 8000 },
  ).catch(() => {})

  const s = await page.evaluate(() => window.__s)
  const rest = await page.evaluate(() => ({
    rating: document.querySelector('[data-count="5"]')?.textContent,
    count: document.querySelector('.ab-n')?.textContent,
    cbtu: document.querySelector('#cbtu')?.textContent,
  }))
  await page.screenshot({ path: `${DIR}/counter-${loc.code}.png`, clip: await page.locator('.ab-stat').first().boundingBox().then((b) => ({ x: Math.max(0, b.x - 20), y: Math.max(0, b.y - 20), width: 420, height: 120 })) }).catch(() => {})
  out.push({ loc: loc.code, lang, ssr, rest, expRating, expCount, s, errs })
  await ctx.close()
}
await browser.close()

for (const o of out) {
  console.log(`\n===== locale ${o.loc} (html lang="${o.lang}") =====`)
  console.log(`  SSR (pre-animation)  rating="${o.ssr.rating}"  count="${o.ssr.count}"  #cbtu="${o.ssr.cbtu}"`)
  console.log(`  AT REST              rating="${o.rest.rating}"  count="${o.rest.count}"  #cbtu="${o.rest.cbtu}"`)
  console.log(`  locale-correct       rating="${o.expRating}"    count="${o.expCount}"`)
  console.log(`  rating SSR correct?  ${o.ssr.rating === o.expRating ? 'YES' : 'NO  <-- SSR shows the wrong decimal separator'}`)
  console.log(`  rating rest correct? ${o.rest.rating === o.expRating ? 'YES' : 'NO'}`)
  const r = o.s.rating, c = o.s.count
  console.log(`  rating frames: ${r.length}  first 6: ${JSON.stringify(r.slice(0, 6))}`)
  console.log(`  rating last 3 : ${JSON.stringify(r.slice(-3))}`)
  console.log(`  count  frames: ${c.length}  first 6: ${JSON.stringify(c.slice(0, 6))}`)
  console.log(`  count  last 3 : ${JSON.stringify(c.slice(-3))}`)
  // how long does the rating show something BELOW 5 (i.e. a worse rating than reality)?
  const isFinal = (t) => t === o.expRating
  const firstFinal = r.findIndex((x, i) => i > 0 && isFinal(x[1]))
  const startAnim = r.findIndex((x, i) => i > 0)
  if (firstFinal > 0) console.log(`  rating displayed a value BELOW the real 5,0 from t=${r[startAnim][0]}ms to t=${r[firstFinal][0]}ms (${r[firstFinal][0] - r[startAnim][0]}ms)`)
  const lowFrames = r.filter((x, i) => i > 0 && /(^| )★ 0[.,]/.test(x[1]))
  console.log(`  frames where the rating literally read "★ 0,0"/"★ 0.0": ${lowFrames.length} ${JSON.stringify(lowFrames.slice(0, 3))}`)
  const zeroCount = c.filter((x, i) => i > 0 && x[1] === '0')
  console.log(`  frames where the review count literally read "0": ${zeroCount.length} ${JSON.stringify(zeroCount.slice(0, 3))}`)
  console.log(`  console/page errors: ${o.errs.length ? o.errs.join(' | ') : '(none)'}`)
}
