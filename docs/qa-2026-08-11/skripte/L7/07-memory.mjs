/**
 * L7-07 — memory & long-session behaviour.
 *
 * Method: CDP Performance.getMetrics (JSHeapUsedSize, Nodes, JSEventListeners,
 * Documents, LayoutCount, RecalcStyleCount) sampled after
 * HeapProfiler.collectGarbage() so only retained memory is compared.
 * Baseline → action → GC → sample, repeated in 5 checkpoints per action so a trend
 * (not just an endpoint) is visible. 3 reps of the whole sequence.
 *
 * Actions: 50 chat open/close · 30 theme toggles · 10 full-page scroll passes
 *          through the three.js section · 20 viewport resizes (mobile<->desktop).
 * Also: WebGL context count, whether the renderer is disposed, canvas count.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'

const REPS = 3
const L = []
const P = (s) => { L.push(s); console.log(s) }

const INIT = () => {
  window.__ctxs = []
  window.__lost = 0
  const ogc = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    const c = ogc.call(this, t, ...a)
    if (/webgl/.test(t)) {
      window.__ctxs.push(c)
      this.addEventListener('webglcontextlost', () => window.__lost++)
    }
    return c
  }
}

const browser = await chromium.launch()
const M = (m, k) => (m.metrics.find((x) => x.name === k) || {}).value || 0

const sample = async (cdp, page, label) => {
  await cdp.send('HeapProfiler.collectGarbage')
  const m = await cdp.send('Performance.getMetrics')
  const dom = await page.evaluate(() => ({
    nodes: document.getElementsByTagName('*').length,
    msgs: document.querySelectorAll('#cbody .msg').length,
    canvases: document.querySelectorAll('canvas').length,
    ctxs: window.__ctxs.length,
    lost: window.__lost,
    glAlive: window.__ctxs.map((c) => (c && !c.isContextLost ? 'n/a' : c && c.isContextLost() ? 'LOST' : 'alive')),
  }))
  return {
    label,
    heap: M(m, 'JSHeapUsedSize'),
    heapTotal: M(m, 'JSHeapTotalSize'),
    nodes: M(m, 'Nodes'),
    listeners: M(m, 'JSEventListeners'),
    docs: M(m, 'Documents'),
    layouts: M(m, 'LayoutCount'),
    recalcs: M(m, 'RecalcStyleCount'),
    ...dom,
  }
}

const runs = []
for (let rep = 0; rep < REPS; rep++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  await cdp.send('HeapProfiler.enable')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForFunction(() => document.querySelector('[data-reveal].shown') !== null, null, { timeout: 20000 }).catch(() => {})
  const seq = []
  seq.push(await sample(cdp, page, 'baseline after load'))

  // ---- A. 50 chat open/close cycles, checkpointed every 10 ------------------
  for (let b = 0; b < 5; b++) {
    for (let k = 0; k < 10; k++) {
      await page.click('#chatfab')
      await page.waitForFunction(() => document.getElementById('chatpanel').hidden === false, null, { timeout: 5000 })
      await page.click('#cclose')
      await page.waitForFunction(() => document.getElementById('chatpanel').hidden === true, null, { timeout: 5000 })
    }
    seq.push(await sample(cdp, page, `A chat open/close x${(b + 1) * 10}`))
  }

  // ---- B. 30 theme toggles, checkpointed every 10 ---------------------------
  for (let b = 0; b < 3; b++) {
    for (let k = 0; k < 10; k++) {
      const before = await page.evaluate(() => document.documentElement.dataset.theme || 'dark')
      await page.click('#themetog')
      await page.waitForFunction((b) => (document.documentElement.dataset.theme || 'dark') !== b, before, { timeout: 5000 })
    }
    seq.push(await sample(cdp, page, `B theme toggle x${(b + 1) * 10}`))
  }

  // ---- C. 10 full-page scroll passes through the 3D section -----------------
  for (let b = 0; b < 5; b++) {
    for (let k = 0; k < 2; k++) {
      await page.evaluate(async () => {
        const step = Math.round(innerHeight * 0.8)
        const end = document.documentElement.scrollHeight
        for (let y = 0; y <= end; y += step) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
        for (let y = end; y >= 0; y -= step) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
      })
    }
    seq.push(await sample(cdp, page, `C full-page scroll pass x${(b + 1) * 2}`))
  }

  // ---- D. 20 viewport resizes mobile<->desktop ------------------------------
  for (let b = 0; b < 4; b++) {
    for (let k = 0; k < 5; k++) {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.waitForFunction(() => innerWidth === 1440, null, { timeout: 5000 })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.waitForFunction(() => innerWidth === 390, null, { timeout: 5000 })
    }
    seq.push(await sample(cdp, page, `D resize mobile<->desktop x${(b + 1) * 5}`))
  }

  // ---- E. idle recovery window (does the heap come back down?) -------------
  await page.evaluate(() => new Promise((r) => setTimeout(r, 3000)))
  seq.push(await sample(cdp, page, 'E after 3 s idle + GC'))

  runs.push(seq)
  await ctx.close()
}
await browser.close()

// ------------------------------- report ------------------------------------
P('# L7-07 memory & long-session behaviour (mobile 390x844 DPR2, CPU 4x, 3 reps)')
P('Every row sampled AFTER HeapProfiler.collectGarbage(), so these are retained bytes.')
P('| checkpoint | JS heap KB (median) | range | Δ vs baseline KB | DOM nodes | listeners | Documents | chat .msg nodes | canvases | WebGL ctx | ctx lost |')
P('|---|---|---|---|---|---|---|---|---|---|---|')
const n = runs[0].length
for (let i = 0; i < n; i++) {
  const h = runs.map((r) => r[i].heap / 1024)
  const b = runs.map((r) => r[0].heap / 1024)
  P(
    `| ${runs[0][i].label} | ${round(median(h))} | ${rng(h)} | ${round(median(h) - median(b))} | ${median(runs.map((r) => r[i].nodes))} | ${median(runs.map((r) => r[i].listeners))} | ${median(runs.map((r) => r[i].docs))} | ${median(runs.map((r) => r[i].msgs))} | ${median(runs.map((r) => r[i].canvases))} | ${median(runs.map((r) => r[i].ctxs))} | ${median(runs.map((r) => r[i].lost))} |`
  )
}

P('\n## Per-action deltas (median across 3 reps)')
const at = (label) => {
  const i = runs[0].findIndex((x) => x.label === label)
  return { heap: median(runs.map((r) => r[i].heap / 1024)), nodes: median(runs.map((r) => r[i].nodes)), lst: median(runs.map((r) => r[i].listeners)) }
}
const base = at('baseline after load')
const rows = [
  ['A 50 chat open/close', 'A chat open/close x50', 'baseline after load'],
  ['B 30 theme toggles', 'B theme toggle x30', 'A chat open/close x50'],
  ['C 10 scroll passes (3D)', 'C full-page scroll pass x10', 'B theme toggle x30'],
  ['D 20 resizes', 'D resize mobile<->desktop x20', 'C full-page scroll pass x10'],
  ['E 3 s idle + GC', 'E after 3 s idle + GC', 'D resize mobile<->desktop x20'],
]
P('| action | Δ heap KB | Δ DOM nodes | Δ listeners |')
P('|---|---|---|---|')
for (const [name, a, b] of rows) {
  const A = at(a), B = at(b)
  P(`| ${name} | ${round(A.heap - B.heap)} | ${A.nodes - B.nodes} | ${A.lst - B.lst} |`)
}
P(`\nTotal heap growth baseline → end: ${round(at('E after 3 s idle + GC').heap - base.heap)} KB (${round((100 * (at('E after 3 s idle + GC').heap - base.heap)) / base.heap, 1)} %)`)
P(`Total node growth baseline → end: ${at('E after 3 s idle + GC').nodes - base.nodes}`)
P(`Total listener growth baseline → end: ${at('E after 3 s idle + GC').lst - base.lst}`)
P(`Layout count baseline ${median(runs.map((r) => r[0].layouts))} → end ${median(runs.map((r) => r[r.length - 1].layouts))}`)
P(`Style recalcs baseline ${median(runs.map((r) => r[0].recalcs))} → end ${median(runs.map((r) => r[r.length - 1].recalcs))}`)
P(`WebGL contexts created: ${median(runs.map((r) => r[r.length - 1].ctxs))} · contexts lost: ${median(runs.map((r) => r[r.length - 1].lost))} · canvas elements: ${median(runs.map((r) => r[r.length - 1].canvases))}`)

writeFileSync(new URL('./07-memory.md', import.meta.url), L.join('\n'))
writeFileSync(new URL('./07-memory.json', import.meta.url), JSON.stringify(runs, null, 1))
console.log('\nwrote 07-memory.md')
