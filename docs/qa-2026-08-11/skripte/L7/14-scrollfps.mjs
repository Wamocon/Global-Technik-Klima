/**
 * L7-14 — scroll smoothness, 5 reps, constant-velocity scroll (closer to a real flick
 * than step-and-wait), plus attribution controls:
 *   as-shipped · prefers-reduced-motion (no GSAP, frost drawn once) · frost neutralised
 * Metric: rAF interval distribution. A frame budget of 16.67 ms is one display frame;
 * intervals > 33.4 ms mean at least one dropped frame.
 * mobile 390x844 DPR2, CPU 4x, network unthrottled (measuring the main thread).
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'
const REPS = 5
const L = []
const P = (s) => { L.push(s); console.log(s) }
const INIT = () => {
  window.__f = []
  const orq = window.requestAnimationFrame
  window.__scrollRun = (pxPerMs) =>
    new Promise((done) => {
      const end = document.documentElement.scrollHeight - innerHeight
      let t0 = null
      window.__f = []
      const tick = (t) => {
        if (t0 === null) t0 = t
        window.__f.push([t, scrollY])
        const y = (t - t0) * pxPerMs
        scrollTo(0, Math.min(end, y))
        if (y < end) orq.call(window, tick)
        else done(window.__f)
      }
      orq.call(window, tick)
    })
}
const pctl = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))] }
const browser = await chromium.launch()
const variants = [
  { name: 'as shipped', reduce: false, neutralize: false },
  { name: 'prefers-reduced-motion: reduce (no GSAP, frost static)', reduce: true, neutralize: false },
  { name: 'frost canvas neutralised (GSAP still on)', reduce: false, neutralize: true },
]
P('# L7-14 scroll smoothness, constant velocity 2.2 px/ms (~2200 px/s), 5 reps')
P('| variant | rep | frames | duration ms | mean iv | median iv | p95 iv | p99 iv | max iv | % frames >33.4ms | implied fps |')
P('|---|---|---|---|---|---|---|---|---|---|---|')
const agg = {}
for (const v of variants) {
  agg[v.name] = []
  for (let r = 0; r < REPS; r++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: v.reduce ? 'reduce' : 'no-preference' })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(BASE + '/', { waitUntil: 'load' })
    if (!v.reduce) await page.waitForFunction(() => document.querySelector('[data-reveal].shown') !== null, null, { timeout: 20000 }).catch(() => {})
    if (v.neutralize) {
      await page.addStyleTag({ content: '#frost{width:0px !important;height:0px !important}' })
      await page.evaluate(() => dispatchEvent(new Event('resize')))
      await page.waitForFunction(() => new Promise((r) => setTimeout(() => r(true), 300)), null, { timeout: 5000 }).catch(() => {})
    }
    const f = await page.evaluate(() => window.__scrollRun(2.2))
    const iv = []
    for (let i = 1; i < f.length; i++) iv.push(f[i][0] - f[i - 1][0])
    const dur = f[f.length - 1][0] - f[0][0]
    const long = iv.filter((x) => x > 33.4).length
    const rec = {
      n: f.length, dur, mean: iv.reduce((a, b) => a + b, 0) / iv.length,
      med: pctl(iv, 0.5), p95: pctl(iv, 0.95), p99: pctl(iv, 0.99), max: Math.max(...iv),
      pctLong: (100 * long) / iv.length, fps: (f.length - 1) / (dur / 1000),
    }
    agg[v.name].push(rec)
    P(`| ${v.name} | ${r} | ${rec.n} | ${round(dur)} | ${round(rec.mean, 1)} | ${round(rec.med, 1)} | ${round(rec.p95, 1)} | ${round(rec.p99, 1)} | ${round(rec.max, 1)} | ${round(rec.pctLong, 1)} | ${round(rec.fps, 1)} |`)
    await ctx.close()
  }
}
P('\n## Medians over 5 reps')
P('| variant | fps | mean iv | p95 iv | max iv | % frames >33.4ms |')
P('|---|---|---|---|---|---|')
for (const [k, v] of Object.entries(agg)) {
  P(`| ${k} | ${round(median(v.map((x) => x.fps)), 1)} (${rng(v.map((x) => round(x.fps, 1)))}) | ${round(median(v.map((x) => x.mean)), 1)} | ${round(median(v.map((x) => x.p95)), 1)} | ${round(median(v.map((x) => x.max)), 1)} | ${round(median(v.map((x) => x.pctLong)), 1)} |`)
}
await browser.close()
writeFileSync(new URL('./14-scrollfps.md', import.meta.url), L.join('\n'))
console.log('\nwrote 14-scrollfps.md')
