/**
 * L7-01 — Initial payload budget per locale + Three.js lazy discipline.
 * Method: fresh browser context per run (cold cache). CDP Network domain records
 * encodedDataLength (bytes on the wire, gzip as served by astro preview).
 * Cut-off = window 'load' event. Then scroll to #teknik and measure the delta.
 * 3 runs per locale; median + range reported.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, LOCALES, bucket, recorder, perfResources, median, kb, round, rng } from './lib.mjs'

const RUNS = 3
const OUT = {}

const browser = await chromium.launch()

for (const loc of LOCALES) {
  OUT[loc.key] = { runs: [], scroll: [] }
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
    const rec = await recorder(page)
    await page.goto(loc.url, { waitUntil: 'load' })
    // Give in-flight sub-resources that started before load a chance to finish
    await page.waitForFunction(
      () => performance.getEntriesByType('resource').every((r) => r.responseEnd > 0),
      null,
      { timeout: 8000 }
    ).catch(() => {})
    const atLoad = rec.snapshot()
    const perf = await perfResources(page)
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0]
      return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, transfer: n.transferSize, dec: n.decodedBodySize }
    })

    // ---- phase 2: scroll the exploded-unit section into view -------------
    const t0 = Date.now()
    await page.evaluate(() => document.getElementById('teknik')?.scrollIntoView({ block: 'center' }))
    let threeSeen = false
    try {
      await page.waitForFunction(
        () => performance.getEntriesByType('resource').some((r) => /three/.test(r.name)),
        null,
        { timeout: 15000 }
      )
      threeSeen = true
    } catch {}
    // wait for the WebGL canvas to actually have drawn (context exists + non-zero size)
    await page.waitForFunction(
      () => {
        const c = document.getElementById('expCanvas')
        return c && c.width > 0 && c.height > 0
      },
      null,
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForFunction(
      () => performance.getEntriesByType('resource').every((r) => r.responseEnd > 0),
      null,
      { timeout: 10000 }
    ).catch(() => {})
    const afterScroll = rec.snapshot()
    const perf2 = await perfResources(page)
    const threeMs = Date.now() - t0

    OUT[loc.key].runs.push({ atLoad, perf, nav, errs, afterScroll, perf2, threeSeen, threeMs })
    await ctx.close()
  }
}

await browser.close()

// ---------------- reporting -------------------------------------------------
const decOf = (perf, url) => {
  const e = perf.find((p) => p.url === url)
  return e ? e.dec : null
}

const lines = []
const P = (s) => { lines.push(s); console.log(s) }

P('# L7-01 Initial payload budget (mobile 390x844 DPR2, cold cache, cut at `load`)')
P('Transferred = CDP Network.loadingFinished encodedDataLength (gzip as astro preview serves it).')
P('Decoded = PerformanceResourceTiming.decodedBodySize.\n')

for (const loc of LOCALES) {
  const runs = OUT[loc.key].runs
  P(`## ${loc.key.toUpperCase()}  (${loc.url})`)
  const totals = runs.map((r) => r.atLoad.filter((x) => x.finished).reduce((s, x) => s + x.enc, 0))
  const counts = runs.map((r) => r.atLoad.length)
  const dcls = runs.map((r) => r.nav.dcl)
  const loads = runs.map((r) => r.nav.load)
  P(`- requests to load: median ${median(counts)} (range ${rng(counts)})`)
  P(`- transferred to load: median ${kb(median(totals))} KB (range ${rng(totals.map((t) => t / 1024))} KB)`)
  P(`- DCL median ${round(median(dcls))} ms (${rng(dcls)}) · load median ${round(median(loads))} ms (${rng(loads)})`)

  // per-bucket from run 0 (identical resource sets verified below)
  const b = {}
  const r0 = runs[0]
  for (const x of r0.atLoad) {
    const k = bucket(x.url, x.mime)
    b[k] = b[k] || { n: 0, enc: 0, dec: 0 }
    b[k].n++
    b[k].enc += x.enc
    b[k].dec += decOf(r0.perf, x.url) || 0
  }
  P('| bucket | n | transferred KB | decoded KB |')
  P('|---|---|---|---|')
  for (const k of ['html', 'css', 'js', 'font', 'image', 'other']) {
    if (!b[k]) continue
    P(`| ${k} | ${b[k].n} | ${kb(b[k].enc)} | ${b[k].dec ? kb(b[k].dec) : '(nav/inline)'} |`)
  }
  // largest resources
  const big = [...r0.atLoad].sort((x, y) => y.enc - x.enc).slice(0, 8)
  P('\nLargest single resources at `load`:')
  for (const x of big) P(`  - ${kb(x.enc)} KB  ${x.url.replace(BASE, '')}  [${bucket(x.url, x.mime)}]`)

  // resource-set stability across runs
  const sets = runs.map((r) => r.atLoad.map((x) => x.url).sort().join('|'))
  P(`\nResource set identical across ${RUNS} runs: ${new Set(sets).size === 1}`)

  // THREE.JS discipline
  const threeAtLoad = runs.map((r) => r.atLoad.filter((x) => /three/i.test(x.url)).length)
  P(`three.js requests before \`load\`: ${threeAtLoad.join(', ')}  (want 0,0,0)`)
  const jsAtLoad = runs.map((r) => r.atLoad.filter((x) => bucket(x.url, x.mime) === 'js').reduce((s, x) => s + x.enc, 0))
  const jsAtLoadDec = runs.map((r, i) =>
    r.atLoad.filter((x) => bucket(x.url, x.mime) === 'js').reduce((s, x) => s + (decOf(r.perf, x.url) || 0), 0)
  )
  P(`initial JS transferred: median ${kb(median(jsAtLoad))} KB (${rng(jsAtLoad.map(kb))}) · decoded median ${kb(median(jsAtLoadDec))} KB`)

  // after scroll
  const aTot = runs.map((r) => r.afterScroll.filter((x) => x.finished).reduce((s, x) => s + x.enc, 0))
  const aCnt = runs.map((r) => r.afterScroll.length)
  const threeBytes = runs.map((r) => r.afterScroll.filter((x) => /three/i.test(x.url)).reduce((s, x) => s + x.enc, 0))
  const threeDec = runs.map((r) => r.perf2.filter((x) => /three/i.test(x.url)).reduce((s, x) => s + x.dec, 0))
  P(`\nAfter scrolling #teknik into view (full page then scrolled):`)
  P(`- total requests ${median(aCnt)} (${rng(aCnt)}), transferred median ${kb(median(aTot))} KB (${rng(aTot.map(kb))} KB)`)
  P(`- delta vs load: +${kb(median(aTot) - median(totals))} KB, +${median(aCnt) - median(counts)} requests`)
  P(`- three chunk transferred median ${kb(median(threeBytes))} KB, decoded median ${kb(median(threeDec))} KB`)
  P(`- three requested within ${runs.map((r) => r.threeMs).join('/')} ms of the scroll; seen=${runs.map((r) => r.threeSeen).join(',')}`)
  const allErrs = runs.flatMap((r) => r.errs)
  P(`- console/page errors across runs: ${allErrs.length ? JSON.stringify([...new Set(allErrs)]) : 'none'}`)
  P('')
}

writeFileSync(new URL('./01-payload.md', import.meta.url), lines.join('\n'))
writeFileSync(new URL('./01-payload.json', import.meta.url), JSON.stringify(OUT, null, 1))
console.log('\nwrote 01-payload.md / .json')
