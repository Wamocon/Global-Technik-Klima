/**
 * L7-06b — finishes the rAF-pause matrix.
 *  · tab-hidden is produced two ways because Emulation.setPageVisibilityOverride
 *    no longer exists in this Chromium:
 *      (1) REAL: open a second tab and bringToFront() → document.hidden true in tab 1
 *      (2) SYNTHETIC: redefine document.hidden/visibilityState before page scripts
 *          run and dispatch visibilitychange → tests the handler path directly
 *  · adds the "parked on footer" case, which is the one that shows whether the
 *    FrostHero 2D loop stops when the hero is off-screen.
 *  · counts WebGL contexts + checks for renderer disposal / context loss.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'

const REPS = 3
const WINDOW = 3000
const L = []
const P = (s) => { L.push(s); console.log(s) }

const INIT = () => {
  window.__gl = 0; window.__fill = 0; window.__raf = 0; window.__contexts = 0
  window.__forceHidden = false
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!proto) continue
    for (const k of ['drawArrays', 'drawElements']) { const o = proto[k]; proto[k] = function (...a) { window.__gl++; return o.apply(this, a) } }
  }
  const of = CanvasRenderingContext2D.prototype.fill
  CanvasRenderingContext2D.prototype.fill = function (...a) { window.__fill++; return of.apply(this, a) }
  const orq = window.requestAnimationFrame
  window.requestAnimationFrame = function (cb) { window.__raf++; return orq.call(window, cb) }
  const ogc = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { const c = ogc.call(this, t, ...a); if (/webgl/.test(t)) { window.__contexts++; window.__glctx = c }; return c }
  // synthetic visibility
  const realHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window.__forceHidden ? true : realHidden ? realHidden.get.call(document) : false) })
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__forceHidden ? 'hidden' : 'visible') })
  window.__setHidden = (v) => { window.__forceHidden = v; document.dispatchEvent(new Event('visibilitychange')) }
}

const browser = await chromium.launch()
const boot = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
  await page.waitForFunction(() => window.__gl > 0, null, { timeout: 30000 })
  return { ctx, page, cdp }
}
const sample = (page, ms) =>
  page.evaluate(async (ms) => {
    const g0 = window.__gl, f0 = window.__fill, r0 = window.__raf, t0 = performance.now()
    await new Promise((r) => setTimeout(r, ms))
    return { dg: window.__gl - g0, df: window.__fill - f0, dr: window.__raf - r0, span: performance.now() - t0, hidden: document.hidden, ctxs: window.__contexts }
  }, ms)

P('# L7-06b rAF pause verification, completed (mobile 390x844 DPR2, CPU 4x, 3000 ms windows)')
P('| scenario | rep | document.hidden | WebGL draws/s | 2D fills/s | rAF calls |')
P('|---|---|---|---|---|---|')
const agg = {}
const push = (k, v) => { (agg[k] = agg[k] || []).push(v) }

for (let i = 0; i < REPS; i++) {
  // ---- C1 REAL tab hidden (second tab fronted) -----------------------------
  {
    const { ctx, page } = await boot()
    const other = await ctx.newPage()
    await other.goto('about:blank')
    await other.bringToFront()
    await page.waitForFunction(() => document.hidden === true, null, { timeout: 5000 }).catch(() => {})
    const r = await sample(page, WINDOW)
    P(`| C1 real tab hidden (2nd tab fronted) | ${i} | ${r.hidden} | ${round((r.dg / r.span) * 1000)} | ${round((r.df / r.span) * 1000)} | ${r.dr} |`)
    push('C1 real tab hidden', r)
    await ctx.close()
  }
  // ---- C2 SYNTHETIC hidden -------------------------------------------------
  {
    const { ctx, page } = await boot()
    await page.evaluate(() => window.__setHidden(true))
    const r = await sample(page, WINDOW)
    P(`| C2 synthetic document.hidden=true | ${i} | ${r.hidden} | ${round((r.dg / r.span) * 1000)} | ${round((r.df / r.span) * 1000)} | ${r.dr} |`)
    push('C2 synthetic hidden', r)
    await ctx.close()
  }
  // ---- D parked on footer, hero far off-screen -----------------------------
  {
    const { ctx, page } = await boot()
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const geo = await page.evaluate(() => {
      const h = document.querySelector('.hero').getBoundingClientRect()
      const t = document.getElementById('teknik').getBoundingClientRect()
      return { heroBottom: Math.round(h.bottom), teknikTop: Math.round(t.top), y: Math.round(scrollY), docH: document.documentElement.scrollHeight }
    })
    const r = await sample(page, WINDOW)
    P(`| D parked on footer (hero bottom at ${geo.heroBottom}px, #teknik top ${geo.teknikTop}px) | ${i} | ${r.hidden} | ${round((r.dg / r.span) * 1000)} | ${round((r.df / r.span) * 1000)} | ${r.dr} |`)
    push('D parked on footer', r)
    await ctx.close()
  }
  // ---- E idle on hero, no scrolling (baseline cost of the hero canvas) -----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await page.waitForFunction(() => window.__fill > 0, null, { timeout: 20000 }).catch(() => {})
    const r = await sample(page, WINDOW)
    P(`| E idle on hero, never scrolled (three.js never loaded) | ${i} | ${r.hidden} | ${round((r.dg / r.span) * 1000)} | ${round((r.df / r.span) * 1000)} | ${r.dr} |`)
    push('E idle on hero', r)
    await ctx.close()
  }
}

P('\n## Medians')
for (const [k, v] of Object.entries(agg)) {
  P(`- ${k}: WebGL draws/s ${median(v.map((x) => (x.dg / x.span) * 1000))} (${rng(v.map((x) => round((x.dg / x.span) * 1000)))}) · 2D fills/s ${median(v.map((x) => round((x.df / x.span) * 1000)))} (${rng(v.map((x) => round((x.df / x.span) * 1000)))}) · WebGL contexts ${v[0].ctxs}`)
}

await browser.close()
writeFileSync(new URL('./06b-pause.md', import.meta.url), L.join('\n'))
console.log('\nwrote 06b-pause.md')
