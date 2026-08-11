/**
 * L7-06c — root-cause the inconsistent "2D fills continue while hidden" result
 * and quantify the FrostHero loop's CPU cost.
 *
 * (1) rAF scheduling attribution: after flipping document.hidden, capture the
 *     stack of every subsequent requestAnimationFrame call → who re-arms the loop.
 * (2) CPU cost: CDP Performance.getMetrics TaskDuration over a 3 s idle window in
 *     three states that all exist in the product:
 *       a) idle on hero            (frost loop running, hero visible)
 *       b) idle on footer          (frost loop running, hero 14 800 px off-screen)
 *       c) idle on footer, prefers-reduced-motion: reduce (frost drawn once, stopped)
 *     (c) is the product's own control path, so the delta is the loop's own cost.
 * 5 reps for (1), 3 for (2).
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'

const L = []
const P = (s) => { L.push(s); console.log(s) }

const INIT = () => {
  window.__fill = 0; window.__gl = 0; window.__stacks = []; window.__cancel = 0; window.__trace = false
  const of = CanvasRenderingContext2D.prototype.fill
  CanvasRenderingContext2D.prototype.fill = function (...a) { window.__fill++; return of.apply(this, a) }
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!proto) continue
    for (const k of ['drawArrays', 'drawElements']) { const o = proto[k]; proto[k] = function (...a) { window.__gl++; return o.apply(this, a) } }
  }
  const orq = window.requestAnimationFrame
  window.requestAnimationFrame = function (cb) {
    if (window.__trace && window.__stacks.length < 12) window.__stacks.push(new Error().stack.split('\n').slice(1, 4).join(' | '))
    return orq.call(window, cb)
  }
  const oca = window.cancelAnimationFrame
  window.cancelAnimationFrame = function (id) { window.__cancel++; return oca.call(window, id) }
  const realHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window.__forceHidden ? true : realHidden ? realHidden.get.call(document) : false) })
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__forceHidden ? 'hidden' : 'visible') })
  window.__setHidden = (v) => { window.__forceHidden = v; document.dispatchEvent(new Event('visibilitychange')) }
}

const browser = await chromium.launch()

P('# L7-06c FrostHero loop — root cause of the inconsistent hidden-tab result, and CPU cost')
P('\n## (1) Who re-arms rAF after document.hidden becomes true? (5 reps, parked on #teknik)')
P('| rep | fills in 1st 500ms after hidden | fills 500–1500ms | WebGL draws after hidden | cancelAnimationFrame calls | first rAF stacks after hidden |')
P('|---|---|---|---|---|---|')
const diag = []
for (let i = 0; i < 5; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
  await page.waitForFunction(() => window.__gl > 0, null, { timeout: 30000 })
  await page.waitForFunction(() => window.__fill > 0, null, { timeout: 20000 })
  const r = await page.evaluate(async () => {
    window.__trace = true; window.__stacks = []
    const c0 = window.__cancel
    const f0 = window.__fill, g0 = window.__gl
    window.__setHidden(true)
    await new Promise((r) => setTimeout(r, 500))
    const f1 = window.__fill, g1 = window.__gl
    await new Promise((r) => setTimeout(r, 1000))
    return { a: f1 - f0, b: window.__fill - f1, g: window.__gl - g0, cancels: window.__cancel - c0, stacks: window.__stacks.slice(0, 3) }
  })
  diag.push(r)
  P(`| ${i} | ${r.a} | ${r.b} | ${r.g} | ${r.cancels} | ${JSON.stringify(r.stacks).replace(/\|/g, '/').slice(0, 220)} |`)
  await ctx.close()
}
P(`\nfills after hidden (500–1500 ms window) across 5 reps: ${diag.map((d) => d.b).join(', ')} → ${diag.every((d) => d.b === 0) ? 'ALWAYS stops' : diag.every((d) => d.b > 0) ? 'NEVER stops' : 'INCONSISTENT (quarantined)'}`)

P('\n## (2) Main-thread busy time over a 3000 ms idle window (CDP Performance.getMetrics TaskDuration)')
P('| state | rep | TaskDuration delta ms | busy % of 3000 ms | 2D fills | WebGL draws |')
P('|---|---|---|---|---|---|')
const states = [
  { name: 'a idle on hero (frost running)', park: 'top', reduce: false },
  { name: 'b idle on footer (frost running, 3D paused)', park: 'bottom', reduce: false },
  { name: 'c idle on footer, prefers-reduced-motion:reduce', park: 'bottom', reduce: true },
  { name: 'd idle on #teknik (frost + 3D both running)', park: 'teknik', reduce: false },
]
const agg = {}
for (const st of states) {
  agg[st.name] = []
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      reducedMotion: st.reduce ? 'reduce' : 'no-preference',
    })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await cdp.send('Performance.enable')
    await page.goto(BASE + '/', { waitUntil: 'load' })
    if (st.park === 'teknik') {
      await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
      await page.waitForFunction(() => window.__gl > 0, null, { timeout: 30000 }).catch(() => {})
    } else if (st.park === 'bottom') {
      await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
      await page.waitForFunction(() => window.__gl > 0, null, { timeout: 30000 }).catch(() => {})
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    }
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 })
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const m0 = await cdp.send('Performance.getMetrics')
    const c0 = await page.evaluate(() => ({ f: window.__fill, g: window.__gl }))
    const t0 = Date.now()
    await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)))
    const m1 = await cdp.send('Performance.getMetrics')
    const c1 = await page.evaluate(() => ({ f: window.__fill, g: window.__gl }))
    const get = (m, k) => (m.metrics.find((x) => x.name === k) || {}).value || 0
    const dt = get(m1, 'TaskDuration') - get(m0, 'TaskDuration')
    const span = Date.now() - t0
    agg[st.name].push({ dt: dt * 1000, pct: (dt * 1000 * 100) / span, f: c1.f - c0.f, g: c1.g - c0.g })
    P(`| ${st.name} | ${i} | ${round(dt * 1000)} | ${round((dt * 1000 * 100) / span, 1)} | ${c1.f - c0.f} | ${c1.g - c0.g} |`)
    await ctx.close()
  }
}
P('\nMedians:')
for (const [k, v] of Object.entries(agg)) {
  P(`- ${k}: TaskDuration ${round(median(v.map((x) => x.dt)))} ms (${rng(v.map((x) => round(x.dt)))}) = ${round(median(v.map((x) => x.pct)), 1)} % busy · fills ${median(v.map((x) => x.f))} · WebGL draws ${median(v.map((x) => x.g))}`)
}

await browser.close()
writeFileSync(new URL('./06c-frostdiag.md', import.meta.url), L.join('\n'))
console.log('\nwrote 06c-frostdiag.md')
