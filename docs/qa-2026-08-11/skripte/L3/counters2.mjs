// L3 — counters, take 2. Per-frame (rAF) sampling of what is actually painted,
// so the wait condition can never be satisfied before the animation starts.
import { chromium, BASE, DIR } from './pw.mjs'

const LOCALES = [{ code: 'tr', url: '/' }, { code: 'de', url: '/de/' }, { code: 'ru', url: '/ru/' }, { code: 'en', url: '/en/' }]
const RUNS = Number(process.argv[2] || 1)
const browser = await chromium.launch()
for (let run = 1; run <= RUNS; run++) {
  console.log(`\n################ RUN ${run} ################`)
  for (const loc of LOCALES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
    await page.goto(BASE + loc.url, { waitUntil: 'networkidle' })
    const lang = await page.getAttribute('html', 'lang')
    const expRating = '★ ' + (5).toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

    await page.evaluate(() => {
      window.__f = []
      window.__done = false
      const a = document.querySelector('[data-count="5"]'), b = document.querySelector('.ab-n')
      const t0 = performance.now()
      const tick = () => {
        window.__f.push([Math.round(performance.now() - t0), a?.textContent, b?.textContent])
        if (performance.now() - t0 < 4000) requestAnimationFrame(tick); else window.__done = true
      }
      requestAnimationFrame(tick)
    })
    await page.locator('.ab-stat').first().scrollIntoViewIfNeeded()
    await page.waitForFunction(() => window.__done === true, null, { timeout: 12000 })
    const f = await page.evaluate(() => window.__f)

    // distinct painted strings, in order of first appearance
    const seq = []
    f.forEach(([t, r, c]) => { const k = r + '|' + c; if (!seq.length || seq[seq.length - 1].k !== k) seq.push({ t, k, r, c }) })
    const numeric = (s) => Number(String(s).replace('★', '').trim().replace(/\s/g, '').replace(',', '.'))
    const ratingVals = seq.map((x) => numeric(x.r)).filter((n) => Number.isFinite(n))
    const countVals = seq.map((x) => Number(x.c)).filter((n) => Number.isFinite(n))
    console.log(`\n--- ${loc.code} (lang=${lang}) frames=${f.length} distinct painted states=${seq.length}`)
    console.log(`  painted sequence (first 12): ${JSON.stringify(seq.slice(0, 12).map((x) => [x.t, x.r, x.c]))}`)
    console.log(`  final painted: ${JSON.stringify(seq[seq.length - 1] && [seq[seq.length - 1].t, seq[seq.length - 1].r, seq[seq.length - 1].c])}`)
    console.log(`  MIN rating ever painted: ${Math.min(...ratingVals)}   MIN review count ever painted: ${Math.min(...countVals)}`)
    console.log(`  rating regressed below its SSR value 5,0 ? ${Math.min(...ratingVals) < 5 ? 'YES' : 'no'}`)
    console.log(`  review count regressed below its SSR value 65 ? ${Math.min(...countVals) < 65 ? 'YES' : 'no'}`)
    console.log(`  final rating string "${seq[seq.length - 1]?.r}" ; locale-correct "${expRating}" -> ${seq[seq.length - 1]?.r === expRating ? 'OK' : 'MISMATCH'}`)
    console.log(`  errors: ${errs.length ? errs.join('|') : '(none)'}`)
    if (run === 1 && Math.min(...ratingVals) < 5) {
      // capture the low point visually by re-triggering in a fresh page
      const p2 = await ctx.newPage()
      await p2.goto(BASE + loc.url, { waitUntil: 'networkidle' })
      await p2.locator('.ab-stat').first().scrollIntoViewIfNeeded()
      await p2.waitForFunction(() => { const t = document.querySelector('[data-count="5"]')?.textContent || ''; const n = Number(t.replace('★', '').trim().replace(',', '.')); return Number.isFinite(n) && n < 4.0 }, null, { timeout: 5000 }).catch(() => {})
      const bb = await p2.locator('.ab-stat').first().boundingBox()
      if (bb) await p2.screenshot({ path: `${DIR}/counter-lowpoint-${loc.code}.png`, clip: { x: Math.max(0, bb.x - 24), y: Math.max(0, bb.y - 24), width: 460, height: 130 } })
      await p2.close()
    }
    await ctx.close()
  }
}
await browser.close()
