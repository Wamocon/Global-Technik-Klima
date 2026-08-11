/**
 * L7-10 — remaining measurements.
 * (a) chat message-loss window: two Enter presses N ms apart, N = 50..600.
 * (b) total image weight per locale after a full scroll; logo-dark.png on theme switch.
 * (c) FOUT window: FCP → document.fonts.ready under Fast 3G / Slow 3G + filmstrip PNGs.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, LOCALES, bucket, median, kb, round, rng } from './lib.mjs'

const DIR = new URL('./', import.meta.url).pathname.replace(/^\//, '')
const L = []
const P = (s) => { L.push(s); console.log(s) }
const FAST3G = { offline: false, latency: 562.5, downloadThroughput: 184320, uploadThroughput: 84375 }
const SLOW3G = { offline: false, latency: 2000, downloadThroughput: 51200, uploadThroughput: 51200 }
const browser = await chromium.launch()

// ---------------------------------------------------------------- (a) loss window
P('# L7-10 remaining measurements')
P('\n## (a) Chat: how close together may two messages be sent before one is silently dropped?')
P('Method: type msg A, press Enter, wait N ms, type msg B, press Enter. Then count .msg.me bubbles.')
P('| gap ms | rep | accepted | 2nd message present | input box after | verdict |')
P('|---|---|---|---|---|---|')
const lossAgg = {}
for (const gap of [50, 100, 200, 260, 300, 400, 600]) {
  lossAgg[gap] = []
  for (let r = 0; r < 3; r++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await page.click('#chatfab')
    await page.waitForFunction(() => document.getElementById('chatpanel').hidden === false, null, { timeout: 5000 })
    const out = await page.evaluate(async (gap) => {
      const input = document.getElementById('cin')
      const form = document.getElementById('cform')
      const fire = (t) => { input.value = t; form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }
      fire('AAA 40 m2 salon')
      await new Promise((r) => setTimeout(r, gap))
      fire('BBB montaj fiyat')
      await new Promise((r) => setTimeout(r, 3000))
      return { me: [...document.querySelectorAll('#cbody .msg.me')].map((x) => x.textContent), inputVal: input.value }
    }, gap)
    const has2 = out.me.some((t) => t.includes('BBB'))
    lossAgg[gap].push({ n: out.me.length, has2, inputVal: out.inputVal })
    P(`| ${gap} | ${r} | ${out.me.length} | ${has2} | "${out.inputVal}" | ${has2 ? 'both sent' : '2nd DROPPED'} |`)
    await ctx.close()
  }
}
P('\nSummary: ' + Object.entries(lossAgg).map(([g, v]) => `${g}ms → ${v.filter((x) => x.has2).length}/3 delivered`).join(' · '))

// ------------------------------------------------- (b) total image weight per locale
P('\n## (b) Total image weight once the whole page has been seen (per locale, mobile 390x844 DPR2)')
P('| locale | image files | image KB | total page KB | total requests |')
P('|---|---|---|---|---|')
for (const loc of LOCALES) {
  const rs = []
  for (let r = 0; r < 3; r++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(loc.url, { waitUntil: 'load' })
    await page.evaluate(async () => {
      const step = Math.round(innerHeight * 0.6)
      for (let y = 0; y <= document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) }
    })
    await page.waitForFunction(() => performance.getEntriesByType('resource').every((x) => x.responseEnd > 0), null, { timeout: 20000 }).catch(() => {})
    await page.waitForFunction(() => [...document.querySelectorAll('img')].every((i) => i.complete), null, { timeout: 20000 }).catch(() => {})
    const d = await page.evaluate(() => {
      const rs = performance.getEntriesByType('resource')
      const im = rs.filter((x) => /\.(webp|png|jpe?g|avif|svg)$/.test(x.name))
      return { imN: im.length, imB: im.reduce((s, x) => s + x.transferSize, 0), totB: rs.reduce((s, x) => s + x.transferSize, 0), n: rs.length, list: im.map((x) => x.name.replace(location.origin, '') + '=' + Math.round(x.transferSize / 1024) + 'KB') }
    })
    rs.push(d)
    await ctx.close()
  }
  P(`| ${loc.key} | ${median(rs.map((x) => x.imN))} | ${kb(median(rs.map((x) => x.imB)))} | ${kb(median(rs.map((x) => x.totB)))} | ${median(rs.map((x) => x.n))} |`)
  P(`  · ${rs[0].list.sort().join(', ')}`)
}

P('\n### Theme switch cost (dark → light → dark, mobile)')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  const before = await page.evaluate(() => performance.getEntriesByType('resource').filter((x) => /logo/.test(x.name)).map((x) => x.name.replace(location.origin, '') + '=' + x.transferSize))
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 5000 })
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((x) => /logo-dark/.test(x.name)), null, { timeout: 8000 }).catch(() => {})
  const after = await page.evaluate(() => performance.getEntriesByType('resource').filter((x) => /logo/.test(x.name)).map((x) => x.name.replace(location.origin, '') + '=' + x.transferSize))
  P(`- logo requests before toggle: ${JSON.stringify(before)}`)
  P(`- logo requests after toggle:  ${JSON.stringify(after)}`)
  await ctx.close()
}

// ------------------------------------------------------------------ (c) FOUT window
P('\n## (c) FOUT window (font-display: swap) — FCP → document.fonts.ready')
P('| net | locale | rep | FCP ms | fonts.ready ms | FOUT window ms | LCP ms |')
P('|---|---|---|---|---|---|---|')
const INIT = () => {
  window.__m = { fcp: null, lcp: null, ready: null }
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime }).observe({ type: 'paint', buffered: true })
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
  document.fonts.ready.then(() => { window.__m.ready = performance.now() })
}
const foutAgg = {}
for (const [nname, net] of [['fast3g', FAST3G], ['slow3g', SLOW3G]]) {
  for (const loc of [LOCALES[0], LOCALES[2]]) {
    const key = nname + '/' + loc.key
    foutAgg[key] = []
    for (let r = 0; r < 3; r++) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      await page.addInitScript(INIT)
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.clearBrowserCache')
      await cdp.send('Network.emulateNetworkConditions', net)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.goto(loc.url, { waitUntil: 'load', timeout: 180000 })
      await page.waitForFunction(() => window.__m.ready !== null, null, { timeout: 60000 }).catch(() => {})
      const m = await page.evaluate(() => window.__m)
      foutAgg[key].push(m)
      P(`| ${nname} | ${loc.key} | ${r} | ${round(m.fcp)} | ${round(m.ready)} | ${round(m.ready - m.fcp)} | ${round(m.lcp)} |`)
      await ctx.close()
    }
  }
}
P('\nMedians: ' + Object.entries(foutAgg).map(([k, v]) => `${k}: FOUT ${round(median(v.map((x) => x.ready - x.fcp)))} ms`).join(' · '))

// filmstrip on fast3g
P('\n### Filmstrip (mobile, Fast 3G, CPU 4x) — screenshots at fixed offsets after navigation start')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.clearBrowserCache')
  await cdp.send('Network.emulateNetworkConditions', FAST3G)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const shots = []
  const nav = page.goto(BASE + '/', { waitUntil: 'load', timeout: 180000 })
  const t0 = Date.now()
  for (const at of [1000, 2000, 2500, 3000, 4000, 5000]) {
    const wait = at - (Date.now() - t0)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    const p = `${DIR}film-${at}ms.png`
    await page.screenshot({ path: p }).catch(() => {})
    shots.push(p)
  }
  await nav
  P('- ' + shots.join('\n- '))
  await ctx.close()
}

await browser.close()
writeFileSync(new URL('./10-final.md', import.meta.url), L.join('\n'))
console.log('\nwrote 10-final.md')
