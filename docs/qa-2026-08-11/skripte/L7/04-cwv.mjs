/**
 * L7-04 — Core-Web-Vitals-ish metrics under CDP throttling.
 *
 * Throttling (CDP, documented values = Chrome DevTools presets):
 *   Fast 3G : rtt 562.5 ms, down 1 474 560 bit/s (184 320 B/s), up 675 000 bit/s
 *   Slow 3G : rtt 2000  ms, down   409 600 bit/s ( 51 200 B/s), up 409 600 bit/s
 *   CPU     : Emulation.setCPUThrottlingRate 4x / 6x
 *
 * Metrics via PerformanceObserver installed by addInitScript (so nothing is missed):
 *   FCP  paint entry 'first-contentful-paint'
 *   LCP  largest-contentful-paint (last entry before scroll) + element selector/url/size
 *   CLS  layout-shift, excluding hadRecentInput; sources recorded with selectors
 *   TBT  sum(longtask.duration - 50) within the measured window
 * Two CLS windows: (a) up to `load`+quiet, (b) after scripted full-page scroll.
 * 3 runs per config; median + range.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, kb, round, rng } from './lib.mjs'

const RUNS = 3
const NET = {
  none: null,
  fast3g: { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: 51200, uploadThroughput: 51200 },
}

const CONFIGS = [
  { name: 'mobile/none/1x', vp: [390, 844], dpr: 2, net: 'none', cpu: 1 },
  { name: 'mobile/fast3g/4x', vp: [390, 844], dpr: 2, net: 'fast3g', cpu: 4 },
  { name: 'mobile/fast3g/6x', vp: [390, 844], dpr: 2, net: 'fast3g', cpu: 6 },
  { name: 'mobile/slow3g/4x', vp: [390, 844], dpr: 2, net: 'slow3g', cpu: 4 },
  { name: 'mobile/slow3g/6x', vp: [390, 844], dpr: 2, net: 'slow3g', cpu: 6 },
  { name: 'desktop/none/1x', vp: [1440, 900], dpr: 1, net: 'none', cpu: 1 },
  { name: 'desktop/fast3g/4x', vp: [1440, 900], dpr: 1, net: 'fast3g', cpu: 4 },
  { name: 'desktop/slow3g/6x', vp: [1440, 900], dpr: 1, net: 'slow3g', cpu: 6 },
]

const INIT = () => {
  window.__m = { fcp: null, lcp: null, lcpEl: null, shifts: [], long: [], marks: {} }
  const sel = (el) => {
    if (!el) return '(no element)'
    const p = []
    let n = el
    while (n && n.nodeType === 1 && p.length < 4) {
      let s = n.tagName.toLowerCase()
      if (n.id) { s += '#' + n.id; p.unshift(s); break }
      if (n.classList && n.classList.length) s += '.' + [...n.classList].slice(0, 3).join('.')
      p.unshift(s)
      n = n.parentElement
    }
    return p.join(' > ')
  }
  window.__sel = sel
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime
  }).observe({ type: 'paint', buffered: true })
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__m.lcp = e.startTime
      window.__m.lcpEl = { sel: sel(e.element), url: e.url || '', size: e.size, tag: e.element ? e.element.tagName : '' }
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue
      window.__m.shifts.push({
        t: e.startTime,
        v: e.value,
        srcs: (e.sources || []).slice(0, 4).map((s) => ({
          sel: sel(s.node),
          prev: s.previousRect ? [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)] : null,
          cur: s.currentRect ? [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)] : null,
        })),
      })
    }
  }).observe({ type: 'layout-shift', buffered: true })
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__m.long.push({ t: e.startTime, d: e.duration, attr: (e.attribution || []).map((a) => a.name + ':' + a.containerName) })
  }).observe({ type: 'longtask', buffered: true })
  addEventListener('load', () => { window.__m.marks.load = performance.now() }, { once: true, capture: true })
}

const clsOf = (shifts, until = Infinity) => {
  // 5s-window / 1s-gap session CLS, the CWV definition.
  let cur = 0, start = 0, prev = 0, max = 0
  for (const s of shifts) {
    if (s.t > until) break
    if (cur && (s.t - prev > 1000 || s.t - start > 5000)) { max = Math.max(max, cur); cur = 0 }
    if (!cur) start = s.t
    prev = s.t
    cur += s.v
    max = Math.max(max, cur)
  }
  return max
}

const browser = await chromium.launch()
const results = {}

for (const cfg of CONFIGS) {
  results[cfg.name] = []
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: cfg.vp[0], height: cfg.vp[1] }, deviceScaleFactor: cfg.dpr })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.clearBrowserCache')
    if (NET[cfg.net]) await cdp.send('Network.emulateNetworkConditions', NET[cfg.net])
    if (cfg.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cfg.cpu })

    const t0 = Date.now()
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 180000 })
    // Quiet condition: no new long task / no new shift for 1200 ms (polled, not slept)
    await page.waitForFunction(
      () => {
        const m = window.__m
        const last = Math.max(m.long.length ? m.long[m.long.length - 1].t + m.long[m.long.length - 1].d : 0, m.shifts.length ? m.shifts[m.shifts.length - 1].t : 0, m.marks.load || 0)
        return performance.now() - last > 1200
      },
      null,
      { timeout: 60000 }
    ).catch(() => {})

    const atLoad = await page.evaluate(() => ({
      m: JSON.parse(JSON.stringify(window.__m)),
      nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, respStart: n.responseStart } })(),
      ect: navigator.connection ? { type: navigator.connection.effectiveType, rtt: navigator.connection.rtt, down: navigator.connection.downlink } : null,
      imgBytes: performance.getEntriesByType('resource').filter((r) => /\.(webp|png|jpe?g|avif)$/.test(r.name)).reduce((s, r) => s + r.transferSize, 0),
      imgN: performance.getEntriesByType('resource').filter((r) => /\.(webp|png|jpe?g|avif)$/.test(r.name)).length,
      totalBytes: performance.getEntriesByType('resource').reduce((s, r) => s + r.transferSize, 0),
      nReq: performance.getEntriesByType('resource').length,
    }))
    const wall = Date.now() - t0

    // ---- scripted full-page scroll (reveal system + parallax + counters) -----
    const scrollStart = await page.evaluate(() => performance.now())
    await page.evaluate(async () => {
      const step = Math.round(innerHeight * 0.6)
      const end = document.documentElement.scrollHeight
      for (let y = 0; y < end; y += step) {
        scrollTo(0, y)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      }
      scrollTo(0, end)
      await new Promise((r) => setTimeout(r, 300))
    })
    const afterScroll = await page.evaluate(() => JSON.parse(JSON.stringify(window.__m)))

    results[cfg.name].push({ atLoad, afterScroll, wall, scrollStart })
    await ctx.close()
  }
}
await browser.close()

// ------------------------------- report ------------------------------------
const L = []
const P = (s) => { L.push(s); console.log(s) }
P('# L7-04 Core Web Vitals under CDP throttling — `/` (Turkish root), cold cache, 3 runs each')
P('| config | ECT seen | FCP ms | LCP ms | LCP element | CLS@load | CLS after scroll | TBT ms | longtasks | DCL ms | load ms | bytes@load KB | imgs@load |')
P('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for (const cfg of CONFIGS) {
  const rs = results[cfg.name]
  const f = (fn) => rs.map(fn)
  const fcp = f((r) => r.atLoad.m.fcp)
  const lcp = f((r) => r.atLoad.m.lcp)
  const cls1 = f((r) => clsOf(r.atLoad.m.shifts))
  const cls2 = f((r) => clsOf(r.afterScroll.shifts))
  const tbt = f((r) => r.atLoad.m.long.reduce((s, x) => s + Math.max(0, x.d - 50), 0))
  const nlt = f((r) => r.atLoad.m.long.length)
  const dcl = f((r) => r.atLoad.nav.dcl)
  const ld = f((r) => r.atLoad.nav.load)
  const by = f((r) => r.atLoad.totalBytes)
  const im = f((r) => r.atLoad.imgN)
  const el = rs[0].atLoad.m.lcpEl
  P(
    `| ${cfg.name} | ${rs[0].atLoad.ect ? rs[0].atLoad.ect.type : '?'} | ${round(median(fcp))} (${rng(fcp)}) | ${round(median(lcp))} (${rng(lcp)}) | ${el ? el.sel + (el.url ? ' url=' + el.url.replace(BASE, '') : '') : 'n/a'} | ${round(median(cls1), 4)} (${cls1.map((c) => round(c, 4)).join('/')}) | ${round(median(cls2), 4)} (${cls2.map((c) => round(c, 4)).join('/')}) | ${round(median(tbt))} (${rng(tbt)}) | ${median(nlt)} | ${round(median(dcl))} | ${round(median(ld))} | ${kb(median(by))} | ${median(im)} |`
  )
}

P('\n## Layout-shift sources (all runs pooled, biggest first)')
const pool = {}
for (const cfg of CONFIGS) {
  for (const r of results[cfg.name]) {
    for (const s of r.afterScroll.shifts) {
      for (const src of s.srcs) {
        const k = src.sel
        pool[k] = pool[k] || { n: 0, v: 0, cfgs: new Set(), ex: null }
        pool[k].n++
        pool[k].v += s.v
        pool[k].cfgs.add(cfg.name)
        if (!pool[k].ex) pool[k].ex = src
      }
    }
  }
}
const ranked = Object.entries(pool).sort((a, b) => b[1].v - a[1].v)
P('| shifting node | occurrences | summed CLS value | example prev→cur rect | configs |')
P('|---|---|---|---|---|')
for (const [k, v] of ranked.slice(0, 20)) {
  P(`| \`${k}\` | ${v.n} | ${round(v.v, 4)} | ${JSON.stringify(v.ex.prev)} → ${JSON.stringify(v.ex.cur)} | ${v.cfgs.size} |`)
}

P('\n## Longest individual long tasks (per config, run 0)')
for (const cfg of CONFIGS) {
  const lt = [...results[cfg.name][0].atLoad.m.long].sort((a, b) => b.d - a.d).slice(0, 4)
  P(`- ${cfg.name}: ${lt.map((x) => `${round(x.d)}ms @${round(x.t)}ms${x.attr.length ? ' [' + x.attr.join(',') + ']' : ''}`).join(' · ') || 'none'}`)
}

P('\n## Long tasks DURING the scroll phase (after load) — run 0')
for (const cfg of CONFIGS) {
  const r = results[cfg.name][0]
  const during = r.afterScroll.long.filter((x) => x.t >= r.scrollStart)
  const tbt = during.reduce((s, x) => s + Math.max(0, x.d - 50), 0)
  P(`- ${cfg.name}: ${during.length} long tasks, blocking ${round(tbt)} ms, worst ${round(Math.max(0, ...during.map((x) => x.d)))} ms`)
}

writeFileSync(new URL('./04-cwv.md', import.meta.url), L.join('\n'))
writeFileSync(new URL('./04-cwv.json', import.meta.url), JSON.stringify(results, null, 1))
console.log('\nwrote 04-cwv.md/.json')
