/**
 * L7-05 — waterfall + request priorities + main-thread attribution.
 *
 * (a) mobile/Fast3G/4x: per-request initialPriority, discovery time (requestWillBeSent
 *     timestamp - navigationStart) and responseEnd. Shows WHY the LCP image is late.
 * (b) CDP Tracing (devtools.timeline) → sum RunTask/EvaluateScript/FunctionCall self
 *     time per script URL, so the TBT can be attributed to a file, not guessed.
 * (c) differential experiment: block gsap+ScrollTrigger, block the frost canvas script,
 *     block hero image — measure LCP/TBT deltas. 3 runs each.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, kb, round, rng } from './lib.mjs'

const FAST3G = { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 }
const RUNS = 3
const L = []
const P = (s) => { L.push(s); console.log(s) }

const INIT = () => {
  window.__m = { fcp: null, lcp: null, lcpEl: null, long: [], shifts: [] }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime }).observe({ type: 'paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = { tag: e.element ? e.element.tagName : '', cls: e.element ? e.element.className : '', url: e.url || '', size: e.size } } }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.long.push({ t: e.startTime, d: e.duration }) }).observe({ type: 'longtask', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.shifts.push({ t: e.startTime, v: e.value }) }).observe({ type: 'layout-shift', buffered: true })
}

const browser = await chromium.launch()

// ---------------------------------------------------------------- (a) waterfall
P('# L7-05 waterfall / priorities / attribution  (mobile 390x844 DPR2, Fast 3G, CPU 4x)')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.clearBrowserCache')
  await cdp.send('Network.emulateNetworkConditions', FAST3G)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const reqs = new Map()
  let t0 = null
  cdp.on('Network.requestWillBeSent', (e) => {
    if (e.type === 'Document' && t0 === null) t0 = e.timestamp
    reqs.set(e.requestId, { url: e.request.url, prio: e.initialPriority, type: e.type, disc: e.timestamp, enc: 0 })
  })
  cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.prio2 = e.response.headers ? undefined : undefined } })
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.end = e.timestamp; r.enc = e.encodedDataLength } })
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 180000 })
  const m = await page.evaluate(() => ({ ...window.__m, nav: performance.getEntriesByType('navigation')[0].loadEventEnd }))
  const rows = [...reqs.values()].filter((r) => r.end).sort((a, b) => a.disc - b.disc)
  P('\n| discovered ms | finished ms | prio | KB | resource |')
  P('|---|---|---|---|---|')
  for (const r of rows) P(`| ${round((r.disc - t0) * 1000)} | ${round((r.end - t0) * 1000)} | ${r.prio} | ${kb(r.enc)} | ${r.url.replace(BASE, '')} |`)
  P(`\nFCP ${round(m.fcp)} ms · LCP ${round(m.lcp)} ms (${m.lcpEl.tag}.${m.lcpEl.cls} url=${(m.lcpEl.url || '').replace(BASE, '')}) · load ${round(m.nav)} ms`)
  const hero = rows.find((r) => /hero-shop/.test(r.url))
  const html = rows.find((r) => r.type === 'Document')
  if (hero) P(`Hero image: discovered at ${round((hero.disc - t0) * 1000)} ms (HTML finished at ${round((html.end - t0) * 1000)} ms), priority ${hero.prio}, finished ${round((hero.end - t0) * 1000)} ms → LCP ${round(m.lcp)} ms`)
  await ctx.close()
}

// ------------------------------------------------------------- (b) trace attribution
P('\n## Main-thread attribution from a CDP trace (mobile, Fast 3G, CPU 4x, one run)')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.clearBrowserCache')
  await cdp.send('Network.emulateNetworkConditions', FAST3G)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const events = []
  cdp.on('Tracing.dataCollected', (e) => events.push(...e.value))
  await cdp.send('Tracing.start', {
    traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'loading'] },
    transferMode: 'ReportEvents',
  })
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 180000 })
  await page.waitForFunction(() => performance.now() > performance.getEntriesByType('navigation')[0].loadEventEnd + 2000, null, { timeout: 60000 }).catch(() => {})
  const done = new Promise((res) => cdp.once('Tracing.tracingComplete', res))
  await cdp.send('Tracing.end')
  await done
  // aggregate self time per script url for FunctionCall/EvaluateScript/v8.run
  const byUrl = {}
  const byName = {}
  for (const ev of events) {
    if (ev.ph !== 'X' && ev.ph !== 'B') continue
    const d = ev.dur || 0
    if (!d) continue
    const a = ev.args && ev.args.data ? ev.args.data : {}
    const url = a.url || a.scriptName || a.fileName || ''
    if (/EvaluateScript|FunctionCall|v8\.run|v8\.callFunction|CompileScript|v8\.compile/.test(ev.name)) {
      const k = (url || '(inline/unknown)').replace(BASE, '')
      byUrl[k] = (byUrl[k] || 0) + d / 1000
    }
    byName[ev.name] = (byName[ev.name] || 0) + d / 1000
  }
  P('\nTop main-thread event types by total duration (ms, includes nesting):')
  for (const [k, v] of Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 14)) P(`  - ${k}: ${round(v)} ms`)
  P('\nScript execution/compile time by URL (ms):')
  for (const [k, v] of Object.entries(byUrl).sort((a, b) => b[1] - a[1]).slice(0, 14)) P(`  - ${k}: ${round(v)} ms`)
  writeFileSync(new URL('./05-trace-events.json', import.meta.url), JSON.stringify({ byName, byUrl }, null, 1))
  await ctx.close()
}

// --------------------------------------------------------- (c) differential blocking
P('\n## Differential experiment (mobile, Fast 3G, CPU 4x, 3 runs each, medians)')
const variants = [
  { name: 'baseline', block: [] },
  { name: 'no gsap/ScrollTrigger', block: ['**/gsap.*.js', '**/ScrollTrigger.*.js'] },
  { name: 'no hero image', block: ['**/hero-shop.webp'] },
  { name: 'no product images', block: ['**/p-*.webp'] },
  { name: 'no fonts', block: ['**/fonts/**'] },
]
P('| variant | FCP ms | LCP ms | LCP element | TBT ms | load ms | bytes KB |')
P('|---|---|---|---|---|---|---|')
for (const v of variants) {
  const fcps = [], lcps = [], tbts = [], lds = [], bys = []
  let el = ''
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.addInitScript(INIT)
    for (const g of v.block) await page.route(g, (r) => r.abort())
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.clearBrowserCache')
    await cdp.send('Network.emulateNetworkConditions', FAST3G)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 180000 })
    await page.waitForFunction(() => performance.now() > performance.getEntriesByType('navigation')[0].loadEventEnd + 1500, null, { timeout: 60000 }).catch(() => {})
    const r = await page.evaluate(() => ({
      m: JSON.parse(JSON.stringify(window.__m)),
      load: performance.getEntriesByType('navigation')[0].loadEventEnd,
      bytes: performance.getEntriesByType('resource').reduce((s, x) => s + x.transferSize, 0),
    }))
    fcps.push(r.m.fcp); lcps.push(r.m.lcp); lds.push(r.load); bys.push(r.bytes)
    tbts.push(r.m.long.reduce((s, x) => s + Math.max(0, x.d - 50), 0))
    el = r.m.lcpEl ? `${r.m.lcpEl.tag}.${String(r.m.lcpEl.cls).slice(0, 24)}${r.m.lcpEl.url ? ' ' + r.m.lcpEl.url.replace(BASE, '') : ''}` : ''
    await ctx.close()
  }
  P(`| ${v.name} | ${round(median(fcps))} (${rng(fcps)}) | ${round(median(lcps))} (${rng(lcps)}) | ${el} | ${round(median(tbts))} (${rng(tbts)}) | ${round(median(lds))} | ${kb(median(bys))} |`)
}

await browser.close()
writeFileSync(new URL('./05-waterfall.md', import.meta.url), L.join('\n'))
console.log('\nwrote 05-waterfall.md')
