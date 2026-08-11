/**
 * L7-06d — clean attribution of the FrostHero canvas cost.
 *
 * Confound in 06c: the prefers-reduced-motion control also removes GSAP.
 * Surgical control instead: keep everything, but force #frost to a 0x0 box and
 * fire a resize. FrostHero's own resize handler then re-seeds with
 * n = min(820, round(0*0/1700)) = 0 particles, so the rAF loop keeps ticking but
 * draws nothing. Difference between the two states = the drawing cost alone.
 * 3 reps each, parked on the footer (hero far off-screen) and on the hero.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'

const L = []
const P = (s) => { L.push(s); console.log(s) }
const INIT = () => {
  window.__fill = 0; window.__gl = 0
  const of = CanvasRenderingContext2D.prototype.fill
  CanvasRenderingContext2D.prototype.fill = function (...a) { window.__fill++; return of.apply(this, a) }
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!proto) continue
    for (const k of ['drawArrays', 'drawElements']) { const o = proto[k]; proto[k] = function (...a) { window.__gl++; return o.apply(this, a) } }
  }
}
const browser = await chromium.launch()

const cases = [
  { name: 'footer · frost drawing (as shipped)', park: 'bottom', neutralize: false, vp: [390, 844], dpr: 2, cpu: 4 },
  { name: 'footer · frost neutralised (0 particles)', park: 'bottom', neutralize: true, vp: [390, 844], dpr: 2, cpu: 4 },
  { name: 'hero · frost drawing (as shipped)', park: 'top', neutralize: false, vp: [390, 844], dpr: 2, cpu: 4 },
  { name: 'hero · frost neutralised (0 particles)', park: 'top', neutralize: true, vp: [390, 844], dpr: 2, cpu: 4 },
  { name: 'desktop 1440x900 hero · frost drawing, CPU 1x', park: 'top', neutralize: false, vp: [1440, 900], dpr: 1, cpu: 1 },
  { name: 'desktop 1440x900 hero · frost neutralised, CPU 1x', park: 'top', neutralize: true, vp: [1440, 900], dpr: 1, cpu: 1 },
]

P('# L7-06d FrostHero drawing cost, isolated (CDP Performance.getMetrics TaskDuration, 3000 ms idle windows)')
P('| case | rep | TaskDuration ms | busy % | 2D fills | fills/frame est |')
P('|---|---|---|---|---|---|')
const agg = {}
for (const c of cases) {
  agg[c.name] = []
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ viewport: { width: c.vp[0], height: c.vp[1] }, deviceScaleFactor: c.dpr })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    const cdp = await page.context().newCDPSession(page)
    if (c.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.cpu })
    await cdp.send('Performance.enable')
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await page.waitForFunction(() => window.__fill > 0, null, { timeout: 25000 })
    if (c.park === 'bottom') {
      await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
      await page.waitForFunction(() => window.__gl > 0, null, { timeout: 30000 }).catch(() => {})
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForFunction(() => { const g = window.__gl; return new Promise((r) => setTimeout(() => r(window.__gl === g), 400)) }, null, { timeout: 10000 }).catch(() => {})
    }
    if (c.neutralize) {
      await page.addStyleTag({ content: '#frost{width:0px !important;height:0px !important}' })
      await page.evaluate(() => dispatchEvent(new Event('resize')))
      // the handler is debounced 160 ms; wait on the observable outcome instead of sleeping
      await page.waitForFunction(() => { const f = window.__fill; return new Promise((r) => setTimeout(() => r(window.__fill === f), 350)) }, null, { timeout: 8000 }).catch(() => {})
    }
    const get = (m, k) => (m.metrics.find((x) => x.name === k) || {}).value || 0
    const m0 = await cdp.send('Performance.getMetrics')
    const f0 = await page.evaluate(() => window.__fill)
    const t0 = Date.now()
    await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)))
    const m1 = await cdp.send('Performance.getMetrics')
    const f1 = await page.evaluate(() => window.__fill)
    const span = Date.now() - t0
    const dt = (get(m1, 'TaskDuration') - get(m0, 'TaskDuration')) * 1000
    agg[c.name].push({ dt, pct: (dt * 100) / span, f: f1 - f0 })
    P(`| ${c.name} | ${i} | ${round(dt)} | ${round((dt * 100) / span, 1)} | ${f1 - f0} | ${round((f1 - f0) / ((span / 1000) * 60))} |`)
    await ctx.close()
  }
}
P('\nMedians:')
for (const [k, v] of Object.entries(agg)) P(`- ${k}: ${round(median(v.map((x) => x.dt)))} ms busy (${rng(v.map((x) => round(x.dt)))}), ${round(median(v.map((x) => x.pct)), 1)} % · fills ${median(v.map((x) => x.f))}`)
const d = (a, b) => round(median(agg[a].map((x) => x.dt)) - median(agg[b].map((x) => x.dt)))
P(`\nIsolated frost drawing cost per 3000 ms:`)
P(`- mobile, hero off-screen (footer): ${d('footer · frost drawing (as shipped)', 'footer · frost neutralised (0 particles)')} ms of main thread — 100 % of it invisible`)
P(`- mobile, hero on screen:          ${d('hero · frost drawing (as shipped)', 'hero · frost neutralised (0 particles)')} ms`)
P(`- desktop CPU 1x, hero on screen:  ${d('desktop 1440x900 hero · frost drawing, CPU 1x', 'desktop 1440x900 hero · frost neutralised, CPU 1x')} ms`)

await browser.close()
writeFileSync(new URL('./06d-frostcost.md', import.meta.url), L.join('\n'))
console.log('\nwrote 06d-frostcost.md')
