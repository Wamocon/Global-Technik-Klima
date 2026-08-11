/**
 * L7-12 — precise FOUT: which font subsets land BEFORE first paint and which after.
 * Method: per-font responseEnd from resource timing vs FCP from the paint observer.
 * A face that finishes before FCP produces no visible swap. A face that finishes
 * after FCP means those glyphs render in the fallback first.
 * Plus a screenshot taken in the animation frame right after the FCP entry fires.
 * 3 reps per (locale, network).
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const L = []
const P = (s) => { L.push(s); console.log(s) }
const NETS = {
  fast3g: { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: 51200, uploadThroughput: 51200 },
}
const INIT = () => {
  window.__fcp = null
  window.__fcpShot = false
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === 'first-contentful-paint' && window.__fcp === null) { window.__fcp = e.startTime; window.__fcpShot = true }
  }).observe({ type: 'paint', buffered: true })
  document.fonts.ready.then(() => { window.__ready = performance.now() })
}
const browser = await chromium.launch()
P('# L7-12 FOUT precision — per-font-subset arrival vs first paint (mobile 390x844 DPR2, CPU 4x)')
const agg = {}
for (const net of ['fast3g', 'slow3g']) {
  for (const [lk, url] of [['tr', BASE + '/'], ['ru', BASE + '/ru/']]) {
    const key = `${net}/${lk}`
    agg[key] = []
    for (let r = 0; r < 3; r++) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      await page.addInitScript(INIT)
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.clearBrowserCache')
      await cdp.send('Network.emulateNetworkConditions', NETS[net])
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      const nav = page.goto(url, { waitUntil: 'load', timeout: 240000 })
      if (r === 0) {
        // shoot as soon as the FCP entry exists
        page.waitForFunction(() => window.__fcpShot === true, null, { timeout: 240000 })
          .then(() => page.screenshot({ path: path.join(DIR, `fcp-${net}-${lk}.png`) }))
          .catch(() => {})
      }
      await nav
      await page.waitForFunction(() => window.__ready !== undefined, null, { timeout: 120000 }).catch(() => {})
      const d = await page.evaluate(() => ({
        fcp: window.__fcp,
        ready: window.__ready,
        fonts: performance.getEntriesByType('resource').filter((x) => /\.woff2$/.test(x.name)).map((x) => ({ n: x.name.split('/').pop(), start: Math.round(x.startTime), end: Math.round(x.responseEnd), init: x.initiatorType })),
      }))
      agg[key].push(d)
      await ctx.close()
    }
    P(`\n## ${key} — FCP median ${round(median(agg[key].map((x) => x.fcp)))} ms, all-fonts-ready median ${round(median(agg[key].map((x) => x.ready)))} ms`)
    P('| font file | initiator | started ms | finished ms | vs FCP | visible swap? |')
    P('|---|---|---|---|---|---|')
    const r0 = agg[key][0]
    for (const f of r0.fonts.sort((a, b) => a.end - b.end)) {
      const d = f.end - r0.fcp
      P(`| ${f.n} | ${f.init} | ${f.start} | ${f.end} | ${d > 0 ? '+' + round(d) : round(d)} ms | ${d > 0 ? 'YES — fallback shown first for ' + round(d) + ' ms' : 'no (arrived before first paint)'} |`)
    }
  }
}
P('\n## Summary')
for (const [k, v] of Object.entries(agg)) {
  const late = v.map((x) => x.fonts.filter((f) => f.end > x.fcp).length)
  const worst = v.map((x) => Math.max(0, ...x.fonts.map((f) => f.end - x.fcp)))
  P(`- ${k}: ${median(late)} of ${v[0].fonts.length} subsets arrive AFTER first paint · worst late-by median ${round(median(worst))} ms (${rng(worst)}) · FCP→all-ready ${round(median(v.map((x) => x.ready - x.fcp)))} ms`)
}
await browser.close()
writeFileSync(new URL('./12-fout.md', import.meta.url), L.join('\n'))
console.log('\nwrote 12-fout.md')
