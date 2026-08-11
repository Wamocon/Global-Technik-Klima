/**
 * L7-16 — causal test for the desktop CLS. Hypothesis: the shift is the web-font
 * swap re-laying-out the hero text block and the main nav, not the reveal system,
 * not the counters, not the hero canvas.
 * Variants (desktop 1440x900, Fast 3G, CPU 4x, 3 reps each):
 *   as shipped · fonts blocked · gsap blocked (no reveal/counters/parallax) ·
 *   product images blocked · hero image blocked
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'
const FAST3G = { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 }
const L = []
const P = (s) => { L.push(s); console.log(s) }
const INIT = () => {
  window.__s = []
  const sel = (el) => { if (!el || el.nodeType !== 1) return '(text node)'; const p = []; let n = el; while (n && n.nodeType === 1 && p.length < 3) { let s = n.tagName.toLowerCase(); if (n.id) { s += '#' + n.id; p.unshift(s); break } if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); p.unshift(s); n = n.parentElement } return p.join('>') }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__s.push({ t: e.startTime, v: e.value, src: (e.sources || []).map((s) => sel(s.node) + ' ' + JSON.stringify(s.previousRect ? [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)] : null) + '→' + JSON.stringify(s.currentRect ? [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)] : null)) }) }).observe({ type: 'layout-shift', buffered: true })
}
const cls = (s) => { let cur = 0, st = 0, prev = 0, max = 0; for (const x of s) { if (cur && (x.t - prev > 1000 || x.t - st > 5000)) { max = Math.max(max, cur); cur = 0 } if (!cur) st = x.t; prev = x.t; cur += x.v; max = Math.max(max, cur) } return max }
const browser = await chromium.launch()
const variants = [
  { name: 'as shipped', block: [] },
  { name: 'fonts blocked', block: ['**/fonts/**'] },
  { name: 'gsap+ScrollTrigger blocked (no reveal/counters/parallax)', block: ['**/gsap.*.js', '**/ScrollTrigger.*.js'] },
  { name: 'product images blocked', block: ['**/p-*.webp'] },
  { name: 'hero image blocked', block: ['**/hero-shop.webp'] },
]
for (const vp of [{ n: 'desktop', w: 1440, h: 900, d: 1 }, { n: 'mobile', w: 390, h: 844, d: 2 }]) {
  P(`\n# L7-16 CLS causation — ${vp.n} ${vp.w}x${vp.h}, Fast 3G, CPU 4x, 3 reps`)
  P('| variant | CLS median | runs | biggest single shift | its source |')
  P('|---|---|---|---|---|')
  for (const v of variants) {
    const rs = []
    for (let r = 0; r < 3; r++) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.d })
      const page = await ctx.newPage()
      await page.addInitScript(INIT)
      for (const g of v.block) await page.route(g, (rt) => rt.abort())
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.clearBrowserCache')
      await cdp.send('Network.emulateNetworkConditions', FAST3G)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.goto(BASE + '/', { waitUntil: 'load', timeout: 180000 })
      await page.waitForFunction(() => performance.now() > performance.getEntriesByType('navigation')[0].loadEventEnd + 2000, null, { timeout: 60000 }).catch(() => {})
      rs.push(await page.evaluate(() => window.__s))
      await ctx.close()
    }
    const vals = rs.map(cls)
    const all = rs.flat().sort((a, b) => b.v - a.v)
    P(`| ${v.name} | ${round(median(vals), 4)} | ${vals.map((x) => round(x, 4)).join(' / ')} | ${all[0] ? round(all[0].v, 4) : 0} | ${all[0] ? all[0].src.join(' ; ').slice(0, 150) : 'no shifts'} |`)
  }
}
await browser.close()
writeFileSync(new URL('./16-cls-cause.md', import.meta.url), L.join('\n'))
console.log('\nwrote 16-cls-cause.md')
