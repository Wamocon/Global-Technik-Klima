/**
 * L7-03 — precise `load`-cut payload, image over-delivery, font behaviour.
 *
 * Method:
 *  - addInitScript installs a `load` listener FIRST, so window.__atLoad is a
 *    deterministic snapshot of PerformanceResourceTiming at loadEventEnd
 *    (no polling artefacts).
 *  - Images: every <img> plus CSS background images that were actually fetched;
 *    naturalWidth/Height vs getBoundingClientRect * DPR = over-delivery ratio.
 *  - Fonts: document.fonts FontFace status ('loaded' = the browser really used it)
 *    cross-checked against the two <link rel=preload> URLs.
 *  - 3 runs per locale, both viewports.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, LOCALES, bucket, median, kb, round, rng } from './lib.mjs'

const RUNS = 3
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, dpr: 2 },
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
]

const INIT = () => {
  window.__consoleWarns = []
  addEventListener(
    'load',
    () => {
      window.__loadT = performance.now()
      window.__atLoad = performance.getEntriesByType('resource').map((r) => ({
        url: r.name,
        init: r.initiatorType,
        transfer: r.transferSize,
        enc: r.encodedBodySize,
        dec: r.decodedBodySize,
        start: r.startTime,
        end: r.responseEnd,
        rb: r.renderBlockingStatus,
      }))
    },
    { once: true, capture: true }
  )
}

const out = {}
const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  for (const loc of LOCALES) {
    const key = `${loc.key}/${vp.name}`
    out[key] = []
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dpr,
      })
      const page = await ctx.newPage()
      const warns = []
      page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(`[${m.type()}] ${m.text()}`) })
      await page.addInitScript(INIT)
      await page.goto(loc.url, { waitUntil: 'load' })
      await page.waitForFunction(() => window.__atLoad !== undefined, null, { timeout: 10000 })
      // Let font matching settle: document.fonts.ready is a real condition, not a sleep.
      await page.evaluate(() => document.fonts.ready)

      const data = await page.evaluate(() => {
        const dpr = devicePixelRatio
        const imgs = [...document.querySelectorAll('img')].map((im) => {
          const r = im.getBoundingClientRect()
          return {
            src: im.currentSrc || im.src,
            attrW: im.getAttribute('width'),
            attrH: im.getAttribute('height'),
            loading: im.getAttribute('loading'),
            fetchpriority: im.getAttribute('fetchpriority'),
            decoding: im.getAttribute('decoding'),
            natW: im.naturalWidth,
            natH: im.naturalHeight,
            cssW: Math.round(r.width),
            cssH: Math.round(r.height),
            docTop: Math.round(r.top + scrollY),
            complete: im.complete,
            dpr,
          }
        })
        // Any element with a CSS background-image that resolves to a url()
        const bgs = []
        for (const el of document.querySelectorAll('*')) {
          const bi = getComputedStyle(el).backgroundImage
          if (!bi || bi === 'none') continue
          const m = [...bi.matchAll(/url\("?([^")]+)"?\)/g)].map((x) => x[1])
          if (!m.length) continue
          const r = el.getBoundingClientRect()
          bgs.push({
            sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
            urls: m,
            cssW: Math.round(r.width),
            cssH: Math.round(r.height),
            docTop: Math.round(r.top + scrollY),
          })
        }
        const faces = []
        document.fonts.forEach((f) =>
          faces.push({ family: f.family, style: f.style, weight: f.weight, display: f.display, unicodeRange: f.unicodeRange.slice(0, 40), status: f.status, src: (f.__src || '') })
        )
        const preloads = [...document.querySelectorAll('link[rel=preload]')].map((l) => ({ href: l.href, as: l.as }))
        return {
          imgs,
          bgs,
          faces,
          preloads,
          atLoad: window.__atLoad,
          loadT: window.__loadT,
          docH: document.documentElement.scrollHeight,
          vh: innerHeight,
          dpr,
        }
      })
      data.warns = warns
      out[key].push(data)
      await ctx.close()
    }
  }
}
await browser.close()

// --------------------------- report ----------------------------------------
const L = []
const P = (s) => { L.push(s); console.log(s) }
const rel = (u) => u.replace(BASE, '')

P('# L7-03  precise `load` cut, images, fonts')
P('`load` cut = PerformanceResourceTiming snapshot taken inside a capture-phase `load`')
P('listener installed via addInitScript (runs before any page listener).\n')

P('## A. Payload strictly before loadEventEnd')
P('| locale/vp | req | transfer KB | html | css | js | font | image |')
P('|---|---|---|---|---|---|---|---|')
const perKey = {}
for (const key of Object.keys(out)) {
  const runs = out[key]
  const tot = runs.map((r) => r.atLoad.reduce((s, x) => s + x.transfer, 0))
  const cnt = runs.map((r) => r.atLoad.length)
  const bk = (k) => runs.map((r) => r.atLoad.filter((x) => bucket(x.url) === k).reduce((s, x) => s + x.transfer, 0))
  perKey[key] = { tot, cnt, runs }
  P(
    `| ${key} | ${median(cnt)} | ${kb(median(tot))} | ${kb(median(bk('html')))} | ${kb(median(bk('css')))} | ${kb(median(bk('js')))} | ${kb(median(bk('font')))} | ${kb(median(bk('image')))} |`
  )
}

P('\n### JS strictly before load (the ~22 KB claim)')
for (const key of Object.keys(out)) {
  const runs = out[key]
  const js = runs.map((r) => r.atLoad.filter((x) => bucket(x.url) === 'js'))
  const enc = js.map((a) => a.reduce((s, x) => s + x.transfer, 0))
  const dec = js.map((a) => a.reduce((s, x) => s + x.dec, 0))
  const names = [...new Set(js.flat().map((x) => rel(x.url)))].sort()
  P(`- ${key}: transfer median ${kb(median(enc))} KB (${rng(enc.map(kb))}) · decoded median ${kb(median(dec))} KB — files: ${names.map((n) => n.replace('/_astro/', '')).join(', ')}`)
}

P('\n### GSAP / ScrollTrigger — before or after load?')
for (const key of Object.keys(out)) {
  const runs = out[key]
  const g = runs.map((r) => r.atLoad.filter((x) => /gsap|ScrollTrigger/.test(x.url)).length)
  const t = runs.map((r) => r.atLoad.filter((x) => /three/.test(x.url)).length)
  P(`- ${key}: gsap+ScrollTrigger entries present at load = ${g.join(',')} · three = ${t.join(',')}`)
}

P('\n## B. Images — over-delivery')
for (const key of Object.keys(out)) {
  const r0 = out[key][0]
  P(`\n### ${key}  (doc height ${r0.docH}px, viewport ${r0.vh}px, DPR ${r0.dpr})`)
  P('| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |')
  P('|---|---|---|---|---|---|---|---|---|')
  for (const im of r0.imgs) {
    const needW = im.cssW * im.dpr
    const needH = im.cssH * im.dpr
    const ratio = needW && needH ? (im.natW * im.natH) / (needW * needH) : NaN
    const loadedAtLoad = r0.atLoad.some((x) => x.url === im.src)
    P(
      `| ${rel(im.src)} | ${im.natW}x${im.natH} | ${im.cssW}x${im.cssH} | ${needW}x${needH} | ${round(ratio, 2)}x area | ${im.loading} | ${im.attrW}x${im.attrH} | ${im.docTop > r0.vh ? 'yes (' + im.docTop + 'px)' : 'NO — above fold'} | ${loadedAtLoad} |`
    )
  }
  const bgList = [...new Set(r0.bgs.flatMap((b) => b.urls))].filter((u) => !u.startsWith('data:') && !/gradient/.test(u))
  P(`\nCSS background images present: ${bgList.map(rel).join(', ') || 'none'}`)
  for (const b of r0.bgs.filter((b) => b.urls.some((u) => /\.(png|jpe?g|webp|avif)$/.test(u)))) {
    P(`  - ${b.sel}: ${b.urls.map(rel).join(',')} box ${b.cssW}x${b.cssH} @docTop ${b.docTop}`)
  }
  const imgBytes = r0.atLoad.filter((x) => bucket(x.url) === 'image')
  P(`\nImage bytes before load: ${kb(imgBytes.reduce((s, x) => s + x.transfer, 0))} KB over ${imgBytes.length} files:`)
  for (const x of imgBytes.sort((a, b) => b.transfer - a.transfer)) P(`  - ${kb(x.transfer)} KB ${rel(x.url)} (initiator ${x.init})`)
}

P('\n## C. Fonts')
for (const key of Object.keys(out)) {
  const r0 = out[key][0]
  const fonts = r0.atLoad.filter((x) => bucket(x.url) === 'font')
  P(`\n### ${key}`)
  P(`- preload links: ${r0.preloads.map((p) => rel(p.href) + ' as=' + p.as).join(' | ')}`)
  P(`- font files fetched before load: ${fonts.length}, ${kb(fonts.reduce((s, x) => s + x.transfer, 0))} KB`)
  for (const f of fonts.sort((a, b) => b.transfer - a.transfer)) P(`   · ${kb(f.transfer)} KB ${rel(f.url)} (initiator ${f.init}, rb ${f.rb})`)
  const loaded = r0.faces.filter((f) => f.status === 'loaded')
  P(`- FontFace objects with status 'loaded' (= actually matched to text): ${loaded.length}/${r0.faces.length}`)
  for (const f of loaded) P(`   · ${f.family} ${f.style} ${f.weight} display=${f.display} range=${f.unicodeRange}…`)
  const cyr = fonts.filter((f) => /cyrillic/.test(f.url))
  P(`- Cyrillic subsets fetched: ${cyr.length ? cyr.map((f) => rel(f.url)).join(', ') : 'none'}`)
  const w = [...new Set(out[key].flatMap((r) => r.warns))].filter((x) => /preload/i.test(x))
  P(`- preload-related console warnings: ${w.length ? JSON.stringify(w) : 'none'}`)
  const allw = [...new Set(out[key].flatMap((r) => r.warns))]
  if (allw.length) P(`- all console warn/err: ${JSON.stringify(allw)}`)
}

writeFileSync(new URL('./03-images-fonts.md', import.meta.url), L.join('\n'))
writeFileSync(new URL('./03-images-fonts.json', import.meta.url), JSON.stringify(out, null, 1))
console.log('\nwrote 03-images-fonts.md/.json')
