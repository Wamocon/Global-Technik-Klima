/**
 * L7-13 — cost of booting the exploded unit on a real mobile connection.
 * Method: mobile 390x844 DPR2, Fast 3G / Slow 3G, CPU 4x. Load, then scroll the
 * #teknik section into view and measure:
 *   t_scroll → three.js request start → response end → first WebGL draw
 *   the longest long task in that window (three.js parse+eval blocks input)
 *   frame intervals during the boot (rAF sampler)
 * 3 reps per network.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, kb, round, rng } from './lib.mjs'
const L = []
const P = (s) => { L.push(s); console.log(s) }
const NETS = {
  fast3g: { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: 51200, uploadThroughput: 51200 },
}
const INIT = () => {
  window.__gl = 0; window.__glT = null; window.__long = []
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!proto) continue
    for (const k of ['drawArrays', 'drawElements']) { const o = proto[k]; proto[k] = function (...a) { if (window.__glT === null) window.__glT = performance.now(); window.__gl++; return o.apply(this, a) } }
  }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push({ t: e.startTime, d: e.duration }) }).observe({ type: 'longtask', buffered: true })
  window.__frames = []
  const orq = window.requestAnimationFrame
  window.__sample = (on) => { window.__on = on; const tick = (t) => { if (!window.__on) return; window.__frames.push(t); orq.call(window, tick) }; if (on) orq.call(window, tick) }
}
const browser = await chromium.launch()
P('# L7-13 exploded-unit boot cost on a mobile connection (390x844 DPR2, CPU 4x)')
P('| net | rep | scroll at ms | three req start | three finished | first WebGL draw | scroll→first draw ms | three KB | worst long task in window | frames in window | mean interval ms |')
P('|---|---|---|---|---|---|---|---|---|---|---|')
const agg = {}
for (const net of ['fast3g', 'slow3g']) {
  agg[net] = []
  for (let r = 0; r < 3; r++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.clearBrowserCache')
    await cdp.send('Network.emulateNetworkConditions', NETS[net])
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 240000 })
    const tScroll = await page.evaluate(() => {
      window.__frames = []
      window.__sample(true)
      const t = performance.now()
      document.getElementById('teknik').scrollIntoView({ block: 'center' })
      return t
    })
    await page.waitForFunction(() => window.__glT !== null, null, { timeout: 180000 })
    const d = await page.evaluate((tScroll) => {
      window.__sample(false)
      const three = performance.getEntriesByType('resource').find((x) => /three/.test(x.name))
      const win = window.__long.filter((x) => x.t >= tScroll && x.t <= window.__glT + 200)
      const fr = window.__frames.filter((t) => t >= tScroll)
      const iv = []
      for (let i = 1; i < fr.length; i++) iv.push(fr[i] - fr[i - 1])
      return {
        tScroll,
        reqStart: three ? three.startTime : null,
        reqEnd: three ? three.responseEnd : null,
        bytes: three ? three.transferSize : 0,
        firstDraw: window.__glT,
        worstLong: Math.max(0, ...win.map((x) => x.d)),
        blocking: win.reduce((s, x) => s + Math.max(0, x.d - 50), 0),
        frames: fr.length,
        meanIv: iv.length ? iv.reduce((a, b) => a + b, 0) / iv.length : null,
      }
    }, tScroll)
    agg[net].push(d)
    P(`| ${net} | ${r} | ${round(d.tScroll)} | ${round(d.reqStart)} | ${round(d.reqEnd)} | ${round(d.firstDraw)} | ${round(d.firstDraw - d.tScroll)} | ${kb(d.bytes)} | ${round(d.worstLong)} ms (blocking ${round(d.blocking)}) | ${d.frames} | ${round(d.meanIv, 1)} |`)
    await ctx.close()
  }
}
P('\nMedians:')
for (const [k, v] of Object.entries(agg)) {
  P(`- ${k}: scroll→first draw ${round(median(v.map((x) => x.firstDraw - x.tScroll)))} ms (${rng(v.map((x) => round(x.firstDraw - x.tScroll)))}) · download ${round(median(v.map((x) => x.reqEnd - x.reqStart)))} ms · parse/setup after download ${round(median(v.map((x) => x.firstDraw - x.reqEnd)))} ms · worst long task ${round(median(v.map((x) => x.worstLong)))} ms · mean frame interval in window ${round(median(v.map((x) => x.meanIv)), 1)} ms`)
}
await browser.close()
writeFileSync(new URL('./13-three-boot.md', import.meta.url), L.join('\n'))
console.log('\nwrote 13-three-boot.md')
