/**
 * L7-08 — repeat visit / caching, as served by `astro preview`.
 * Method: one browser context, cold load → warm reload → warm cross-page nav.
 * Per resource: status, fromDiskCache, transferSize (0 = memory/disk cache hit,
 * ~header size = 304 revalidation). 3 reps.
 * The production answer comes from vercel.json, which is read separately — this
 * measures the preview server only and says so.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, bucket, median, kb, round, rng } from './lib.mjs'

const L = []
const P = (s) => { L.push(s); console.log(s) }
const browser = await chromium.launch()
const reps = []

for (let r = 0; r < 3; r++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.clearBrowserCache')
  let phase = 'cold'
  const log = []
  cdp.on('Network.responseReceived', (e) => {
    log.push({ phase, url: e.response.url, status: e.response.status, disk: !!e.response.fromDiskCache, prefetch: !!e.response.fromPrefetchCache, cc: e.response.headers['cache-control'] || e.response.headers['Cache-Control'] || '', etag: !!(e.response.headers.etag || e.response.headers.ETag), len: e.response.encodedDataLength })
  })
  const served = []
  cdp.on('Network.requestServedFromCache', () => served.push(phase))
  cdp.on('Network.loadingFinished', (e) => {})

  await page.goto(BASE + '/', { waitUntil: 'load' })
  const cold = await page.evaluate(() => performance.getEntriesByType('resource').map((x) => ({ url: x.name, t: x.transferSize, e: x.encodedBodySize })))

  phase = 'warm-reload'
  await page.reload({ waitUntil: 'load' })
  const warm = await page.evaluate(() => performance.getEntriesByType('resource').map((x) => ({ url: x.name, t: x.transferSize, e: x.encodedBodySize })))

  phase = 'warm-nav-de'
  await page.goto(BASE + '/de/', { waitUntil: 'load' })
  const nav = await page.evaluate(() => performance.getEntriesByType('resource').map((x) => ({ url: x.name, t: x.transferSize, e: x.encodedBodySize })))

  reps.push({ log, cold, warm, nav })
  await ctx.close()
}
await browser.close()

P('# L7-08 repeat visit / caching — `astro preview` (NOT production)')
P('transferSize 0 = served from memory/disk cache without hitting the network.')
P('A 304 shows up as status 304 with a small encodedDataLength (headers only).\n')
P('| phase | requests | bytes | from cache (transferSize 0) | 304 revalidations | 200 full re-downloads |')
P('|---|---|---|---|---|---|')
for (const ph of ['cold', 'warm-reload', 'warm-nav-de']) {
  const key = ph === 'cold' ? 'cold' : ph === 'warm-reload' ? 'warm' : 'nav'
  const n = reps.map((r) => r[key].length)
  const by = reps.map((r) => r[key].reduce((s, x) => s + x.t, 0))
  const zero = reps.map((r) => r[key].filter((x) => x.t === 0).length)
  const l304 = reps.map((r) => r.log.filter((x) => x.phase === ph && x.status === 304).length)
  const l200 = reps.map((r) => r.log.filter((x) => x.phase === ph && x.status === 200 && !x.disk).length)
  P(`| ${ph} | ${median(n)} (${rng(n)}) | ${kb(median(by))} KB | ${median(zero)} | ${median(l304)} | ${median(l200)} |`)
}

P('\n## What the preview server sends per bucket (run 0, cold phase)')
const seen = new Map()
for (const e of reps[0].log) if (!seen.has(e.url)) seen.set(e.url, e)
const byBucket = {}
for (const e of seen.values()) {
  const b = bucket(e.url)
  byBucket[b] = byBucket[b] || new Set()
  byBucket[b].add(`Cache-Control: "${e.cc}" ETag:${e.etag}`)
}
for (const [b, s] of Object.entries(byBucket)) P(`- ${b}: ${[...s].join(' · ')}`)

P('\n## Warm reload, per resource (run 0)')
P('| resource | cold bytes | warm bytes | status on warm |')
P('|---|---|---|---|')
const c0 = new Map(reps[0].cold.map((x) => [x.url, x.t]))
for (const x of reps[0].warm) {
  const st = reps[0].log.find((l) => l.phase === 'warm-reload' && l.url === x.url)
  P(`| ${x.url.replace(BASE, '')} | ${c0.get(x.url) ?? '-'} | ${x.t} | ${st ? st.status + (st.disk ? ' (disk cache)' : '') : 'no network event'} |`)
}

P('\n## Cross-locale nav / → /de/ (run 0): which assets were reused?')
const warmSet = new Set(reps[0].warm.map((x) => x.url))
for (const x of reps[0].nav) {
  const st = reps[0].log.find((l) => l.phase === 'warm-nav-de' && l.url === x.url)
  P(`- ${x.url.replace(BASE, '')}: ${x.t} bytes${st ? ' status ' + st.status : ''}${warmSet.has(x.url) ? ' (same URL as previous page)' : ' (new URL)'}`)
}

writeFileSync(new URL('./08-cache.md', import.meta.url), L.join('\n'))
console.log('\nwrote 08-cache.md')
