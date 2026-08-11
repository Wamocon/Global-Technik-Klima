// BLOCK 8b redo — attribute every requestAnimationFrame call to its originating script,
// so "does the loop pause out of view" can be answered per loop.
// Real tab hiding via a second foreground page. Technique: instrumentation + state transition.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__buckets = {}
  const orig = window.requestAnimationFrame
  window.requestAnimationFrame = function (cb) {
    let key = 'unknown'
    try {
      const st = new Error().stack || ''
      const m = st.match(/_astro\/([A-Za-z0-9._-]+)\.js/g)
      key = m ? [...new Set(m.map((x) => x.replace('_astro/', '').replace(/\.[A-Za-z0-9_-]{8}\.js$/, '').replace(/\.js$/, '')))].join('+') : (st.includes('FrostHero') ? 'FrostHero' : 'inline')
    } catch {}
    window.__buckets[key] = (window.__buckets[key] || 0) + 1
    return orig.call(window, cb)
  }
  window.__resetBuckets = () => { window.__buckets = {} }
})
await page.goto(BASE, { waitUntil: 'load' })

const measure = async (label, ms = 1500) => {
  await page.evaluate(() => window.__resetBuckets())
  await page.waitForTimeout(ms)
  const bk = await page.evaluate(() => window.__buckets)
  const perSec = Object.fromEntries(Object.entries(bk).map(([k, v]) => [k, Math.round((v / ms) * 1000)]))
  info(`${label.padEnd(52)} ${JSON.stringify(perSec)}`)
  return perSec
}
const total = (o) => Object.values(o).reduce((a, c) => a + c, 0)

console.log('\n===== 8b rAF attributed per script (calls/second) =====')
const top = await measure('at top (hero canvas in view)')
await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
await page.waitForTimeout(600)
const teknik = await measure('at #teknik (three.js in view, hero OFF-screen)')
await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
await page.waitForTimeout(1200)
const kontakt = await measure('at #kontakt (BOTH canvases off-screen)')

// real tab hide: front a second page
const other = await ctx.newPage()
await other.goto('about:blank')
await other.bringToFront()
await page.waitForTimeout(400)
const hidden = await (async () => {
  await page.evaluate(() => window.__resetBuckets())
  await new Promise((r) => setTimeout(r, 1500))
  const bk = await page.evaluate(() => window.__buckets)
  info(`while the tab is in the BACKGROUND (real visibilitychange)   ${JSON.stringify(bk)}  document.hidden=${await page.evaluate(() => document.hidden)}`)
  return bk
})()
await page.bringToFront()
await page.waitForTimeout(600)
const shown = await measure('foreground again, still at #kontakt')
await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
await page.waitForTimeout(900)
const teknik2 = await measure('back at #teknik after hide/show')
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(180)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(180)
}
await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
await page.waitForTimeout(900)
const teknik3 = await measure('at #teknik after 5 full up/down sweeps')

const frostKey = (o) => Object.keys(o).find((k) => /FrostHero|inline/.test(k))
const threeKey = (o) => Object.keys(o).find((k) => /ExplodedUnit|three/.test(k))

console.log('')
ok((teknik[threeKey(teknik)] || 0) > 30, '8b: the three.js loop runs while #teknik is in view', JSON.stringify(teknik))
ok((kontakt[threeKey(kontakt)] || 0) < 5, '8b: the three.js loop PAUSES when #teknik leaves the viewport', `three=${kontakt[threeKey(kontakt)] || 0}/s`)
ok((kontakt[frostKey(kontakt)] || 0) < 5, '8b: the hero frost loop PAUSES when the hero leaves the viewport', `frost=${kontakt[frostKey(kontakt)] || 0}/s (source: FrostHero.astro has no IntersectionObserver, only visibilitychange)`)
ok(Object.values(hidden).reduce((a, c) => a + c, 0) < 5, '8b: every rAF loop stops while the tab is backgrounded', JSON.stringify(hidden))
const t1 = total(teknik), t2 = total(teknik2), t3 = total(teknik3)
ok(Math.abs(t2 - t1) < t1 * 0.3, '8b: no duplicated loop after a real hide/show cycle', `${t1}/s -> ${t2}/s`)
ok(Math.abs(t3 - t1) < t1 * 0.3, '8b: no duplicated loop after 5 full-page scroll sweeps', `${t1}/s -> ${t3}/s`)
ok(total(shown) >= 30, '8b: loops resume after the tab returns to the foreground', `${total(shown)}/s`)
await page.screenshot({ path: `${DIR}/b8b-raf.png` })
await b.close()
