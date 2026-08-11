/**
 * L7-07b — isolate the heap/listener/Document growth seen in 07.
 * The Google Maps embed is third-party and explicitly out of scope, so every
 * variant is run with the maps iframe BLOCKED, and one variant with it allowed
 * for comparison. All samples taken after HeapProfiler.collectGarbage().
 * 3 reps per variant.
 */
import { chromium } from 'file:///D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
import { writeFileSync } from 'node:fs'
import { BASE, median, round, rng } from './lib.mjs'

const L = []
const P = (s) => { L.push(s); console.log(s) }
const M = (m, k) => (m.metrics.find((x) => x.name === k) || {}).value || 0
const browser = await chromium.launch()

const mk = async (blockMaps) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  if (blockMaps) await page.route('**://www.google.com/**', (r) => r.abort())
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  await cdp.send('HeapProfiler.enable')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await page.waitForFunction(() => document.querySelector('[data-reveal].shown') !== null, null, { timeout: 20000 }).catch(() => {})
  return { ctx, page, cdp }
}
const snap = async (cdp) => {
  await cdp.send('HeapProfiler.collectGarbage')
  const m = await cdp.send('Performance.getMetrics')
  return { heap: M(m, 'JSHeapUsedSize') / 1024, nodes: M(m, 'Nodes'), lst: M(m, 'JSEventListeners'), docs: M(m, 'Documents') }
}
const resizeN = async (page, n) => {
  for (let k = 0; k < n; k++) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForFunction(() => innerWidth === 1440, null, { timeout: 5000 })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(() => innerWidth === 390, null, { timeout: 5000 })
  }
}
const scrollPass = async (page, n) => {
  for (let k = 0; k < n; k++) {
    await page.evaluate(async () => {
      const step = Math.round(innerHeight * 0.8)
      const end = document.documentElement.scrollHeight
      for (let y = 0; y <= end; y += step) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
      for (let y = end; y >= 0; y -= step) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)) }
    })
  }
}

const variants = [
  {
    name: 'V1 maps BLOCKED · 20 resizes, 3D never loaded',
    blockMaps: true,
    steps: [['after load', async () => {}], ['+5 resizes', (p) => resizeN(p, 5)], ['+10', (p) => resizeN(p, 5)], ['+15', (p) => resizeN(p, 5)], ['+20', (p) => resizeN(p, 5)]],
  },
  {
    name: 'V2 maps BLOCKED · 3D loaded, then 20 resizes',
    blockMaps: true,
    pre: async (p) => { await p.evaluate(() => document.getElementById('teknik').scrollIntoView({ block: 'center' })); await p.waitForFunction(() => document.getElementById('expCanvas').width > 0, null, { timeout: 30000 }) },
    steps: [['after 3D boot', async () => {}], ['+5 resizes', (p) => resizeN(p, 5)], ['+10', (p) => resizeN(p, 5)], ['+15', (p) => resizeN(p, 5)], ['+20', (p) => resizeN(p, 5)]],
  },
  {
    name: 'V3 maps BLOCKED · 10 full-page scroll passes',
    blockMaps: true,
    steps: [['after load', async () => {}], ['+2 passes', (p) => scrollPass(p, 2)], ['+4', (p) => scrollPass(p, 2)], ['+6', (p) => scrollPass(p, 2)], ['+8', (p) => scrollPass(p, 2)], ['+10', (p) => scrollPass(p, 2)]],
  },
  {
    name: 'V4 maps ALLOWED · 10 full-page scroll passes',
    blockMaps: false,
    steps: [['after load', async () => {}], ['+2 passes', (p) => scrollPass(p, 2)], ['+4', (p) => scrollPass(p, 2)], ['+6', (p) => scrollPass(p, 2)], ['+8', (p) => scrollPass(p, 2)], ['+10', (p) => scrollPass(p, 2)]],
  },
]

P('# L7-07b leak isolation (mobile 390x844 DPR2, CPU 4x, post-GC samples, 3 reps)')
for (const v of variants) {
  const reps = []
  for (let r = 0; r < 3; r++) {
    const { ctx, page, cdp } = await mk(v.blockMaps)
    if (v.pre) await v.pre(page)
    const seq = []
    for (const [label, fn] of v.steps) { await fn(page); seq.push({ label, ...(await snap(cdp)) }) }
    reps.push(seq)
    await ctx.close()
  }
  P(`\n## ${v.name}`)
  P('| checkpoint | heap KB | range | Δ heap vs first | DOM nodes | listeners | Documents |')
  P('|---|---|---|---|---|---|---|')
  for (let i = 0; i < reps[0].length; i++) {
    const h = reps.map((s) => s[i].heap)
    const h0 = reps.map((s) => s[0].heap)
    P(`| ${reps[0][i].label} | ${round(median(h))} | ${rng(h)} | ${round(median(h) - median(h0))} | ${median(reps.map((s) => s[i].nodes))} | ${median(reps.map((s) => s[i].lst))} | ${median(reps.map((s) => s[i].docs))} |`)
  }
  const last = reps[0].length - 1
  P(`→ heap ${round(median(reps.map((s) => s[last].heap)) - median(reps.map((s) => s[0].heap)))} KB, listeners +${median(reps.map((s) => s[last].lst)) - median(reps.map((s) => s[0].lst))}, Documents +${median(reps.map((s) => s[last].docs)) - median(reps.map((s) => s[0].docs))}`)
}

await browser.close()
writeFileSync(new URL('./07b-leak-isolate.md', import.meta.url), L.join('\n'))
console.log('\nwrote 07b-leak-isolate.md')
