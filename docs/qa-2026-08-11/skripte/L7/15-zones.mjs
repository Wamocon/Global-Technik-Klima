/**
 * L7-15 — per-section frame rate, corrected harness.
 * L7-06 used a step-and-wait scroll (N rAF per step); that harness itself gates the
 * sampled frame rate, so its "fps" numbers are not the page's frame rate. This script
 * uses a constant-velocity scroll (rAF-driven, ~1.1 px/ms — a slow deliberate scroll)
 * and attributes each frame interval to the section filling the viewport centre.
 * Three.js is pre-booted before the measured pass, so the one-off module download is
 * not charged to the #teknik section. 5 reps.
 * mobile 390x844 DPR2, CPU 4x.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'
const REPS = 5
const L = []
const P = (s) => { L.push(s); console.log(s) }
const INIT = () => {
  window.__gl = 0
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!proto) continue
    for (const k of ['drawArrays', 'drawElements']) { const o = proto[k]; proto[k] = function (...a) { window.__gl++; return o.apply(this, a) } }
  }
  const orq = window.requestAnimationFrame
  window.__run = (pxPerMs) =>
    new Promise((done) => {
      const end = document.documentElement.scrollHeight - innerHeight
      const f = []
      let t0 = null
      scrollTo(0, 0)
      const tick = (t) => {
        if (t0 === null) t0 = t
        f.push([t, scrollY])
        const y = (t - t0) * pxPerMs
        scrollTo(0, Math.min(end, y))
        if (y < end) orq.call(window, tick)
        else done(f)
      }
      orq.call(window, tick)
    })
}
const pctl = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))] }
const browser = await chromium.launch()
const pool = {}
const overall = []
for (let r = 0; r < REPS; r++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForFunction(() => document.querySelector('[data-reveal].shown') !== null, null, { timeout: 20000 }).catch(() => {})
  // pre-boot three.js and let every lazy image + the map iframe land, so the measured
  // pass sees the steady state
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8)
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
  })
  await page.waitForFunction(() => window.__gl > 0, null, { timeout: 40000 })
  await page.waitForFunction(() => [...document.querySelectorAll('img')].every((i) => i.complete), null, { timeout: 30000 }).catch(() => {})
  const secs = await page.evaluate(() => [...document.querySelectorAll('section[id], header.hero, footer')].map((s) => ({ id: s.id || s.tagName.toLowerCase(), top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) })))
  const f = await page.evaluate(() => window.__run(1.1))
  const iv = []
  for (let i = 1; i < f.length; i++) iv.push(f[i][0] - f[i - 1][0])
  overall.push({ fps: (f.length - 1) / ((f[f.length - 1][0] - f[0][0]) / 1000), p95: pctl(iv, 0.95), max: Math.max(...iv), pctLong: (100 * iv.filter((x) => x > 33.4).length) / iv.length })
  for (let i = 1; i < f.length; i++) {
    const y = f[i][1] + 422
    let sec = 'top'
    for (const s of secs) if (y >= s.top && y < s.top + s.h) sec = s.id
    pool[sec] = pool[sec] || { n: 0, sum: 0, long: 0, max: 0, ivs: [] }
    const d = f[i][0] - f[i - 1][0]
    pool[sec].n++; pool[sec].sum += d; pool[sec].max = Math.max(pool[sec].max, d); pool[sec].ivs.push(d)
    if (d > 33.4) pool[sec].long++
  }
  await ctx.close()
}
await browser.close()
P('# L7-15 per-section frame rate, constant-velocity scroll (1.1 px/ms), three.js pre-booted, 5 reps')
P(`\nWhole-page pass: fps median ${round(median(overall.map((x) => x.fps)), 1)} (${rng(overall.map((x) => round(x.fps, 1)))}) · p95 interval ${round(median(overall.map((x) => x.p95)), 1)} ms · worst frame ${round(median(overall.map((x) => x.max)))} ms · % frames >33.4 ms ${round(median(overall.map((x) => x.pctLong)), 1)}`)
P('\n| section | frames | mean iv ms | implied fps | p95 iv | p99 iv | worst iv | % frames >33.4ms |')
P('|---|---|---|---|---|---|---|---|')
for (const [k, v] of Object.entries(pool).sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)) {
  P(`| ${k} | ${v.n} | ${round(v.sum / v.n, 1)} | ${round(1000 / (v.sum / v.n), 1)} | ${round(pctl(v.ivs, 0.95), 1)} | ${round(pctl(v.ivs, 0.99), 1)} | ${round(v.max, 1)} | ${round((100 * v.long) / v.n, 1)} |`)
}
writeFileSync(new URL('./15-zones.md', import.meta.url), L.join('\n'))
console.log('\nwrote 15-zones.md')
