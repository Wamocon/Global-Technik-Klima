/**
 * L7-09 — "load" for a static site, honestly scoped.
 *
 * (A) Pure-HTTP burst against `astro preview`: 8 / 16 / 32 concurrent GET / — this
 *     isolates SERVER capacity from browser CPU contention. 3 rounds each.
 * (B) 8 simultaneous real page loads (8 browser contexts) — this is the client-side
 *     picture and is CPU-bound on one machine; reported as such.
 * (C) Chat under rapid fire: 20 submits as fast as the form accepts them, then the
 *     same 20 sent one-at-a-time. Measures per-answer latency, DOM growth,
 *     lost/reordered messages. Run twice: real 404 fallback, and a mocked 200
 *     /api/chat (page.route) so the LLM path is exercised too.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, kb, round, rng } from './lib.mjs'

const L = []
const P = (s) => { L.push(s); console.log(s) }
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))] }

// ------------------------------------------------------------------ (A) HTTP burst
P('# L7-09 concurrency + chat under load')
P('\n## (A) Pure-HTTP burst against `astro preview` (node fetch, no browser)')
P('| concurrency | round | wall ms | throughput req/s | latency min/median/p95/max ms | bytes total | failures |')
P('|---|---|---|---|---|---|---|')
const aAgg = {}
for (const c of [1, 8, 16, 32]) {
  aAgg[c] = []
  for (let r = 0; r < 3; r++) {
    const t0 = Date.now()
    const res = await Promise.all(
      Array.from({ length: c }, async () => {
        const s = Date.now()
        try {
          const r = await fetch(BASE + '/', { headers: { 'accept-encoding': 'gzip' } })
          const b = await r.arrayBuffer()
          return { ms: Date.now() - s, ok: r.ok, bytes: b.byteLength }
        } catch (e) { return { ms: Date.now() - s, ok: false, bytes: 0, err: String(e) } }
      })
    )
    const wall = Date.now() - t0
    const lat = res.map((x) => x.ms)
    const fails = res.filter((x) => !x.ok)
    aAgg[c].push({ wall, lat, bytes: res.reduce((s, x) => s + x.bytes, 0), fails: fails.length })
    P(`| ${c} | ${r} | ${wall} | ${round((c / wall) * 1000, 1)} | ${Math.min(...lat)}/${round(median(lat))}/${pct(lat, 0.95)}/${Math.max(...lat)} | ${kb(res.reduce((s, x) => s + x.bytes, 0))} KB | ${fails.length}${fails.length ? ' ' + JSON.stringify(fails[0]) : ''} |`)
  }
}
P('\nMedians: ' + Object.entries(aAgg).map(([c, v]) => `c=${c}: wall ${median(v.map((x) => x.wall))} ms, p95 latency ${median(v.map((x) => pct(x.lat, 0.95)))} ms`).join(' · '))

// -------------------------------------------------------- (B) 8 parallel real loads
P('\n## (B) 8 simultaneous real page loads (8 contexts, unthrottled) — CPU-bound on one host')
const browser = await chromium.launch()
{
  const runOne = async (i) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    const t0 = Date.now()
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 120000 })
    const m = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0]
      return { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, bytes: performance.getEntriesByType('resource').reduce((s, x) => s + x.transferSize, 0) }
    })
    const wall = Date.now() - t0
    await ctx.close()
    return { i, wall, ...m }
  }
  // baseline: 1 at a time, 3x
  const base = []
  for (let k = 0; k < 3; k++) base.push(await runOne(-1))
  P(`- sequential baseline (3 runs): TTFB median ${round(median(base.map((x) => x.ttfb)))} ms, load median ${round(median(base.map((x) => x.load)))} ms, wall median ${median(base.map((x) => x.wall))} ms`)
  for (let round_ = 0; round_ < 3; round_++) {
    const t0 = Date.now()
    const all = await Promise.all(Array.from({ length: 8 }, (_, i) => runOne(i)))
    const wall = Date.now() - t0
    P(`- round ${round_}: 8 loads in ${wall} ms wall · TTFB min/med/max ${round(Math.min(...all.map((x) => x.ttfb)))}/${round(median(all.map((x) => x.ttfb)))}/${round(Math.max(...all.map((x) => x.ttfb)))} ms · load min/med/max ${round(Math.min(...all.map((x) => x.load)))}/${round(median(all.map((x) => x.load)))}/${round(Math.max(...all.map((x) => x.load)))} ms · bytes median ${kb(median(all.map((x) => x.bytes)))} KB`)
  }
}

// ------------------------------------------------------------------ (C) chat load
const MSGS = Array.from({ length: 20 }, (_, i) => `mesaj-${String(i + 1).padStart(2, '0')} 40 m2 salon klima`)
const chatCase = async ({ mock, mode }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  await cdp.send('HeapProfiler.enable')
  let apiCalls = 0
  if (mock) {
    await page.route('**/api/chat', async (route) => {
      apiCalls++
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Mock cevap ' + apiCalls, wa: 'https://wa.me/905330461387' }) })
    })
  } else {
    page.on('response', (r) => { if (r.url().includes('/api/chat')) apiCalls++ })
  }
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.click('#chatfab')
  await page.waitForFunction(() => document.getElementById('chatpanel').hidden === false, null, { timeout: 5000 })
  const M = (m, k) => (m.metrics.find((x) => x.name === k) || {}).value || 0
  await cdp.send('HeapProfiler.collectGarbage')
  const m0 = await cdp.send('Performance.getMetrics')
  const n0 = await page.evaluate(() => document.getElementsByTagName('*').length)

  const t0 = Date.now()
  const lat = []
  if (mode === 'burst') {
    // fire all 20 submits back to back, no waiting at all
    await page.evaluate(async (msgs) => {
      const input = document.getElementById('cin')
      const form = document.getElementById('cform')
      window.__sent = []
      for (const m of msgs) {
        input.value = m
        window.__sent.push(m)
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }, MSGS)
    // wait until the DOM stops changing (real condition, polled)
    await page.waitForFunction(() => { const n = document.querySelectorAll('#cbody .msg').length; return new Promise((r) => setTimeout(() => r(document.querySelectorAll('#cbody .msg').length === n), 500)) }, null, { timeout: 30000 }).catch(() => {})
  } else {
    for (const m of MSGS) {
      const before = await page.evaluate(() => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length)
      const s = Date.now()
      await page.fill('#cin', m)
      await page.press('#cin', 'Enter')
      await page.waitForFunction((b) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > b, before, { timeout: 20000 })
      lat.push(Date.now() - s)
    }
  }
  const wall = Date.now() - t0
  await cdp.send('HeapProfiler.collectGarbage')
  const m1 = await cdp.send('Performance.getMetrics')
  const out = await page.evaluate(() => ({
    total: document.querySelectorAll('#cbody .msg').length,
    me: [...document.querySelectorAll('#cbody .msg.me')].map((x) => x.textContent),
    bot: document.querySelectorAll('#cbody .msg.bot').length,
    wa: document.querySelectorAll('#cbody .msg.wa').length,
    nodes: document.getElementsByTagName('*').length,
    sent: window.__sent || null,
  }))
  await ctx.close()
  return { mode, mock, wall, lat, apiCalls, out, heap0: M(m0, 'JSHeapUsedSize'), heap1: M(m1, 'JSHeapUsedSize'), n0, errs: [...new Set(errs)] }
}

