// BLOCK 13 — WebGL context loss (common on Android under memory pressure / long backgrounding).
// ExplodedUnit.astro registers no 'webglcontextlost'/'webglcontextrestored' handler.
// Technique: fault injection via WEBGL_lose_context, then observe + attempt recovery.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const b = await chromium.launch()
for (const run of [1, 2]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`${m.type()}: ${m.text().slice(0, 120)}`) })
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
  await page.waitForTimeout(1200)

  const painted = async () => await page.evaluate(() => {
    const c = document.getElementById('expCanvas')
    // sample the canvas via a 2d copy — non-zero pixels mean something is drawn
    const t = document.createElement('canvas'); t.width = 60; t.height = 40
    const g = t.getContext('2d'); g.drawImage(c, 0, 0, 60, 40)
    const d = g.getImageData(0, 0, 60, 40).data
    let nz = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) nz++
    return nz
  })
  const before = await painted()
  const lost = await page.evaluate(() => {
    const c = document.getElementById('expCanvas')
    const g = c.getContext('webgl2') || c.getContext('webgl')
    const ext = g && g.getExtension('WEBGL_lose_context')
    if (!ext) return 'no extension'
    ext.loseContext()
    return 'lost'
  })
  await page.waitForTimeout(2500)
  const after = await painted()
  const handlers = await page.evaluate(() => {
    const c = document.getElementById('expCanvas')
    const g = c.getContext('webgl2') || c.getContext('webgl')
    return { contextLost: g ? g.isContextLost() : null, hasOnLost: typeof c.onwebglcontextlost === 'function' }
  })
  if (run === 1) {
    console.log('\n===== 13 WebGL context loss =====')
    info(`loseContext() -> ${lost}`)
    info(`painted pixels before=${before} after=${after}; ${JSON.stringify(handlers)}`)
    info(`console/pageerrors: ${JSON.stringify([...new Set(errs)]).slice(0, 400)}`)
    await page.screenshot({ path: `${DIR}/b13-webgl-context-lost.png` })
  }
  ok(after > before * 0.2, `13 run${run}: the drawing survives (or is restored after) a WebGL context loss`, `painted before=${before} after=${after}`)
  // does scrolling away and back recover it?
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600)
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView()); await page.waitForTimeout(1800)
  const rec = await painted()
  ok(rec > before * 0.2, `13 run${run}: scrolling away and back restores the drawing`, `painted=${rec}`)
  // does a reload recover it?
  await page.reload({ waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('teknik').scrollIntoView())
  await page.waitForFunction(() => { const c = document.getElementById('expCanvas'); return c && c.width > 200 }, null, { timeout: 20000 })
  await page.waitForTimeout(1500)
  const rel = await painted()
  ok(rel > before * 0.2, `13 run${run}: a reload restores the drawing`, `painted=${rel}`)
  const legend = await page.evaluate(() => ({ on: document.querySelectorAll('#expLegend li.on').length, stageH: Math.round(document.getElementById('expStage').getBoundingClientRect().height) }))
  ok(legend.stageH > 200, `13 run${run}: the stage never collapses`, JSON.stringify(legend))
  await ctx.close()
}
await b.close()
