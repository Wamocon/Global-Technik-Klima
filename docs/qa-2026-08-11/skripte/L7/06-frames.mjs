/**
 * L7-06 — sustained frame rate, reveal/parallax jank, rAF pause claims.
 *
 * Instrumentation installed via addInitScript BEFORE any page script:
 *   · WebGLRenderingContext/WebGL2 drawArrays+drawElements counters
 *       → counts Three.js renderer.render() work directly.
 *   · CanvasRenderingContext2D.fill counter
 *       → counts FrostHero particle draws directly.
 *   · a rAF interval sampler (start/stop) recording {t, y} per frame.
 * Fixed windows below are the MEASUREMENT window, not a stabilisation sleep.
 * mobile 390x844 DPR2, CPU 4x, network unthrottled (we are measuring the main
 * thread, not the pipe). 3 repetitions of every scenario.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'

const REPS = 3
const L = []
const P = (s) => { L.push(s); console.log(s) }

const INIT = () => {
  window.__gl = 0
  window.__fill = 0
  window.__raf = 0
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype]) {
    if (!proto) continue
    for (const k of ['drawArrays', 'drawElements']) {
      const o = proto[k]
      proto[k] = function (...a) { window.__gl++; return o.apply(this, a) }
    }
  }
  const of = CanvasRenderingContext2D.prototype.fill
  CanvasRenderingContext2D.prototype.fill = function (...a) { window.__fill++; return of.apply(this, a) }
  const orq = window.requestAnimationFrame
  window.requestAnimationFrame = function (cb) { window.__raf++; return orq.call(window, cb) }
  window.__contexts = 0
  const ogc = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    const c = ogc.call(this, t, ...a)
    if (/webgl/.test(t)) { window.__contexts++; window.__lastGl = c }
    return c
  }
  window.__sampler = {
    on: false,
    frames: [],
    start() { this.frames = []; this.on = true; const tick = (t) => { if (!this.on) return; this.frames.push([t, scrollY]); orq.call(window, tick) }; orq.call(window, tick) },
    stop() { this.on = false; return this.frames },
  }
}

const stats = (frames) => {
  const iv = []
  for (let i = 1; i < frames.length; i++) iv.push(frames[i][0] - frames[i - 1][0])
  if (!iv.length) return null
  const span = frames[frames.length - 1][0] - frames[0][0]
  const s = [...iv].sort((a, b) => a - b)
  const p = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))]
  return {
    n: frames.length,
    fps: round((frames.length - 1) / (span / 1000), 1),
    medIv: round(p(0.5), 1),
    p95Iv: round(p(0.95), 1),
    maxIv: round(s[s.length - 1], 1),
    dropped: iv.reduce((a, x) => a + Math.max(0, Math.round(x / 16.67) - 1), 0),
    longFrames: iv.filter((x) => x > 33.4).length,
    pctLong: round((100 * iv.filter((x) => x > 33.4).length) / iv.length, 1),
  }
}

const browser = await chromium.launch()
const newPage = async (cpu = 4) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  // real condition, not a sleep: GSAP has booted when a reveal element got .shown
  await page.waitForFunction(() => document.querySelector('[data-reveal].shown') !== null || !document.documentElement.classList.contains('motion'), null, { timeout: 15000 }).catch(() => {})
  return { ctx, page, cdp }
}

// ---------------------------------------------------------- 1. full-page scroll
P('# L7-06 frame rate / rAF pause verification (mobile 390x844 DPR2, CPU 4x)')
P('\n## 1. Sustained frame rate while scrolling the WHOLE page')
P('Method: rAF sampler running; page scrolled in 0.45*vh steps, 2 rAF ticks per step.')
P('| rep | frames | avg fps | median interval | p95 | max | est. dropped | frames >33.4ms | % long |')
P('|---|---|---|---|---|---|---|---|---|')
const perSection = {}
const fullRuns = []
for (let i = 0; i < REPS; i++) {
  const { ctx, page } = await newPage()
  const secs = await page.evaluate(() =>
    [...document.querySelectorAll('section[id], header.hero, footer')].map((s) => ({ id: s.id || s.tagName.toLowerCase(), top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) }))
  )
  const frames = await page.evaluate(async () => {
    window.__sampler.start()
    const step = Math.round(innerHeight * 0.45)
    const end = document.documentElement.scrollHeight
    for (let y = 0; y <= end; y += step) {
      scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    }
    return window.__sampler.stop()
  })
  const st = stats(frames)
  fullRuns.push(st)
  P(`| ${i} | ${st.n} | ${st.fps} | ${st.medIv} | ${st.p95Iv} | ${st.maxIv} | ${st.dropped} | ${st.longFrames} | ${st.pctLong} |`)
  // attribute long frames to the section that was on screen
  for (let k = 1; k < frames.length; k++) {
    const iv = frames[k][0] - frames[k - 1][0]
    const y = frames[k][1] + 400
    let sec = 'top'
    for (const s of secs) if (y >= s.top && y < s.top + s.h) sec = s.id
    perSection[sec] = perSection[sec] || { n: 0, long: 0, sum: 0, max: 0 }
    perSection[sec].n++
    perSection[sec].sum += iv
    perSection[sec].max = Math.max(perSection[sec].max, iv)
    if (iv > 33.4) perSection[sec].long++
  }
  await ctx.close()
}
P(`\nmedian avg-fps across reps: ${median(fullRuns.map((s) => s.fps))} (range ${rng(fullRuns.map((s) => s.fps))})`)
P('\n### Worst sections (pooled over 3 reps, frames while that section filled the viewport)')
P('| section | frames | mean interval ms | implied fps | frames >33.4ms | % long | worst frame ms |')
P('|---|---|---|---|---|---|---|')
for (const [k, v] of Object.entries(perSection).sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n)) {
  P(`| ${k} | ${v.n} | ${round(v.sum / v.n, 1)} | ${round(1000 / (v.sum / v.n), 1)} | ${v.long} | ${round((100 * v.long) / v.n, 1)} | ${round(v.max, 1)} |`)
}

// ---------------------------------------------------------- 2. parked scenarios
const scenarios = [
  { name: 'A parked on #teknik (3D visible)', park: 'teknik', hidden: false, ms: 3000 },
  { name: 'B parked at top (#teknik far off-screen)', park: 'top', hidden: false, ms: 3000 },
  { name: 'C parked on #teknik, tab hidden', park: 'teknik', hidden: true, ms: 3000 },
  { name: 'D parked on footer (hero far off-screen)', park: 'bottom', hidden: false, ms: 3000 },
]
P('\n## 2. rAF pause claims — direct draw-call counting over a 3000 ms window')
P('WebGL draws = Three.js renderer; 2D fills = FrostHero particles.')
P('| scenario | rep | WebGL draws | WebGL draws/s | 2D fills | 2D fills/s | rAF calls | fps sampled |')
P('|---|---|---|---|---|---|---|---|')
const scenAgg = {}
for (const sc of scenarios) {
  scenAgg[sc.name] = []
  for (let i = 0; i < REPS; i++) {
    const { ctx, page, cdp } = await newPage()
    // bring the 3D section into view once so three.js is booted, then park
    await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
    await page.waitForFunction(() => window.__gl > 0, null, { timeout: 30000 }).catch(() => {})
    if (sc.park === 'top') await page.evaluate(() => scrollTo(0, 0))
    if (sc.park === 'bottom') await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    if (sc.park === 'teknik') await page.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' }))
    // settle: wait until the IntersectionObserver callback has certainly run
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    if (sc.hidden) await cdp.send('Emulation.setPageVisibilityOverride', { hidden: true })
    const res = await page.evaluate(async (ms) => {
      const g0 = window.__gl, f0 = window.__fill, r0 = window.__raf
      window.__sampler.start()
      const t0 = performance.now()
      await new Promise((r) => setTimeout(r, ms))
      const frames = window.__sampler.stop()
      return { dg: window.__gl - g0, df: window.__fill - f0, dr: window.__raf - r0, span: performance.now() - t0, frames, ctxs: window.__contexts }
    }, sc.ms)
    if (sc.hidden) await cdp.send('Emulation.setPageVisibilityOverride', { hidden: false })
    const st = stats(res.frames)
    scenAgg[sc.name].push(res)
    P(`| ${sc.name} | ${i} | ${res.dg} | ${round((res.dg / res.span) * 1000)} | ${res.df} | ${round((res.df / res.span) * 1000)} | ${res.dr} | ${st ? st.fps : 'n/a'} |`)
    await ctx.close()
  }
}
P('\nMedians: ')
for (const [k, v] of Object.entries(scenAgg)) {
  P(`- ${k}: WebGL draws/s median ${median(v.map((x) => (x.dg / x.span) * 1000))}, 2D fills/s median ${median(v.map((x) => (x.df / x.span) * 1000))}, WebGL contexts created ${v[0].ctxs}`)
}

// ---------------------------------------------------------- 3. section-local scrolls
const zones = [
  { name: '#urunler (7 parallax product images)', id: 'urunler' },
  { name: '#teknik (three.js exploded unit)', id: 'teknik' },
  { name: '#hizmetler (reveal cards)', id: 'hizmetler' },
  { name: '#kontakt (map iframe + footer)', id: 'kontakt' },
]
P('\n## 3. Scroll-through of individual sections (3 reps each, 12 slow steps through the section)')
P('| zone | rep | frames | fps | median iv | p95 iv | max iv | frames >33.4ms | % long |')
P('|---|---|---|---|---|---|---|---|---|')
const zoneAgg = {}
for (const z of zones) {
  zoneAgg[z.name] = []
  for (let i = 0; i < REPS; i++) {
    const { ctx, page } = await newPage()
    const frames = await page.evaluate(async (id) => {
      const el = document.getElementById(id)
      const top = el.getBoundingClientRect().top + scrollY
      const h = el.getBoundingClientRect().height
      scrollTo(0, Math.max(0, top - innerHeight))
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      window.__sampler.start()
      const steps = 12
      for (let k = 0; k <= steps; k++) {
        scrollTo(0, Math.max(0, top - innerHeight) + (k * (h + innerHeight)) / steps)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))
      }
      return window.__sampler.stop()
    }, z.id)
    const st = stats(frames)
    zoneAgg[z.name].push(st)
    P(`| ${z.name} | ${i} | ${st.n} | ${st.fps} | ${st.medIv} | ${st.p95Iv} | ${st.maxIv} | ${st.longFrames} | ${st.pctLong} |`)
    await ctx.close()
  }
}
P('\nMedians per zone:')
for (const [k, v] of Object.entries(zoneAgg)) {
  P(`- ${k}: fps ${median(v.map((x) => x.fps))} (${rng(v.map((x) => x.fps))}), median interval ${median(v.map((x) => x.medIv))} ms, p95 ${median(v.map((x) => x.p95Iv))} ms, %long ${median(v.map((x) => x.pctLong))}`)
}

await browser.close()
writeFileSync(new URL('./06-frames.md', import.meta.url), L.join('\n'))
console.log('\nwrote 06-frames.md')