P('\n## (C) Chat under load — 20 messages')
P('| variant | wall ms | messages accepted (.msg.me) | LOST | order preserved | bot bubbles | /api/chat calls | DOM nodes +| heap KB + | latency med / p95 / max ms |')
P('|---|---|---|---|---|---|---|---|---|---|')
const cRes = []
for (const v of [{ mock: false, mode: 'burst' }, { mock: false, mode: 'serial' }, { mock: true, mode: 'burst' }, { mock: true, mode: 'serial' }]) {
  const rs = []
  for (let k = 0; k < 3; k++) rs.push(await chatCase(v))
  cRes.push({ v, rs })
  const acc = rs.map((r) => r.out.me.length)
  const ord = rs.map((r) => JSON.stringify(r.out.me) === JSON.stringify(r.out.me.slice().sort()) )
  const lat = rs.flatMap((r) => r.lat)
  P(
    `| ${v.mock ? 'mocked 200 /api/chat' : 'real 404 → local engine'} · ${v.mode} | ${median(rs.map((r) => r.wall))} | ${median(acc)} of 20 (${rng(acc)}) | ${20 - median(acc)} | ${ord.every(Boolean)} | ${median(rs.map((r) => r.out.bot))} | ${median(rs.map((r) => r.apiCalls))} | ${median(rs.map((r) => r.out.nodes - r.n0))} | ${round(median(rs.map((r) => (r.heap1 - r.heap0) / 1024)))} | ${lat.length ? `${round(median(lat))} / ${round(pct(lat, 0.95))} / ${Math.max(...lat)}` : 'n/a (burst)'} |`
  )
  if (rs[0].errs.length) P(`  · console/page errors: ${JSON.stringify(rs[0].errs).slice(0, 300)}`)
  if (v.mode === 'burst') P(`  · accepted messages, run 0: ${JSON.stringify(rs[0].out.me.map((s) => (s.match(/mesaj-\d+/) || [''])[0]))}`)
  if (v.mode === 'serial') {
    const l = rs[0].lat
    P(`  · latency per message, run 0: ${l.join(', ')} ms → first 5 median ${round(median(l.slice(0, 5)))}, last 5 median ${round(median(l.slice(-5)))}`)
  }
}

await browser.close()
writeFileSync(new URL('./09-load-chat.md', import.meta.url), L.join('\n'))
writeFileSync(new URL('./09-load-chat.json', import.meta.url), JSON.stringify({ aAgg, cRes }, null, 1))
console.log('\nwrote 09-load-chat.md')
