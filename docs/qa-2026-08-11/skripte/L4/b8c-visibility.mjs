// BLOCK 8c — test the visibilitychange HANDLERS directly (headless Chromium keeps
// document.hidden === false when another page is fronted, so the handler contract must be
// exercised by overriding document.hidden and dispatching the event).
// Technique: contract testing of the documented behaviour.
import { chromium } from './pw.mjs'
import { ok, info } from './lib.mjs'
import { BASE } from './lib.mjs'

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
      key = m ? [...new Set(m.map((x) => x.replace('_astro/', '').replace(/\.[A-Za-z0-9_-]{8}\.js$/, '')))].join('+') : 'inline(FrostHero)'
    } catch {}
    window.__buckets[key] = (window.__buckets[key] || 0) + 1
    return orig.call(window, cb)
  }
  window.__reset = () => { window.__buckets = {} }
  window.__fakeHidden = (v) => {
    Object.defineProperty(document, 'hidden', { get: () => v, configurable: true })
    Object.defineProperty(document, 'visibilityState', { get: () => (v ? 'hidden' : 'visible'), configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  }
})
await page.goto(BASE, { waitUntil: 'load' })
await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
await page.waitForTimeout(800)

const measure = async (label, ms = 1500) => {
  await page.evaluate(() => window.__reset())
  await page.waitForTimeout(ms)
  const bk = await page.evaluate(() => window.__buckets)
  const ps = Object.fromEntries(Object.entries(bk).map(([k, v]) => [k, Math.round((v / ms) * 1000)]))
  info(`${label.padEnd(46)} ${JSON.stringify(ps)}`)
  return ps
}
const key = (o, re) => Object.keys(o).find((k) => re.test(k))

console.log('\n===== 8c visibilitychange handler contract =====')
const visible = await measure('visible, #teknik in view')
await page.evaluate(() => window.__fakeHidden(true))
await page.waitForTimeout(300)
const hidden = await measure('document.hidden = true (event dispatched)')
await page.evaluate(() => window.__fakeHidden(false))
await page.waitForTimeout(400)
const again = await measure('document.hidden = false again')
await page.evaluate(() => window.__fakeHidden(true))
await page.evaluate(() => window.__fakeHidden(false))
await page.evaluate(() => window.__fakeHidden(true))
await page.evaluate(() => window.__fakeHidden(false))
await page.waitForTimeout(500)
const afterFlaps = await measure('after 3 more hide/show flaps (double-loop check)')

const t = (o) => Object.values(o).reduce((a, c) => a + c, 0)
const threeV = visible[key(visible, /ExplodedUnit/)] || 0
const threeH = hidden[key(hidden, /ExplodedUnit/)] || 0
const frostV = visible[key(visible, /inline/)] || 0
const frostH = hidden[key(hidden, /inline/)] || 0
ok(threeH < 5, '8c: ExplodedUnit rAF stops on visibilitychange->hidden', `${threeV}/s -> ${threeH}/s`)
ok(frostH < 5, '8c: FrostHero rAF stops on visibilitychange->hidden', `${frostV}/s -> ${frostH}/s`)
ok((again[key(again, /ExplodedUnit/)] || 0) > 30, '8c: ExplodedUnit rAF resumes when visible again', `${again[key(again, /ExplodedUnit/)] || 0}/s`)
ok((again[key(again, /inline/)] || 0) > 30, '8c: FrostHero rAF resumes when visible again', `${again[key(again, /inline/)] || 0}/s`)
ok(Math.abs(t(afterFlaps) - t(visible)) < t(visible) * 0.3, '8c: repeated hide/show flapping does not stack loops', `${t(visible)}/s -> ${t(afterFlaps)}/s`)
await b.close()
